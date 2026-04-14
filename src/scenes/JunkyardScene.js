import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class JunkyardScene extends Phaser.Scene {
    constructor() {
        super('JunkyardScene')
    }

    create() {
        this.cameras.main.setBackgroundColor('#2a2a1e')

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.createAll()

        // ─── Room ──────────────────────
        this.add.rectangle(400, 550, 800, 100, 0x3d3d2e)

        this.add.rectangle(100, 400, 80, 60, 0x666644)
        this.add.text(75, 385, '📦', { fontSize: '24px' })

        this.add.rectangle(300, 350, 100, 80, 0x555533)
        this.add.text(270, 330, '⚙️', { fontSize: '28px' })

        this.add.rectangle(600, 380, 90, 70, 0x777755)
        this.add.text(575, 365, '🔩', { fontSize: '24px' })

        this.trader = this.add.rectangle(700, 400, 32, 48, 0xff8800)
        this.add.text(680, 350, 'Trader', { fontSize: '12px', fill: '#ff8800' })

        // ─── Player ────────────────────
        this.player = this.physics.add.image(400, 480)
        this.player.setDisplaySize(32, 48)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(400, 480, 32, 48, 0x00ff88)

        // ─── Controls ──────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Dialog ────────────────────
        this.dialog = new DialogBox(this)

        this.add.text(300, 40, '🗑️ Junkyard', { fontSize: '18px', fill: '#fff' })
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

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed)
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed)
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed)
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            let traderDist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.trader.x, this.trader.y
            )
            if (traderDist < 60) {
                if (!GameState.getFlag('metTrader')) {
                    this.dialog.show([
                        { name: 'Trader', text: 'Hey kid! Looking for something?' },
                        { name: 'You', text: 'I need a power core for my armor.' },
                        { name: 'Trader', text: 'A power core? Hmm... I might have one.' },
                        { name: 'Trader', text: 'But it wont be cheap. Come back with 500 coins.' }
                    ])
                    GameState.setFlag('metTrader')
                } else if (GameState.money >= 500 && !GameState.getFlag('boughtCore')) {
                    this.dialog.show([
                        { name: 'Trader', text: 'You got the coins! Here\'s your power core.' },
                        { name: 'You', text: 'Finally! Now I can work on the armor.' },
                        { name: 'Trader', text: 'Be careful out there. The city\'s not what it seems.' }
                    ], () => {
                        GameState.spendMoney(500)
                        GameState.armor.hasCore = true
                        GameState.addArmorPart('core')
                        GameState.setFlag('boughtCore')
                        GameState.advanceLevel()
                        this.ui.updateStats()
                    })
                } else {
                    this.dialog.show([
                        { name: 'Trader', text: `Got 500 coins yet? You have ${GameState.money}. Keep working!` }
                    ])
                }
            }
        }

        this.ui.updateStats()
    }
}