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
        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background ────────────────
        this.bg = this.add.image(0, 0, 'workshop-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = this.cameras.main.height / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, this.cameras.main.height)
        this.cameras.main.setBounds(0, 0, scaledWidth, this.cameras.main.height)

        // ─── Interactable Stations ─────
        this.stations = [
            {
                rect: this.add.rectangle(460, 350, 400, 400, 0x8b4513).setDepth(1),
                label: this.add.text(270, 310, '🔧 Repair Bench', { fontSize: '13px', fill: '#fff' }).setDepth(2),
                name: 'Repair Bench'
            },
            {
                rect: this.add.rectangle(1050, 350, 400, 400, 0x555577).setDepth(1),
                label: this.add.text(770, 310, '⚡ Generator', { fontSize: '13px', fill: '#fff' }).setDepth(2),
                name: 'Generator'
            },
            {
                rect: this.add.rectangle(1750, 350, 600, 400, 0x665544).setDepth(1),
                label: this.add.text(1265, 310, '🔩 Engine Rack', { fontSize: '13px', fill: '#fff' }).setDepth(2),
                name: 'Engine Rack'
            }
        ]
        
        
        // ─── Press E hint (hidden by default) ──
        this.interactHint = this.add.text(0, 0, 'Press E to interact', {
            fontSize: '13px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 6, y: 3 }
        }).setDepth(20).setVisible(false)

        // ─── Player ────────────────────
        this.player = this.physics.add.image(400, 400)
        this.player.setDisplaySize(32, 48)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(400, 400, 32, 48, 0x00ff88)
        this.playerGfx.setDepth(10)
        this.playerGfx.setScale(3.25)

        // ─── Camera ────────────────────
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // ─── Controls ──────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.eKey = this.input.keyboard.addKey('E')
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
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
        this.add.text(400, 40, '🔧 Workshop', {
            fontSize: '18px',
            fill: '#fff'
        }).setScrollFactor(0).setDepth(20)

        this.nearStation = null
    }

    update() {
        const speed = 200

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

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed)
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        // ─── Check distance to stations ─
        this.nearStation = null

        this.stations.forEach(station => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                station.rect.x, station.rect.y
            )

            if (dist < 80) {
                this.nearStation = station

                // Show hint above station
                this.interactHint.setVisible(true)
                this.interactHint.setPosition(
                    station.rect.x - 60,
                    station.rect.y - 70
                )

                // Highlight station
                station.rect.setStrokeStyle(2, 0xffff00)
            } else {
                // Remove highlight
                station.rect.setStrokeStyle(0)
            }
        })

        // Hide hint if not near anything
        if (!this.nearStation) {
            this.interactHint.setVisible(false)
        }

        // ─── Press E to interact ────────
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearStation) {
            this.onInteract(this.nearStation.name)
        }

        this.ui.updateStats()
    }

    onInteract(stationName) {
        if (stationName === 'Repair Bench') {
            this.dialog.show([
                { name: 'You', text: 'Let me fix this device...' },
                { name: 'You', text: 'Done! That should earn me some coin.' }
            ])
        }

        if (stationName === 'Generator') {
            this.dialog.show([
                { name: 'You', text: 'This generator needs some tuning...' },
                { name: 'You', text: 'Fixed! The power output is stable now.' }
            ])
        }

        if (stationName === 'Engine Rack') {
            this.dialog.show([
                { name: 'You', text: 'These engine parts need assembly...' },
                { name: 'You', text: 'Finished. Not bad for a days work.' }
            ])
        }
    }
}