import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class WorkshopScene extends Phaser.Scene {
    constructor() {
        super('WorkshopScene')
    }

    preload() {
        this.load.image('workshop-bg', 'assets/images/workshop-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background ────────────────
        this.bg = this.add.image(0, 0, 'workshop-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        // ─── Interactable Stations ─────
        this.stations = [
            {
                rect: this.add.rectangle(820, 800, 700, 600, 0x8b4513).setDepth(1).setAlpha(0.3),
                label: this.add.text(720, 500, '🔧 Hardware Bench', { fontSize: '22px', fill: '#fff' }).setDepth(2),
                lockLabel: null,
                name: 'Hardware Bench',
                cooldown: false,
                locked: false
            },
            {
                rect: this.add.rectangle(1930, 800, 700, 600, 0x555577).setDepth(1).setAlpha(0.3),
                label: this.add.text(1830, 500, '⚡ Electrical Bench', { fontSize: '22px', fill: '#fff' }).setDepth(2),
                lockLabel: null,
                name: 'Electrical Bench',
                cooldown: false,
                locked: !GameState.getFlag('electricalUnlocked')
            },
            {
                rect: this.add.rectangle(3250, 800, 1200, 600, 0x9b59b6).setDepth(1).setAlpha(0.3),
                label: this.add.text(3100, 500, '🔮 Magical Bench', { fontSize: '22px', fill: '#fff' }).setDepth(2),
                lockLabel: null,
                name: 'Magical Bench',
                cooldown: false,
                locked: false
            }
        ]

        // Show lock on generator if locked
        if (this.stations[1].locked) {
            this.stations[1].rect.setAlpha(0.15)
            this.stations[1].lockLabel = this.add.text(1830, 550, '🔒 Need 5 repair skill', {
                fontSize: '18px',
                fill: '#ff4444'
            }).setDepth(3)
        }

        // ─── Press E hint ──────────────
        this.interactHint = this.add.text(0, 0, 'Press E to interact', {
            fontSize: '20px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(20).setVisible(false)

        // ─── Player ────────────────────
        this.player = this.physics.add.image(400, 850)
        this.player.setDisplaySize(104, 156)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(400, 850, 32, 48, 0x00ff88)
        this.playerGfx.setDepth(10)
        this.playerGfx.setScale(7.25)

        // ─── Camera ────────────────────
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // ─── Controls ──────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.eKey = this.input.keyboard.addKey('E')
        this.wasd = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

        // ─── Dialog ────────────────────
        this.dialog = new DialogBox(this)
        this.dialog.show([
            { name: 'You', text: 'My workshop... at least this place is still standing.' },
            { name: 'You', text: 'The armor is half done. I need a power core.' }
        ])

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 50, '🔧 Workshop', {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        this.nearStation = null
    }

    update() {
        const speed = 600

        if (this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
            return
        }

        this.player.setVelocity(0)

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed)
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        // ─── Check if generator unlocked now ─
        if (this.stations[1].locked && GameState.getFlag('electricalUnlocked')) {
            this.stations[1].locked = false
            this.stations[1].rect.setAlpha(0.3)
            if (this.stations[1].lockLabel) {
                this.stations[1].lockLabel.destroy()
            }
            this.dialog.show([
                { name: 'You', text: '⚡ My repair skills are good enough now!' },
                { name: 'You', text: 'I can work on the Generator!' }
            ])
        }

        // ─── Check distance to stations ─
        this.nearStation = null

        this.stations.forEach(station => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                station.rect.x, station.rect.y
            )

            if (dist < 200) {
                this.nearStation = station

                this.interactHint.setVisible(true)
                this.interactHint.setPosition(
                    station.rect.x - 80,
                    station.rect.y - 350
                )

                station.rect.setStrokeStyle(3, station.locked ? 0xff0000 : 0xffff00)
                if (!station.locked) station.rect.setAlpha(0.5)
            } else {
                station.rect.setStrokeStyle(0)
                if (!station.locked) station.rect.setAlpha(0.3)
            }
        })

        if (!this.nearStation) {
            this.interactHint.setVisible(false)
        }

        // ─── Press E to interact ────────
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearStation) {
            this.onInteract(this.nearStation)
        }

        // ─── Check if can meet trader ───
        if (GameState.canMeetTrader() && !this.shownTraderHint) {
            this.shownTraderHint = true
            this.dialog.show([
                { name: 'You', text: 'I know enough now to look for parts.' },
                { name: 'You', text: 'Maybe the Junkyard trader has what I need.' }
            ])
        }

        this.ui.updateStats()
    }

    onInteract(station) {
        if (station.locked) {
            this.dialog.show([
                { name: 'You', text: '🔒 I need more repair skill to work on this.' }
            ])
            return
        }

        if (station.cooldown) {
            this.dialog.show([
                { name: 'You', text: 'I just worked on this. Let me rest a bit.' }
            ])
            return
        }

        if (station.name === 'Hardware Bench') {
            this.scene.pause('WorkshopScene')
            this.scene.launch('PressureValveGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        if (station.name === 'Electrical Bench') {
            this.scene.pause('WorkshopScene')
            this.scene.launch('WireConnectGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        if (station.name === 'Magical Bench') {
            this.scene.pause('WorkshopScene')
            this.scene.launch('EnergyCalibrationGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }
    }
}