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

        // ─── Trader ────────────────────
        this.trader = this.add.rectangle(1700, 850, 32, 48, 0xff8800).setDepth(2).setScale(7.25)
        this.add.text(1600, 700, '🧑 Trader', {
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

        // ─── Menu ──────────────────────
        this.menuActive = false
        this.menuItems = []
        this.shopItems = []

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 50, '🗑️ Junkyard', {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)
    }

    update() {
        const speed = 600

        if (this.dialog.isActive || this.menuActive) {
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

        // ─── Check distance to trader ──
        const traderDist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.trader.x, this.trader.y
        )

        if (traderDist < 150) {
            this.interactHint.setVisible(true)
            this.interactHint.setPosition(
                this.trader.x - 70,
                this.trader.y - 120
            )
            this.trader.setStrokeStyle(3, 0xffff00)

            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                if (!GameState.canMeetTrader()) {
                    this.dialog.show([
                        { name: 'Trader', text: 'Come back when you know what you\'re doing kid.' },
                        { name: '', text: '🔒 Need 10 repair skill to talk to Trader.' }
                    ])
                } else {
                    this.showTraderMenu()
                }
            }
        } else {
            this.interactHint.setVisible(false)
            this.trader.setStrokeStyle(0)
        }

        this.ui.updateStats()
    }

    // ─── Trader Menu ───────────────────────────────────
    showTraderMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true
        GameState.setFlag('metTrader')

        this.menuOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50)

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 500, 400, 0x1a1a2e)
            .setStrokeStyle(3, 0xff8800).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 160, '🧑 Trader', {
            fontSize: '28px',
            fill: '#ff8800',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        this.menuItems = []

        // 💬 Talk
        this.createMenuButton(W / 2, H / 2 - 60, '💬 Talk', () => {
            this.closeMenu()
            this.traderTalk()
        })

        // 🛒 Shop
        this.createMenuButton(W / 2, H / 2 + 20, '🛒 Shop', () => {
            this.closeMenu()
            this.traderShop()
        })

        // 🔐 Secret
        const secretText = GameState.getFlag('boughtCore') ? '🔐 Secret Base' : '🔐 ???'
        const secretLocked = !GameState.getFlag('boughtCore')
        this.createMenuButton(W / 2, H / 2 + 100, secretText, () => {
            if (secretLocked) {
                this.closeMenu()
                this.dialog.show([
                    { name: 'Trader', text: '...' },
                    { name: 'Trader', text: 'You\'re not ready for that yet.' }
                ])
            } else {
                this.closeMenu()
                this.traderSecret()
            }
        }, secretLocked)

        // Close
        this.menuClose = this.add.text(W / 2, H / 2 + 170, '[ Close ]', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: true })
        this.menuClose.on('pointerdown', () => this.closeMenu())
    }

    createMenuButton(x, y, text, onClick, locked = false) {
        const btn = this.add.rectangle(x, y, 350, 50, locked ? 0x222233 : 0x333355)
            .setStrokeStyle(2, locked ? 0x444444 : 0xff8800)
            .setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: !locked })

        const label = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: locked ? '#666666' : '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(53)

        if (!locked) {
            btn.on('pointerover', () => btn.setFillStyle(0x444477))
            btn.on('pointerout', () => btn.setFillStyle(0x333355))
        }
        btn.on('pointerdown', onClick)

        this.menuItems.push(btn, label)
        return btn
    }

    closeMenu() {
        this.menuActive = false
        if (this.menuOverlay) this.menuOverlay.destroy()
        if (this.menuPanel) this.menuPanel.destroy()
        if (this.menuTitle) this.menuTitle.destroy()
        if (this.menuClose) this.menuClose.destroy()
        this.menuItems.forEach(item => item.destroy())
        this.menuItems = []
    }

    // ─── Trader Talk ───────────────────────────────────
    traderTalk() {
        if (!GameState.getFlag('boughtCore')) {
            this.dialog.show([
                { name: 'Trader', text: 'Hey kid! The city\'s falling apart.' },
                { name: 'Trader', text: 'But every broken thing is an opportunity, right?' },
                { name: 'You', text: 'I need parts for my armor. Got anything?' },
                { name: 'Trader', text: 'Check my shop. I might have what you need.' }
            ])
        } else {
            this.dialog.show([
                { name: 'Trader', text: 'You got the core. Smart kid.' },
                { name: 'Trader', text: 'There\'s something else I want to show you...' },
                { name: 'Trader', text: 'But first, make sure nobody followed you here.' }
            ])
        }
    }

    // ─── Trader Shop ───────────────────────────────────
    traderShop() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        this.shopOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50)

        this.shopPanel = this.add.rectangle(W / 2, H / 2, 600, 550, 0x1a1a2e)
            .setStrokeStyle(3, 0xffaa00).setScrollFactor(0).setDepth(51)

        this.shopTitle = this.add.text(W / 2, H / 2 - 240, '🛒 Trader\'s Shop', {
            fontSize: '28px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        this.shopMoney = this.add.text(W / 2, H / 2 - 195, `💰 Your coins: ${GameState.money}`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        this.shopItems = []

        // ─── Item 1: Armor Core ────────
        if (!GameState.getFlag('boughtCore')) {
            this.createShopItem(W / 2, H / 2 - 130, '🤖 Armor Core', 500, () => {
                if (GameState.spendMoney(500)) {
                    GameState.armor.hasCore = true
                    GameState.addArmorPart('core')
                    GameState.setFlag('boughtCore')

                    // Add to inventory
                    GameState.addItem({
                        id: 'armor_core',
                        name: 'Armor Core',
                        icon: '🤖',
                        description: 'Power core for the robotic armor. The heart of the machine.',
                        quantity: 1
                    })

                    this.closeShop()
                    this.dialog.show([
                        { name: 'Trader', text: 'Here\'s your power core. Handle with care.' },
                        { name: 'You', text: 'Finally! Now I can work on the armor.' },
                        { name: 'Trader', text: 'Kid... there\'s something you should see.' },
                        { name: 'Trader', text: 'Follow me to the back.' }
                    ], () => {
                        GameState.setFlag('secretBaseRevealed')
                        GameState.advanceLevel()
                        this.ui.updateStats()
                        this.showSecretBaseCutscene()
                    })
                } else {
                    this.closeShop()
                    this.dialog.show([
                        { name: 'Trader', text: `Not enough coins! You need 500, you have ${GameState.money}.` }
                    ])
                }
            })
        }

        // ─── Item 2: Repair Parts ──────
        this.createShopItem(W / 2, H / 2 - 50, '🔧 Repair Parts (+10 repair)', 100, () => {
            if (GameState.spendMoney(100)) {
                GameState.addSkill('repair', 10)
                GameState.addItem({
                    id: 'repair_parts',
                    name: 'Repair Parts',
                    icon: '🔧',
                    description: 'Useful spare parts for fixing machines.',
                    quantity: 1
                })
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: 'Good parts. Should help your work.' }
                ])
            } else {
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: `Need 100 coins. You have ${GameState.money}.` }
                ])
            }
        })

        // ─── Item 3: Elixir ────────────
        this.createShopItem(W / 2, H / 2 + 30, '⚗️ Elixir (+3)', 150, () => {
            if (GameState.spendMoney(150)) {
                GameState.addElixir(3)
                GameState.addItem({
                    id: 'elixir',
                    name: 'Elixir',
                    icon: '⚗️',
                    description: 'A mysterious liquid with magical properties.',
                    quantity: 3
                })
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: 'Rare stuff. Use it wisely.' }
                ])
            } else {
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: `Need 150 coins. You have ${GameState.money}.` }
                ])
            }
        })

        // ─── Item 4: Blueprint ─────────
        this.createShopItem(W / 2, H / 2 + 110, '📜 Blueprint (+5 research)', 200, () => {
            if (GameState.spendMoney(200)) {
                GameState.addSkill('research', 5)
                GameState.addItem({
                    id: 'blueprint',
                    name: 'Blueprint',
                    icon: '📜',
                    description: 'Old schematics for advanced research.',
                    quantity: 1
                })
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: 'Old schematics. Might come in handy.' }
                ])
            } else {
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: `Need 200 coins. You have ${GameState.money}.` }
                ])
            }
        })

        // Close shop
        this.shopClose = this.add.text(W / 2, H / 2 + 230, '[ Close Shop ]', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: true })
        this.shopClose.on('pointerdown', () => this.closeShop())
    }

    createShopItem(x, y, text, price, onClick) {
        const btn = this.add.rectangle(x, y, 500, 55, 0x333355)
            .setStrokeStyle(1, 0xffaa00)
            .setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: true })

        const label = this.add.text(x - 230, y, text, {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(53)

        const priceText = this.add.text(x + 230, y, `💰 ${price}`, {
            fontSize: '18px',
            fill: '#ffaa00'
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(53)

        btn.on('pointerover', () => btn.setFillStyle(0x444477))
        btn.on('pointerout', () => btn.setFillStyle(0x333355))
        btn.on('pointerdown', onClick)

        this.shopItems.push(btn, label, priceText)
    }

    closeShop() {
        this.menuActive = false
        if (this.shopOverlay) this.shopOverlay.destroy()
        if (this.shopPanel) this.shopPanel.destroy()
        if (this.shopTitle) this.shopTitle.destroy()
        if (this.shopMoney) this.shopMoney.destroy()
        if (this.shopClose) this.shopClose.destroy()
        this.shopItems.forEach(item => item.destroy())
        this.shopItems = []
    }

    // ─── Trader Secret ─────────────────────────────────
    traderSecret() {
        this.dialog.show([
            { name: 'Trader', text: 'Come... let me show you something.' },
            { name: 'Trader', text: 'I\'ve been keeping this hidden for years.' },
            { name: 'Trader', text: 'An underground workshop. Better than anything on the surface.' },
            { name: 'You', text: 'Why are you showing me this?' },
            { name: 'Trader', text: 'Because you\'re the only one who can finish that armor.' },
            { name: 'Trader', text: 'And you\'re going to need it.' }
        ])
    }

    // ─── Secret Base Cutscene ──────────────────────────
    showSecretBaseCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cutsceneOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(100)

        this.add.text(W / 2, H / 2 - 150, '🔐 SECRET BASE DISCOVERED', {
            fontSize: '40px',
            fill: '#ff8800',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        this.add.text(W / 2, H / 2 - 60, 'The Trader reveals a hidden underground workshop.', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        this.add.text(W / 2, H / 2, 'A place where the armor can truly be completed.', {
            fontSize: '24px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        this.add.text(W / 2, H / 2 + 80, 'The city\'s secrets are only beginning to unravel...', {
            fontSize: '22px',
            fill: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        this.add.text(W / 2, H / 2 + 180, '⭐ LEVEL 2 UNLOCKED ⭐', {
            fontSize: '36px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        const cont = this.add.text(W / 2, H / 2 + 280, '[ Click to continue ]', {
            fontSize: '22px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
            .setInteractive({ useHandCursor: true })

        cont.on('pointerdown', () => {
            this.scene.start('HubScene')
        })
    }
}