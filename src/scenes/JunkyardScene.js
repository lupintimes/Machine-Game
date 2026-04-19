import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class JunkyardScene extends Phaser.Scene {
    constructor() {
        super('JunkyardScene')
    }

    preload() {
        // ─── Load all 4 time-of-day backgrounds ───────
        this.load.image('junkyard-morning', 'assets/images/junkyard/junkyard-morning.png')
        this.load.image('junkyard-noon',    'assets/images/junkyard/junkyard-noon.png')
        this.load.image('junkyard-evening', 'assets/images/junkyard/junkyard-evening.png')
        this.load.image('junkyard-night',   'assets/images/junkyard/junkyard-night.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => { if (this.ui) this.ui.destroy() })

        // ─── Background (time-based) ───────────────────
        const bgKey = {
            'morning':   'junkyard-morning',
            'afternoon': 'junkyard-noon',
            'evening':   'junkyard-evening',
            'night':     'junkyard-night'
        }[GameState.timeOfDay] || 'junkyard-morning'

        this.bg = this.add.image(0, 0, bgKey)
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        // ─── Scene Title ───────────────────────────────
        this.add.text(W / 2, 50, '🗑️ Junkyard', {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Menu ──────────────────────────────────────
        this.menuActive = false
        this.menuItems = []
        this.shopItems = []
        this.cutsceneTexts = []

        // ─── Safety: ensure armor object exists ────────
        if (!GameState.armor) {
            GameState.armor = {
                hasCore: false,
                parts: []
            }
        }

        // ─── Show intro dialog then menu ───────────────
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
                if (!this.dialog.isClosed) {
                    this.dialog.next()
                }
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
            btn.on('pointerout',  () => btn.setFillStyle(0x333355))
        }
        btn.on('pointerdown', onClick)

        this.menuItems.push(btn, label)
        return btn
    }

    closeMenu() {
        this.menuActive = false
        if (this.menuOverlay) this.menuOverlay.destroy()
        if (this.menuPanel)   this.menuPanel.destroy()
        if (this.menuTitle)   this.menuTitle.destroy()
        this.menuItems.forEach(item => item.destroy())
        this.menuItems = []
    }

    // ─── Trader Talk ───────────────────────────────────
    traderTalk() {
        if (!GameState.getFlag('boughtCore')) {
            this.dialog.show([
                { name: 'Trader', text: 'Hey kid! The city\'s falling apart.' },
                { name: 'Trader', text: 'But every broken thing is an opportunity, right?' },
                { name: 'You',    text: 'I need parts for my armor. Got anything?' },
                { name: 'Trader', text: 'Check my shop. I might have what you need.' }
            ], () => { this.showTraderMenu() })

        } else if (GameState.level >= 2 && !GameState.getFlag('traderClueFound')) {
            this.dialog.show([
                { name: 'Trader', text: 'You\'ve been busy lately.' },
                { name: 'You',    text: 'Trying to figure out who attacked the city.' },
                { name: 'Trader', text: '...' },
                { name: 'Trader', text: 'Close the door.' },
                { name: 'You',    text: 'What?' },
                { name: 'Trader', text: 'Just do it. Walls have ears in this city.' },
                { name: 'You',    text: '...' },
                { name: 'Trader', text: 'Look. I like you kid. You\'re smart.' },
                { name: 'Trader', text: 'So I\'m going to tell you something.' },
                { name: 'Trader', text: 'Something I probably shouldn\'t.' },
                { name: 'You',    text: 'Tell me.' },
                { name: 'Trader', text: 'Two weeks before the attack...' },
                { name: 'Trader', text: 'A buyer came to me. Wanted to purchase large quantities of explosives.' },
                { name: 'You',    text: 'Did you sell?' },
                { name: 'Trader', text: 'No. Something felt wrong.' },
                { name: 'Trader', text: 'But I got a good look at him.' },
                { name: 'You',    text: 'Who was it?' },
                { name: 'Trader', text: 'I don\'t know his name.' },
                { name: 'Trader', text: 'But he carried a royal seal.' },
                { name: 'You',    text: 'A royal seal...' },
                { name: 'Trader', text: 'Exactly.' },
                { name: 'Trader', text: 'Someone with royal connections planned this attack.' },
                { name: 'You',    text: 'Why didn\'t you report this?' },
                { name: 'Trader', text: 'Report to who? The King?' },
                { name: 'Trader', text: 'What if he already knows?' },
                { name: 'You',    text: '...' },
                { name: 'Trader', text: 'Be careful kid. This goes deeper than you think.' },
                { name: '',       text: '📌 Clue found! Keep investigating.' }
            ], () => {
                GameState.setFlag('traderClueFound')
                this.showTraderMenu()
            })

        } else if (GameState.getFlag('traderClueFound') && !GameState.getFlag('learnedTruth')) {
            this.dialog.show([
                { name: 'Trader', text: 'You remember what I told you.' },
                { name: 'You',    text: 'Royal seal. Two weeks before the attack.' },
                { name: 'Trader', text: 'Keep digging. You\'re close.' },
                { name: 'Trader', text: 'But watch your back.' }
            ], () => { this.showTraderMenu() })

        } else if (GameState.getFlag('learnedTruth')) {
            this.dialog.show([
                { name: 'Trader', text: 'You figured it out didn\'t you.' },
                { name: 'You',    text: 'Yes.' },
                { name: 'Trader', text: 'Then you know what you\'re up against.' },
                { name: 'Trader', text: 'Be very careful who you trust.' }
            ], () => { this.showTraderMenu() })

        } else {
            this.dialog.show([
                { name: 'Trader', text: 'You know where to go now.' },
                { name: 'Trader', text: 'The base is waiting.' }
            ], () => { this.showTraderMenu() })
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

        let itemY = GameState.getFlag('boughtCore')
            ? H / 2 - 90
            : H / 2 - 130

        // ─── Item 1: Armor Core ────────────────────────
        if (!GameState.getFlag('boughtCore')) {
            this.createShopItem(W / 2, itemY, '🤖 Armor Core', 500, () => {
                if (GameState.spendMoney(500)) {
                    if (!GameState.armor) {
                        GameState.armor = { hasCore: false, parts: [] }
                    }

                    GameState.armor.hasCore = true
                    GameState.addArmorPart('core')
                    GameState.setFlag('boughtCore')

                    GameState.addItem({
                        id: 'armor_core',
                        name: 'Armor Core',
                        icon: '🤖',
                        description: 'Power core for the robotic armor.',
                        quantity: 1
                    })

                    GameState.addItem({
                        id: 'comms_device',
                        name: 'Comms Device',
                        icon: '📡',
                        description: 'An old but reliable communication device.',
                        quantity: 1
                    })
                    GameState.setFlag('hasCommsDevice')

                    this.closeShop()

                    this.dialog.show([
                        { name: 'Trader', text: 'Here\'s your power core. Handle with care.' },
                        { name: 'You',    text: 'Finally! Now I can make something with this.' },
                        { name: 'Trader', text: 'Oh wait. Take this too.' },
                        { name: 'Trader', text: 'A communication device. Old tech but reliable.' },
                        { name: 'You',    text: 'What\'s this for?' },
                        { name: 'Trader', text: 'Keep in touch with people you care about.' },
                        { name: 'Trader', text: 'In times like these... communication saves lives.' },
                        { name: '',       text: '📡 Received: Comms Device' },
                        { name: 'Trader', text: 'Kid... there\'s something you should see.' },
                        { name: 'Trader', text: 'Someone smart enough to actually use it.' },
                        { name: 'You',    text: 'What do you mean?' },
                        { name: 'Trader', text: 'I found something underground. Years ago.' },
                        { name: 'Trader', text: 'An armor frame. Ancient engineering.' },
                        { name: 'You',    text: 'What kind of armor?' },
                        { name: 'Trader', text: 'The kind no ordinary human can work with.' },
                        { name: 'Trader', text: 'But you... you understand machines.' },
                        { name: 'Trader', text: 'I think you\'re the one who can finish it.' },
                        { name: 'You',    text: 'Show me.' }
                    ], () => {
                        GameState.setFlag('secretBaseRevealed')
                        GameState.tryAdvanceLevel()
                        this.ui.updateStats()
                        this.showSecretBaseCutscene()
                    })
                } else {
                    this.closeShop()
                    this.dialog.show([
                        { name: 'Trader', text: `Not enough coins! You need 500, you have ${GameState.money}.` }
                    ], () => { this.showTraderMenu() })
                }
            })
            itemY += 80
        }

        // ─── Item 2: Repair Parts ──────────────────────
        this.createShopItem(W / 2, itemY, '🔧 Repair Parts (+10 repair)', 100, () => {
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
        itemY += 80

        // ─── Item 3: Elixir ───────────────────────────
        this.createShopItem(W / 2, itemY, '⚗️ Elixir (+3)', 150, () => {
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
        itemY += 80

        // ─── Item 4: Blueprint ────────────────────────
        this.createShopItem(W / 2, itemY, '📜 Blueprint (+5 research)', 200, () => {
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
        itemY += 80

        // ─── Back ──────────────────────────────────────
        this.shopClose = this.add.text(W / 2, itemY + 40, '[ Back ]', {
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
        btn.on('pointerout',  () => btn.setFillStyle(0x333355))
        btn.on('pointerdown', onClick)

        this.shopItems.push(btn, label, priceText)
    }

    closeShop() {
        this.menuActive = false
        if (this.shopOverlay) this.shopOverlay.destroy()
        if (this.shopPanel)   this.shopPanel.destroy()
        if (this.shopTitle)   this.shopTitle.destroy()
        if (this.shopMoney)   this.shopMoney.destroy()
        if (this.shopClose)   this.shopClose.destroy()
        this.shopItems.forEach(item => item.destroy())
        this.shopItems = []
    }

    // ─── Trader Secret ─────────────────────────────────
    traderSecret() {
        if (!GameState.getFlag('secretBaseVisited')) {
            this.dialog.show([
                { name: 'Trader', text: 'Come... follow me underground.' },
                { name: 'Trader', text: 'Watch your step.' },
                { name: 'Trader', text: 'Not many people know this place exists.' },
                { name: 'You',    text: 'How deep does this go?' },
                { name: 'Trader', text: 'Deep enough that no one will find us.' }
            ], () => {
                GameState.setFlag('secretBaseVisited')
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => {
                    this.scene.start('SecretBaseScene')
                })
            })
        } else {
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

        this.cutsceneTexts.forEach(t => t.destroy())
        this.cutsceneTexts = []

        this.cutsceneOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(100)

        const addText = (x, y, text, style) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(101)
            this.cutsceneTexts.push(t)
            return t
        }

        addText(W / 2, H / 2 - 150, '🔐 SECRET BASE DISCOVERED', {
            fontSize: '40px',
            fill: '#ff8800',
            fontStyle: 'bold'
        })

        addText(W / 2, H / 2 - 60, 'The Trader reveals a hidden underground workshop.', {
            fontSize: '24px',
            fill: '#ffffff'
        })

        addText(W / 2, H / 2, 'An ancient armor frame awaits assembly.', {
            fontSize: '24px',
            fill: '#aaaaaa'
        })

        addText(W / 2, H / 2 + 60, '📡 Comms Device received. Stay connected.', {
            fontSize: '20px',
            fill: '#00ccff',
            fontStyle: 'italic'
        })

        addText(W / 2, H / 2 + 120, 'The city\'s secrets are only beginning to unravel...', {
            fontSize: '22px',
            fill: '#888888',
            fontStyle: 'italic'
        })

        addText(W / 2, H / 2 + 200, '⭐ LEVEL 2 UNLOCKED ⭐', {
            fontSize: '36px',
            fill: '#00ff88',
            fontStyle: 'bold'
        })

        const cont = this.add.text(W / 2, H / 2 + 280, '[ Click to continue ]', {
            fontSize: '22px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
            .setInteractive({ useHandCursor: true })

        this.cutsceneTexts.push(cont)

        cont.on('pointerover', () => cont.setStyle({ fill: '#ffffff' }))
        cont.on('pointerout',  () => cont.setStyle({ fill: '#888888' }))
        cont.on('pointerdown', () => {
            this.cutsceneTexts.forEach(t => t.destroy())
            this.cutsceneTexts = []
            if (this.cutsceneOverlay) this.cutsceneOverlay.destroy()
            this.scene.start('SecretBaseScene')
        })
    }
}