import DialogBox from '../dialog.js'

export default class HubScene extends Phaser.Scene {
    constructor() {
        super('HubScene')
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e')

        this.add.text(400, 20, '🏘️ City Map', {
            fontSize: '22px',
            fill: '#ffffff'
        }).setOrigin(0.5)

        this.add.text(400, 50, 'Click a location to travel there', {
            fontSize: '13px',
            fill: '#888888'
        }).setOrigin(0.5)

        this.add.rectangle(400, 320, 700, 450, 0x2a2a3e)

        // Locations - unlock based on GameState
        this.createLocation(180, 200, 'Workshop', '🔧', 0x8b4513, 'WorkshopScene', true)
        this.createLocation(500, 200, 'Junkyard', '🗑️', 0x555533, 'JunkyardScene', true)
        this.createLocation(180, 380, 'Park', '🌿', 0x2d5a27, null, GameState.level >= 3)
        this.createLocation(500, 380, "King's Palace", '👑', 0x5c415d, null, GameState.level >= 2)
        this.createLocation(340, 290, 'Town Center', '🏛️', 0x3a506b, null, false)
        this.createLocation(620, 300, 'Enemy Territory', '💀', 0x5a1a1a, null, GameState.flags.enemyTerritoryUnlocked)

        // Stats bar at bottom
        this.statsText = this.add.text(10, 570, '', {
            fontSize: '13px',
            fill: '#aaaaaa'
        })
        this.updateStats()
    }

    updateStats() {
        this.statsText.setText(
            `💰 ${GameState.money} | ⭐ ${GameState.reputation} | 🔧 ${GameState.skills.repair} | ⚗️ ${GameState.elixir} | Level ${GameState.level}`
        )
    }

    createLocation(x, y, label, icon, color, targetScene, unlocked) {
        const box = this.add.rectangle(x, y, 130, 80, color)
        box.setStrokeStyle(2, unlocked ? 0x00ff88 : 0x444444)
        box.setAlpha(unlocked ? 1 : 0.5)

        this.add.text(x, y - 12, icon, {
            fontSize: '22px'
        }).setOrigin(0.5)

        this.add.text(x, y + 18, label, {
            fontSize: '12px',
            fill: unlocked ? '#ffffff' : '#666666'
        }).setOrigin(0.5)

        if (!unlocked) {
            this.add.text(x + 45, y - 35, '🔒', {
                fontSize: '14px'
            }).setOrigin(0.5)
        }

        if (unlocked) {
            this.tweens.add({
                targets: box,
                alpha: 0.6,
                duration: 900,
                yoyo: true,
                repeat: -1
            })
        }

        if (unlocked && targetScene) {
            box.setInteractive({ useHandCursor: true })

            box.on('pointerover', () => {
                box.setStrokeStyle(3, 0xffffff)
                this.showTooltip(x, y - 55, `Go to ${label}`)
            })

            box.on('pointerout', () => {
                box.setStrokeStyle(2, 0x00ff88)
                this.hideTooltip()
            })

            box.on('pointerdown', () => {
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => {
                    this.scene.start(targetScene)
                })
            })
        }

        if (!unlocked) {
            box.setInteractive()
            box.on('pointerover', () => {
                this.showTooltip(x, y - 55, '🔒 Locked')
            })
            box.on('pointerout', () => {
                this.hideTooltip()
            })
        }
    }

    showTooltip(x, y, message) {
        this.tooltip = this.add.text(x, y, message, {
            fontSize: '13px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(200)
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy()
            this.tooltip = null
        }
    }
}