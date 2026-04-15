import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class JunkyardScene extends Phaser.Scene {
    constructor() {
        super('JunkyardScene')
    }

    preload() {
        this.load.image('junkyard-bg', 'assets/images/junkyard-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background ────────────────
        this.bg = this.add.image(0, 0, 'junkyard-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        // ─── Junk piles ────────────────
        this.add.rectangle(300, H - 200, 120, 80, 0x666644).setAlpha(0.4)
        this.add.text(270, H - 240, '📦', { fontSize: '36px' }).setDepth(2)

        this.add.rectangle(700, H - 220, 150, 100, 0x555533).setAlpha(0.4)
        this.add.text(665, H - 265, '⚙️', { fontSize: '40px' }).setDepth(2)

        this.add.rectangle(1200, H - 200, 130, 90, 0x777755).setAlpha(0.4)
        this.add.text(1170, H - 240, '🔩', { fontSize: '36px' }).setDepth(2)

        // ─── Trader ────────────────────
        this.trader = this.add.rectangle(W - 300, H / 2, 60, 90, 0xff8800).setDepth(2)
        this.traderLabel = this.add.text(W - 340, H / 2 - 80, '🧑 Trader', {
            fontSize: '22px',
            fill: '#ff8800'
        }).setDepth(3)

        // ─── Interact hint ─────────────
        this.interactHint = this.add.text(0, 0, 'Press E to talk', {
            fontSize: '20px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(20).setVisible(false)

        // ─── Player ────────────────────
         this.player = this.physics.add.image(400, 850)
        this.player.setDisplaySize(32, 48)
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
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

        // ─── Dialog ────────────────────
        this.dialog = new DialogBox(this)

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 50, '🗑️ Junkyard', {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)
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

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed)
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        // ─── Check distance to trader ──
        const traderDist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.trader.x, this.trader.y
        )

        if (traderDist < 150) {
            // Show hint above trader
            this.interactHint.setVisible(true)
            this.interactHint.setPosition(
                this.trader.x - 70,
                this.trader.y - 120
            )
            this.trader.setStrokeStyle(3, 0xffff00)

            // Press E to talk
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.talkToTrader()
            }
        } else {
            this.interactHint.setVisible(false)
            this.trader.setStrokeStyle(0)
        }

        this.ui.updateStats()
    }

    talkToTrader() {
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
                { name: 'Trader', text: 'Be careful out there. The city\'s not what it seems...' }
            ], () => {
                GameState.spendMoney(500)
                GameState.armor.hasCore = true
                GameState.addArmorPart('core')
                GameState.setFlag('boughtCore')
                GameState.advanceLevel()
                this.ui.updateStats()
            })

        } else if (GameState.getFlag('boughtCore')) {
            this.dialog.show([
                { name: 'Trader', text: 'You already have the core. Go build that armor!' }
            ])

        } else {
            this.dialog.show([
                { name: 'Trader', text: `Got 500 coins yet? You only have ${GameState.money}. Keep working!` }
            ])
        }
    }
}