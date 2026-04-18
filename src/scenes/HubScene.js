import UI from '../ui.js'

export default class HubScene extends Phaser.Scene {
    constructor() {
        super('HubScene')
    }

    preload() {
        this.load.image('hub-bg', 'assets/images/hub-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()
        if (!GameState.getFlag('introSeen')) {
            this.scene.start('CutsceneScene', {
                key: 'gameIntro',
                returnScene: 'HubScene'
            })
            return  // Don't create hub yet
        }

        // ─── Background ────────────────
        // If you have a bg image uncomment below
        // this.bg = this.add.image(0, 0, 'hub-bg').setOrigin(0,0).setDepth(-1)
        // const scaleY = H / this.bg.height
        // this.bg.setScale(scaleY)

        // Placeholder background for now
        this.cameras.main.setBackgroundColor('#1a1a2e')

        // ─── Title ─────────────────────
        this.add.text(W / 2, 50, '🏘️ City Map', {
            fontSize: '42px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1)

        this.add.text(W / 2, 105, 'Click a location to travel there', {
            fontSize: '22px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(1)

        // ─── Map background panel ───────
        this.add.rectangle(W / 2, H / 2 + 40, W - 200, H - 220, 0x2a2a3e).setDepth(0)

        // ─── Locations ─────────────────
        const col1 = W * 0.2
        const col2 = W * 0.4
        const col3 = W * 0.6
        const col4 = W * 0.8
        const row1 = H * 0.35
        const row2 = H * 0.6
        const row3 = H * 0.8

        this.createLocation(col1, row1, 'Workshop', '🔧', 0x8b4513, 'WorkshopScene', true)
        this.createLocation(col2, row1, 'Junkyard', '🗑️', 0x555533, 'JunkyardScene', true)
        this.createLocation(
            col3, row1,
            "King's Palace", '👑', 0x5c415d,
            GameState.level >= 3 && GameState.getFlag('gfCalledComms')
                ? 'Level3PalaceScene'  // ← betrayal scene
                : 'PalaceScene',       // ← normal palace
            GameState.level >= 2
        )
        this.createLocation(col4, row1, 'Town Center', '🏛️', 0x3a506b, 'TownCenterScene', GameState.getFlag('metKing'))
        this.createLocation(col1, row2, 'Park', '🌿', 0x2d5a27, 'ParkScene', GameState.getFlag('metLuvaza'))
        this.createLocation(col2, row2, 'Enemy Territory', '💀', 0x5a1a1a, 'EnemyScene', GameState.flags.enemyTerritoryUnlocked)

        // ─── Level indicator ───────────
        this.add.text(W / 2, H - 60, `Current Level: ${GameState.level}`, {
            fontSize: '22px',
            fill: '#00ff88'
        }).setOrigin(0.5).setDepth(1)
    }

    createLocation(x, y, label, icon, color, targetScene, unlocked) {
        // Box
        const box = this.add.rectangle(x, y, 200, 120, color)
        box.setStrokeStyle(3, unlocked ? 0x00ff88 : 0x444444)
        box.setAlpha(unlocked ? 1 : 0.5)
        box.setDepth(1)

        // Icon
        this.add.text(x, y - 20, icon, {
            fontSize: '36px'
        }).setOrigin(0.5).setDepth(2)

        // Label
        this.add.text(x, y + 30, label, {
            fontSize: '18px',
            fill: unlocked ? '#ffffff' : '#666666'
        }).setOrigin(0.5).setDepth(2)

        // Lock icon
        if (!unlocked) {
            this.add.text(x + 70, y - 50, '🔒', {
                fontSize: '20px'
            }).setOrigin(0.5).setDepth(2)
        }

        // Pulse on unlocked
        if (unlocked) {
            this.tweens.add({
                targets: box,
                alpha: 0.6,
                duration: 900,
                yoyo: true,
                repeat: -1
            })
        }

        // Click - unlocked
        if (unlocked && targetScene) {
            box.setInteractive({ useHandCursor: true })

            box.on('pointerover', () => {
                box.setStrokeStyle(4, 0xffffff)
                this.showTooltip(x, y - 90, `Go to ${label}`)
            })

            box.on('pointerout', () => {
                box.setStrokeStyle(3, 0x00ff88)
                this.hideTooltip()
            })

            box.on('pointerdown', () => {
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => {
                    this.scene.start(targetScene)
                })
            })
        }

        // Click - locked
        if (!unlocked) {
            box.setInteractive()
            box.on('pointerover', () => {
                this.showTooltip(x, y - 90, '🔒 Locked')
            })
            box.on('pointerout', () => {
                this.hideTooltip()
            })
        }
    }

    showTooltip(x, y, message) {
        this.tooltip = this.add.text(x, y, message, {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(200)
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy()
            this.tooltip = null
        }
    }
}