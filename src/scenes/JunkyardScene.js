import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class JunkyardScene extends Phaser.Scene {
    constructor() {
        super('JunkyardScene')
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
            'morning': 'junkyard-morning',
            'afternoon': 'junkyard-noon',
            'evening': 'junkyard-evening',
            'night': 'junkyard-night'
        }[GameState.timeOfDay] || 'junkyard-morning'

        this.bg = this.add.image(0, 0, bgKey)
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        // ─── Scene Title ───────────────────────────────
        this.add.text(W / 2, 70, '🗑️ Junkyard', {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Shop state ────────────────────────────────
        this.shopItems = []
        this.cutsceneTexts = []

        // ─── Safety: ensure armor object exists ────────
        if (!GameState.armor) {
            GameState.armor = { hasCore: false, parts: [] }
        }


        if (
            GameState.getFlag('traderFinishing') &&         // ← set when head is built ✅
            !GameState.getFlag('traderCalledArmor')
        ) {
            GameState.setFlag('traderCalledArmor')
            this.dialog.show([
                { name: 'Trader', text: '📡 *comms crackle*' },
                { name: 'Trader', text: 'Kid. You got the plating on?' },
                { name: 'You', text: 'Just finished.' },
                { name: 'Trader', text: 'Good. Get over here.' },
                { name: 'Trader', text: 'There\'s something you need to see before you move on.' }
            ], () => { this.showTraderMenu() })
            return  // skip the normal intro/menu flow below
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
                if (!this.dialog.isClosed && !this.dialog.choicesActive) {
                    this.dialog.next()
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── TRADER MENU (now uses PNG choice panel) ───────
    // ═══════════════════════════════════════════════════

    showTraderMenu() {
        GameState.setFlag('metTrader')

        const secretLabel = GameState.getFlag('boughtCore') ? '🔐 Secret Base' : '🔐 ???'
        const secretLocked = !GameState.getFlag('boughtCore')

        this.dialog.showChoices([
            {
                text: '💬 Talk',
                onSelect: () => this.traderTalk()
            },
            {
                text: '🛒 Shop',
                onSelect: () => this.traderShop()
            },
            {
                text: secretLabel,
                onSelect: () => {
                    if (secretLocked) {
                        this.dialog.show([
                            { name: 'Trader', text: '...' },
                            { name: 'Trader', text: 'You\'re not ready for that yet.' }
                        ], () => { this.showTraderMenu() })
                    } else {
                        this.traderSecret()
                    }
                }
            },
            {
                text: '🔙 Leave',
                onSelect: () => {
                    this.cameras.main.fade(300, 0, 0, 0)
                    this.time.delayedCall(300, () => {
                        this.scene.start('HubScene')
                    })
                }
            }
        ])
    }

    // ═══════════════════════════════════════════════════
    // ─── TRADER TALK ───────────────────────────────────
    // ═══════════════════════════════════════════════════

    traderTalk() {
        if (!GameState.getFlag('boughtCore')) {
            this.dialog.show([
                { name: 'Trader', text: 'Hey kid! The city\'s falling apart.' },
                { name: 'Trader', text: 'But every broken thing is an opportunity, right?' },
                { name: 'You', text: 'I need parts for my armor. Got anything?' },
                { name: 'Trader', text: 'Check my shop. I might have what you need.' }
            ], () => { this.showTraderMenu() })

        } else if (GameState.level >= 2 && !GameState.getFlag('traderClueFound')) {
            this.dialog.show([
                { name: 'Trader', text: 'You\'ve been busy lately.' },
                { name: 'You', text: 'Trying to figure out who attacked the city.' },
                { name: 'Trader', text: '...' },
                { name: 'Trader', text: 'Close the door.' },
                { name: 'You', text: 'What?' },
                { name: 'Trader', text: 'Just do it. Walls have ears in this city.' },
                { name: 'You', text: '...' },
                { name: 'Trader', text: 'Look. I like you kid. You\'re smart.' },
                { name: 'Trader', text: 'So I\'m going to tell you something.' },
                { name: 'Trader', text: 'Something I probably shouldn\'t.' },
                { name: 'You', text: 'Tell me.' },
                { name: 'Trader', text: 'Two weeks before the attack...' },
                { name: 'Trader', text: 'A buyer came to me. Wanted to purchase large quantities of explosives.' },
                { name: 'You', text: 'Did you sell?' },
                { name: 'Trader', text: 'No. Something felt wrong.' },
                { name: 'Trader', text: 'But I got a good look at him.' },
                { name: 'You', text: 'Who was it?' },
                { name: 'Trader', text: 'I don\'t know his name.' },
                { name: 'Trader', text: 'But he carried a royal seal.' },
                { name: 'You', text: 'A royal seal...' },
                { name: 'Trader', text: 'Exactly.' },
                { name: 'Trader', text: 'Someone with royal connections planned this attack.' },
                { name: 'You', text: 'Why didn\'t you report this?' },
                { name: 'Trader', text: 'Report to who? The King?' },
                { name: 'Trader', text: 'What if he already knows?' },
                { name: 'You', text: '...' },
                { name: 'Trader', text: 'Be careful kid. This goes deeper than you think.' },
                { name: '', text: '📌 Clue found! Keep investigating.' }
            ], () => {
                GameState.setFlag('traderClueFound')
                this.showTraderMenu()
            })

        } else if (GameState.getFlag('traderClueFound') && !GameState.getFlag('learnedTruth')) {
            this.dialog.show([
                { name: 'Trader', text: 'You remember what I told you.' },
                { name: 'You', text: 'Royal seal. Two weeks before the attack.' },
                { name: 'Trader', text: 'Keep digging. You\'re close.' },
                { name: 'Trader', text: 'But watch your back.' }
            ], () => { this.showTraderMenu() })

        } else if (GameState.getFlag('learnedTruth')) {
            this.dialog.show([
                { name: 'Trader', text: 'You figured it out didn\'t you.' },
                { name: 'You', text: 'Yes.' },
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
    // ═══════════════════════════════════════════════════
    // ─── TRADER SHOP (now uses the same choice panel) ─
    // ═══════════════════════════════════════════════════

    traderShop() {
        const shopFont = {
            fontSize: '26px',     // Slightly smaller to fit prices nicely
            fill: '#ffffff',      // Gold color for shop items
            fontStyle: 'bold'
        }

        const backFont = {
            fill: '#888888',
            fontStyle: 'italic'
        }

        const choices = []

        if (!GameState.getFlag('boughtCore')) {
            choices.push(
                { text: '🤖 Armor Core — 500💰', style: shopFont, onSelect: () => this.buyArmorCore() },
                { text: '🔧 Repair Parts (+10) — 100💰', style: shopFont, onSelect: () => this.buyRepairParts() },
                { text: '⚗️ Elixir (+3) — 150💰', style: shopFont, onSelect: () => this.buyElixir() },
                { text: '🔙 Back', style: backFont, onSelect: () => this.showTraderMenu() }
            )
        } else {
            choices.push(
                { text: '🔧 Repair Parts (+10) — 100💰', style: shopFont, onSelect: () => this.buyRepairParts() },
                { text: '⚗️ Elixir (+3) — 150💰', style: shopFont, onSelect: () => this.buyElixir() },
                { text: '📜 Blueprint (+5 research) — 50💰', style: shopFont, onSelect: () => this.buyBlueprint() },
                { text: '🔙 Back', style: backFont, onSelect: () => this.showTraderMenu() }
            )
        }

        // ✨ Pass the custom options here!
        this.dialog.showChoices(choices, {
            title: "🛒 Trader's Shop",
            subtitle: `💰 Your coins: ${GameState.money}`,
            titleStyle: {
                fontSize: '60px',   // Slightly smaller than 72px to fit the icon nicely
                fill: '#ffcc00'     // Match the gold theme
            },
            subtitleStyle: {
                fill: '#ffaa00'     // Bright orange for the money counter
            }
        })
    }

    // ─── Individual buy methods ─────────────────────

    buyArmorCore() {
        if (!GameState.spendMoney(500)) {
            this.dialog.show([
                { name: 'Trader', text: `Not enough coins! Need 500💰, you have ${GameState.money}💰.` }
            ], () => { this.traderShop() })
            return
        }

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

        this.dialog.show([
            { name: 'Trader', text: 'Here\'s your power core. Handle with care.' },
            { name: 'You', text: 'Finally! Now I can make something with this.' },
            { name: 'Trader', text: 'Oh wait. Take this too.' },
            { name: 'Trader', text: 'A communication device. Old tech but reliable.' },
            { name: 'You', text: 'What\'s this for?' },
            { name: 'Trader', text: 'Keep in touch with people you care about.' },
            { name: 'Trader', text: 'In times like these... communication saves lives.' },
            { name: '', text: '📡 Received: Comms Device' },
            { name: 'Trader', text: 'Kid... there\'s something you should see.' },
            { name: 'Trader', text: 'Someone smart enough to actually use it.' },
            { name: 'You', text: 'What do you mean?' },
            { name: 'Trader', text: 'I found something underground. Years ago.' },
            { name: 'Trader', text: 'An armor frame. Ancient engineering.' },
            { name: 'You', text: 'What kind of armor?' },
            { name: 'Trader', text: 'The kind no ordinary human can work with.' },
            { name: 'Trader', text: 'But you... you understand machines.' },
            { name: 'Trader', text: 'I think you\'re the one who can finish it.' },
            { name: 'You', text: 'Show me.' }
        ], () => {
            GameState.setFlag('secretBaseRevealed')
            GameState.tryAdvanceLevel()
            this.ui.updateStats()
            this.showSecretBaseCutscene()
        })
    }

    buyRepairParts() {
        if (!GameState.spendMoney(100)) {
            this.dialog.show([
                { name: 'Trader', text: `Not enough coins! Need 100💰, you have ${GameState.money}💰.` }
            ], () => { this.traderShop() })
            return
        }

        GameState.addSkill('repair', 10)
        GameState.addItem({
            id: 'repair_parts',
            name: 'Repair Parts',
            icon: '🔧',
            description: 'Useful spare parts for fixing machines.',
            quantity: 1
        })

        this.dialog.show([
            { name: 'Trader', text: 'Good parts. Should help your work.' }
        ], () => { this.showTraderMenu() })
    }

    buyElixir() {
        if (!GameState.spendMoney(150)) {
            this.dialog.show([
                { name: 'Trader', text: `Not enough coins! Need 150💰, you have ${GameState.money}💰.` }
            ], () => { this.traderShop() })
            return
        }

        GameState.addElixir(3)
        GameState.addItem({
            id: 'elixir',
            name: 'Elixir',
            icon: '⚗️',
            description: 'A mysterious liquid with magical properties.',
            quantity: 3
        })

        this.dialog.show([
            { name: 'Trader', text: 'Rare stuff. Use it wisely.' }
        ], () => { this.showTraderMenu() })
    }

    buyBlueprint() {
        if (!GameState.spendMoney(50)) {
            this.dialog.show([
                { name: 'Trader', text: `Not enough coins! Need 50💰, you have ${GameState.money}💰.` }
            ], () => { this.traderShop() })
            return
        }

        GameState.addSkill('research', 5)
        GameState.addItem({
            id: 'blueprint',
            name: 'Blueprint',
            icon: '📜',
            description: 'Old schematics for advanced research.',
            quantity: 1
        })

        this.dialog.show([
            { name: 'Trader', text: 'Old schematics. Might come in handy.' }
        ], () => { this.showTraderMenu() })
    }

    createShopItem(x, y, text, price, onClick) {
        const btn = this.add.rectangle(x, y, 500, 55, 0x2a2a2a)
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
        if (this.shopOverlay) this.shopOverlay.destroy()
        if (this.shopPanel) this.shopPanel.destroy()
        if (this.shopTitle) this.shopTitle.destroy()
        if (this.shopMoney) this.shopMoney.destroy()
        if (this.shopClose) this.shopClose.destroy()
        this.shopItems.forEach(item => item.destroy())
        this.shopItems = []
    }

    // ═══════════════════════════════════════════════════
    // ─── TRADER SECRET ─────────────────────────────────
    // ═══════════════════════════════════════════════════

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
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('SecretBaseScene')
            })
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── SECRET BASE CUTSCENE ──────────────────────────
    // ═══════════════════════════════════════════════════

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
        cont.on('pointerout', () => cont.setStyle({ fill: '#888888' }))
        cont.on('pointerdown', () => {
            this.cutsceneTexts.forEach(t => t.destroy())
            this.cutsceneTexts = []
            if (this.cutsceneOverlay) this.cutsceneOverlay.destroy()
            this.scene.start('SecretBaseScene')
        })
    }
}