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

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 50, '🗑️ Junkyard', {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Dialog ────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Menu ──────────────────────
        this.menuActive = false
        this.menuItems = []
        this.shopItems = []

        // ─── Show intro dialog then menu
        if (!GameState.getFlag('junkyardIntroSeen')) {
            this.dialog.show([
                { name: 'Trader', text: 'Welcome to Kingdom of trash... All u find here is trash including you' },
                { name: 'Trader', text: 'What can I do for you?' }
            ], () => {
                GameState.setFlag('junkyardIntroSeen')
                this.showTraderMenu()
            })
        } else {
            this.showTraderMenu()
        }
    }

    update() {
        if (this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }

    // ─── Trader Menu ───────────────────────────────────
    showTraderMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true
        GameState.setFlag('metTrader')

        this.menuOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50)

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 500, 450, 0x1a1a2e)
            .setStrokeStyle(3, 0xff8800).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 180, '🧑 Trader', {
            fontSize: '28px',
            fill: '#ff8800',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        this.menuItems = []

        // 💬 Talk
        this.createMenuButton(W / 2, H / 2 - 80, '💬 Talk', () => {
            this.closeMenu()
            this.traderTalk()
        })

        // 🛒 Shop
        this.createMenuButton(W / 2, H / 2, '🛒 Shop', () => {
            this.closeMenu()
            this.traderShop()
        })

        // 🔐 Secret
        const secretText = GameState.getFlag('boughtCore') ? '🔐 Secret Base' : '🔐 ???'
        const secretLocked = !GameState.getFlag('boughtCore')
        this.createMenuButton(W / 2, H / 2 + 80, secretText, () => {
            if (secretLocked) {
                this.closeMenu()
                this.dialog.show([
                    { name: 'Trader', text: '...' },
                    { name: 'Trader', text: 'You\'re not ready for that yet.' }
                ], () => {
                    this.showTraderMenu()
                })
            } else {
                this.closeMenu()
                this.traderSecret()
            }
        }, secretLocked)

        // 🔙 Back
        this.createMenuButton(W / 2, H / 2 + 160, '🔙 Back', () => {
            this.closeMenu()
            this.scene.start('HubScene')
        })
    }

    createMenuButton(x, y, text, onClick, locked = false) {
        const btn = this.add.rectangle(x, y, 350, 55, locked ? 0x222233 : 0x333355)
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
            ], () => {
                this.showTraderMenu()
            })
        } else {
            this.dialog.show([
                { name: 'Trader', text: 'You know where to go now.' },
                { name: 'Trader', text: 'The base is waiting.' }
            ], () => {
                this.showTraderMenu()
            })
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
                    GameState.addItem({
                        id: 'armor_core',
                        name: 'Armor Core',
                        icon: '🤖',
                        description: 'Power core for the robotic armor. The heart of the machine.',
                        quantity: 1
                    })
                    this.closeShop()

                    // ─── First time buying core sequence ──
                    this.dialog.show([
                        { name: 'Trader', text: 'Here\'s your power core. Handle with care.' },
                        { name: 'You', text: 'Finally... this is what I needed.' },
                        { name: 'Trader', text: 'Kid... wait a moment.' },
                        { name: 'Trader', text: 'There\'s something I\'ve been meaning to show someone for a long time.' },
                        { name: 'Trader', text: 'Someone smart enough to actually use it.' },
                        { name: 'You', text: 'What do you mean?' },
                        { name: 'Trader', text: 'I found something underground. Years ago.' },
                        { name: 'Trader', text: 'An armor frame. Ancient engineering. Unlike anything I\'ve ever seen.' },
                        { name: 'You', text: 'What kind of armor?' },
                        { name: 'Trader', text: 'The kind no ordinary human can work with.' },
                        { name: 'Trader', text: 'But you... you bought that core. You understand machines on a different level.' },
                        { name: 'Trader', text: 'I think you\'re the one who can finish it.' },
                        { name: 'You', text: 'Show me.' }
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
                    ], () => {
                        this.showTraderMenu()
                    })
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
                ], () => { this.showTraderMenu() })
            } else {
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: `Need 100 coins. You have ${GameState.money}.` }
                ], () => { this.showTraderMenu() })
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
                ], () => { this.showTraderMenu() })
            } else {
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: `Need 150 coins. You have ${GameState.money}.` }
                ], () => { this.showTraderMenu() })
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
                ], () => { this.showTraderMenu() })
            } else {
                this.closeShop()
                this.dialog.show([
                    { name: 'Trader', text: `Need 200 coins. You have ${GameState.money}.` }
                ], () => { this.showTraderMenu() })
            }
        })

        // ─── Back ──────────────────────
        this.shopClose = this.add.text(W / 2, H / 2 + 230, '[ Back ]', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: true })
        this.shopClose.on('pointerdown', () => {
            this.closeShop()
            this.showTraderMenu()
        })
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
    // Only long dialog on first visit
    traderSecret() {
        if (!GameState.getFlag('secretBaseVisited')) {
            this.dialog.show([
                { name: 'Trader', text: 'Come... follow me underground.' },
                { name: 'Trader', text: 'Watch your step.' },
                { name: 'Trader', text: 'Not many people know this place exists.' },
                { name: 'You', text: 'How deep does this go?' },
                { name: 'Trader', text: 'Deep enough that no one will find us.' }
            ], () => {
                GameState.setFlag('secretBaseVisited')
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => {
                    this.scene.start('SecretBaseScene')
                })
            })
        } else {
            // Short version on repeat visits
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('SecretBaseScene')
            })
        }
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

        this.add.text(W / 2, H / 2, 'An ancient armor frame awaits assembly.', {
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