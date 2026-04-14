import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class WorkshopScene extends Phaser.Scene {
    constructor() {
        super('WorkshopScene')
    }

    create() {
        this.ui = new UI(this)
        this.ui.create()

        this.cameras.main.setBackgroundColor('#2d2d44')

        // ─── Launch UI Scene on top ────
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene')
        }

        // ─── Room ──────────────────────
        this.add.rectangle(400, 550, 800, 100, 0x4a4a5e)
        this.add.rectangle(400, 50, 800, 100, 0x3d3d55)

        this.add.rectangle(150, 300, 120, 60, 0x8b4513)
        this.add.text(105, 285, '🔧 Bench', { fontSize: '14px', fill: '#fff' })

        this.add.rectangle(650, 280, 60, 100, 0x444466)
        this.add.text(625, 250, '🤖', { fontSize: '28px' })
        this.add.text(610, 340, 'Armor', { fontSize: '12px', fill: '#888' })

        // ─── Player ────────────────────
        this.player = this.physics.add.image(400, 400)
        this.player.setDisplaySize(32, 48)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(400, 400, 32, 48, 0x00ff88)

        // ─── Controls ──────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')
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

        this.add.text(300, 40, '🔧 Workshop', { fontSize: '18px', fill: '#fff' })
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

        // ─── Left & Right ──────────────────────────────
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed)
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed)
        }

        // ─── Up & Down ─────────────────────────────────
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed)
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        this.ui.updateStats()
    }
}