import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class TownCenterScene extends Phaser.Scene {
    constructor() {
        super('TownCenterScene')
    }

    preload() {
        this.load.image('town-ruined', 'assets/images/towncenter/town_ruined.png')

        // Broken buttons
        this.load.image('btn-hospital', 'assets/images/towncenter/hospital_button.png')
        this.load.image('btn-water', 'assets/images/towncenter/water_button.png')
        this.load.image('btn-power', 'assets/images/towncenter/power_button.png')
        this.load.image('btn-town', 'assets/images/towncenter/town_button.png')

        // Fixed buttons
        this.load.image('btn-hospital-fixed', 'assets/images/towncenter/fixed_hospital.png')
        this.load.image('btn-water-fixed', 'assets/images/towncenter/fixed_water.png')
        this.load.image('btn-power-fixed', 'assets/images/towncenter/fixed_power.png')
        this.load.image('btn-town-fixed', 'assets/images/towncenter/fixed_town.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.ui = new UI(this)
        this.ui.create()

        this.add.image(W / 2, H / 2, 'town-ruined')
            .setDisplaySize(W, H)
            .setDepth(0)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.menuActive = false
        this.menuItems = []
        this.buildings = []

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
        })

        if (!GameState.rebuiltBuildings) GameState.rebuiltBuildings = []

        // ═══════════════════════════════════════════════
        // ─── BUILDINGS — EDIT POSITIONS HERE ───────────
        // ═══════════════════════════════════════════════

        this.createBuilding({
            id: 'hospital',
            btnKey: 'btn-hospital',
            fixedKey: 'btn-hospital-fixed',
            btnX: 326.50,
            btnY: 542.50,
            label: 'Medical Center',
            repairCost: 150,
            repairSkill: 10,
            repaired: GameState.rebuiltBuildings.includes('hospital')
        })

        this.createBuilding({
            id: 'water',
            btnKey: 'btn-water',
            fixedKey: 'btn-water-fixed',
            btnX: 1084.50,
            btnY: 844,
            label: 'Water Station',
            repairCost: 200,
            repairSkill: 15,
            repaired: GameState.rebuiltBuildings.includes('water')
        })

        this.createBuilding({
            id: 'power',
            btnKey: 'btn-power',
            fixedKey: 'btn-power-fixed',
            btnX: 1710.50,
            btnY: 540,
            label: 'Power Station',
            repairCost: 250,
            repairSkill: 20,
            repaired: GameState.rebuiltBuildings.includes('power')
        })

        this.createBuilding({
            id: 'town',
            btnKey: 'btn-town',
            fixedKey: 'btn-town-fixed',
            btnX: 965,          // ← adjust position
            btnY: 417,          // ← adjust position
            label: 'Town Hall',
            repairCost: 300,
            repairSkill: 25,
            repaired: GameState.rebuiltBuildings.includes('town')
        })

        // ═══════════════════════════════════════════════

        this.createLuvaza({
            x: W * 0.35,
            y: H * 0.75,
            labelOffsetY: -50
        })

        this.createBackButton()

        if (!GameState.getFlag('metLuvaza')) {
            this.time.delayedCall(100, () => {
                this.dialog.show([
                    { name: '', text: 'The town center is barely recognizable.' },
                    { name: '', text: 'Collapsed walls, debris everywhere.' },
                    { name: '', text: 'But someone is already here, trying to help...' }
                ])
            })
        }
    }

    update() {
        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── CREATE BUILDING ───────────────────────────────
    // ═══════════════════════════════════════════════════

    createBuilding(config) {
        const {
            id, btnKey, fixedKey,
            btnX, btnY,
            label, repairCost, repairSkill,
            repaired
        } = config

        const texture = repaired ? fixedKey : btnKey

        const btnImage = this.add.image(btnX, btnY, texture)
            .setDepth(3)

        if (repaired) {
            btnImage.setAlpha(1)
        } else {
            btnImage.setInteractive({
                useHandCursor: true,
                pixelPerfect: true,
                alphaTolerance: 50
            })

            btnImage.on('pointerover', () => {
                this.showTooltip(
                    btnX,
                    btnY - (btnImage.displayHeight / 2) - 20,
                    `${label}  💰${repairCost}  🔧${repairSkill}`
                )
            })

            btnImage.on('pointerout', () => {
                this.hideTooltip()
            })

            btnImage.on('pointerdown', () => {
                this.repairBuilding(id)
            })
        }

        this.buildings.push({
            id, btnImage, btnKey, fixedKey,
            label, repairCost, repairSkill, repaired
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── REPAIR BUILDING ───────────────────────────────
    // ═══════════════════════════════════════════════════

    repairBuilding(buildingId) {
        if (!GameState.rebuiltBuildings) GameState.rebuiltBuildings = []

        const building = this.buildings.find(b => b.id === buildingId)
        if (!building) return

        if (building.repaired) {
            this.dialog.show([
                { name: 'You', text: 'This building is already repaired.' }
            ])
            return
        }

        if (GameState.skills.repair < building.repairSkill) {
            this.dialog.show([
                { name: 'You', text: `Need 🔧${building.repairSkill} repair skill.` },
                { name: 'You', text: `Current: 🔧${GameState.skills.repair}` }
            ])
            return
        }

        if (GameState.money < building.repairCost) {
            this.dialog.show([
                { name: 'You', text: `Need 💰${building.repairCost}.` },
                { name: 'You', text: `Current: 💰${GameState.money}` }
            ])
            return
        }

        GameState.spendMoney(building.repairCost)
        GameState.rebuiltBuildings.push(buildingId)
        GameState.addReputation(20)
        GameState.addSkill('repair', 5)

        building.repaired = true
        building.btnImage.setTexture(building.fixedKey)
        building.btnImage.disableInteractive()
        building.btnImage.setAlpha(1)

        this.hideTooltip()
        this.cameras.main.flash(300, 0, 255, 100)
        this.ui.updateStats()

        const allBuilt = ['hospital', 'water', 'power', 'town']
            .every(id => GameState.rebuiltBuildings.includes(id))

        if (allBuilt) {
            GameState.setFlag('rebuiltBuildings')
            this.dialog.show([
                { name: 'You', text: '⭐ All buildings repaired!' },
                { name: 'Luvaza', text: 'You did it! The whole town center is operational!' },
                { name: 'Luvaza', text: 'Even the Town Hall is back!' },
                { name: 'Luvaza', text: 'My father will be so pleased.' },
                { name: 'You', text: 'It\'s what needed to be done.' },
                { name: '', text: '+20 reputation earned!' }
            ])
        } else {
            this.dialog.show([
                { name: 'You', text: `✅ ${building.label} repaired!` },
                { name: 'You', text: '+20 reputation, +5 repair skill earned.' }
            ])
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── TOOLTIP ───────────────────────────────────────
    // ═══════════════════════════════════════════════════

    showTooltip(x, y, message) {
        this.hideTooltip()

        const container = this.add.container(x, y).setDepth(200)

        const text = this.add.text(0, 0, message, {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            fill: '#ffffff',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5)

        const bg = this.add.rectangle(0, 0,
            text.width + 24, text.height + 12,
            0x000000, 0.9
        ).setStrokeStyle(1, 0xffffff, 0.3)

        container.add([bg, text])
        this.tooltip = container
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy()
            this.tooltip = null
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── LUVAZA ────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createLuvaza({ x, y, labelOffsetY }) {
        this.luvazaSprite = this.add.rectangle(x, y, 40, 70, 0xff69b4)
            .setDepth(5)

        this.luvazaLabel = this.add.text(x, y + labelOffsetY, '💕 Luvaza', {
            fontSize: '20px', fill: '#ff69b4'
        }).setOrigin(0.5).setDepth(6)

        const zone = this.add.rectangle(x, y, 100, 120, 0x000000, 0)
            .setDepth(7)
            .setInteractive({ useHandCursor: true })

        zone.on('pointerover', () => {
            this.luvazaSprite.setStrokeStyle(3, 0xffff00)
            this.showTooltip(x, y + labelOffsetY - 30, '💕 Talk to Luvaza')
        })
        zone.on('pointerout', () => {
            this.luvazaSprite.setStrokeStyle(0)
            this.hideTooltip()
        })
        zone.on('pointerdown', () => {
            this.hideTooltip()
            this.talkToLuvaza()
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── BACK BUTTON ───────────────────────────────────
    // ═══════════════════════════════════════════════════

    createBackButton() {
        const W = this.cameras.main.width

        const backBtn = this.add.text(W - 30, 80, '🔙', {
            fontSize: '32px'
        }).setOrigin(1, 0).setDepth(50).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        backBtn.on('pointerover', () => {
            this.showTooltip(W - 60, 120, 'Back to Hub')
        })
        backBtn.on('pointerout', () => {
            this.hideTooltip()
        })
        backBtn.on('pointerdown', () => {
            this.hideTooltip()
            this.cameras.main.fade(300, 0, 0, 0)
            this.time.delayedCall(300, () => this.scene.start('HubScene'))
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── TALK TO LUVAZA ────────────────────────────────
    // ═══════════════════════════════════════════════════

    talkToLuvaza() {
        if (!GameState.getFlag('metLuvaza')) {
            this.dialog.show([
                { name: 'Luvaza', text: 'Oh! You scared me.' },
                { name: 'You', text: 'Sorry. Are you okay?' },
                { name: 'Luvaza', text: 'I\'m fine. Just trying to organize the cleanup.' },
                { name: 'Luvaza', text: 'So many people lost their homes...' },
                { name: 'You', text: 'You\'re the King\'s daughter, right?' },
                { name: 'Luvaza', text: 'Yes. I\'m Luvaza. And you are?' },
                { name: 'You', text: 'An engineer. I want to help rebuild.' },
                { name: 'Luvaza', text: 'Really? That\'s amazing!' },
                { name: 'Luvaza', text: 'Four buildings need urgent repair.' },
                { name: 'Luvaza', text: 'The Medical Center, Water Station, Power Station, and Town Hall.' },
                { name: 'Luvaza', text: 'My father asked me to oversee it.' },
                { name: 'You', text: 'I\'ll get to work.' },
                { name: 'Luvaza', text: 'Thank you. The city needs more people like you.' }
            ], () => {
                GameState.setFlag('metLuvaza')
                this.showLuvazaMenu()
            })
        } else {
            this.showLuvazaMenu()
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── LUVAZA MENU ───────────────────────────────────
    // ═══════════════════════════════════════════════════

    showLuvazaMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true
        this.menuItems = []

        this.menuOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50)

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 500, 400, 0x1a1a2e)
            .setStrokeStyle(3, 0xff69b4).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 160, '💕 Luvaza', {
            fontSize: '28px', fill: '#ff69b4', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        this.createMenuButton(W / 2, H / 2 - 60, '💬 Talk', () => {
            this.closeMenu()
            this.luvazaTalk()
        })

        this.createMenuButton(W / 2, H / 2 + 20, '🏗️ Building Status', () => {
            this.closeMenu()
            this.showBuildingStatus()
        })

        this.createMenuButton(W / 2, H / 2 + 100, '🔙 Leave', () => {
            this.closeMenu()
            this.cameras.main.fade(300, 0, 0, 0)
            this.time.delayedCall(300, () => this.scene.start('HubScene'))
        })
    }

    createMenuButton(x, y, text, onClick) {
        const btn = this.add.rectangle(x, y, 350, 55, 0x333355)
            .setStrokeStyle(2, 0xff69b4)
            .setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: true })

        const label = this.add.text(x, y, text, {
            fontSize: '20px', fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(53)

        btn.on('pointerover', () => btn.setFillStyle(0x443344))
        btn.on('pointerout', () => btn.setFillStyle(0x333355))
        btn.on('pointerdown', onClick)

        this.menuItems.push(btn, label)
    }

    closeMenu() {
        this.menuActive = false
        if (this.menuOverlay) this.menuOverlay.destroy()
        if (this.menuPanel) this.menuPanel.destroy()
        if (this.menuTitle) this.menuTitle.destroy()
        this.menuItems.forEach(item => item.destroy())
        this.menuItems = []
    }

    // ═══════════════════════════════════════════════════
    // ─── LUVAZA TALK ───────────────────────────────────
    // ═══════════════════════════════════════════════════

    luvazaTalk() {
        const rebuilt = GameState.rebuiltBuildings || []

        if (GameState.getFlag('hasCommsDevice') && !GameState.getFlag('gaveCommsToGF')) {
            this.dialog.show([
                { name: 'You', text: 'Luvaza, I have something for you.' },
                { name: 'Luvaza', text: 'What is it?' },
                { name: 'You', text: 'A communication device. So we can stay in touch.' },
                { name: 'Luvaza', text: 'That\'s so thoughtful!' },
                { name: 'You', text: 'If anything happens... if you see anything strange...' },
                { name: 'You', text: 'Contact me immediately. Promise?' },
                { name: 'Luvaza', text: 'I promise. Thank you.' },
                { name: '', text: '📡 Gave Comms Device to Luvaza' },
                { name: '', text: 'This will be important later...' }
            ], () => {
                GameState.setFlag('gaveCommsToGF')
                GameState.removeItem('comms_device')
                this.showLuvazaMenu()
            })
            return
        }

        if (rebuilt.length === 0) {
            this.dialog.show([
                { name: 'Luvaza', text: 'The people are scared.' },
                { name: 'Luvaza', text: 'But seeing someone working to fix things...' },
                { name: 'Luvaza', text: 'It gives them hope.' },
                { name: 'You', text: 'I\'ll do what I can.' },
                { name: 'Luvaza', text: 'Start with the Medical Center. People are getting hurt.' }
            ], () => { this.showLuvazaMenu() })

        } else if (rebuilt.length < 4) {
            this.dialog.show([
                { name: 'Luvaza', text: `${rebuilt.length} building${rebuilt.length > 1 ? 's' : ''} repaired! You\'re doing great.` },
                { name: 'Luvaza', text: 'Keep going. Every repair matters.' },
                { name: 'You', text: 'I won\'t stop until it\'s all fixed.' },
                { name: 'Luvaza', text: 'I\'m glad you\'re here.' }
            ], () => { this.showLuvazaMenu() })

        } else if (!GameState.getFlag('luvazaClueFound')) {
            this.dialog.show([
                { name: 'Luvaza', text: 'You repaired everything! Thank you so much.' },
                { name: 'You', text: 'Luvaza... can I ask you something personal?' },
                { name: 'Luvaza', text: 'Of course. What is it?' },
                { name: 'You', text: 'Has your father been acting strange lately?' },
                { name: 'Luvaza', text: '...' },
                { name: 'Luvaza', text: 'Why do you ask?' },
                { name: 'You', text: 'Just... something feels off. About the attack.' },
                { name: 'Luvaza', text: 'Now that you mention it...' },
                { name: 'Luvaza', text: 'He was having secret meetings. Weeks before the attack.' },
                { name: 'Luvaza', text: 'Late at night. He never told me who with.' },
                { name: 'Luvaza', text: 'I thought it was just... kingdom business.' },
                { name: 'You', text: 'Do you remember anything about them?' },
                { name: 'Luvaza', text: 'Just one thing. A name I heard through the door.' },
                { name: 'Luvaza', text: 'I didn\'t think much of it then...' },
                { name: 'Luvaza', text: 'But it was the name of someone outside the kingdom.' },
                { name: 'You', text: 'Outside the kingdom...' },
                { name: 'Luvaza', text: 'I\'m sure it\'s nothing. Father would never...' },
                { name: 'Luvaza', text: 'He loves this city.' },
                { name: 'You', text: '(Something is definitely wrong here.)' },
                { name: '', text: '📌 Clue found! Keep investigating.' }
            ], () => {
                GameState.setFlag('luvazaClueFound')
                this.showLuvazaMenu()
            })

        } else {
            this.dialog.show([
                { name: 'Luvaza', text: 'Is everything okay? You seem troubled.' },
                { name: 'You', text: 'Just thinking about the attack.' },
                { name: 'Luvaza', text: 'Be careful. Promise me.' },
                { name: 'You', text: 'I promise.' }
            ], () => { this.showLuvazaMenu() })
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── BUILDING STATUS ───────────────────────────────
    // ═══════════════════════════════════════════════════

    showBuildingStatus() {
        const rebuilt = GameState.rebuiltBuildings || []
        this.dialog.show([
            { name: 'Luvaza', text: 'Here\'s the current status:' },
            { name: '🏥', text: `Medical Center: ${rebuilt.includes('hospital') ? '✅ Repaired' : '❌ Needs repair (💰150, 🔧10)'}` },
            { name: '💧', text: `Water Station: ${rebuilt.includes('water') ? '✅ Repaired' : '❌ Needs repair (💰200, 🔧15)'}` },
            { name: '⚡', text: `Power Station: ${rebuilt.includes('power') ? '✅ Repaired' : '❌ Needs repair (💰250, 🔧20)'}` },
            { name: '🏛️', text: `Town Hall: ${rebuilt.includes('town') ? '✅ Repaired' : '❌ Needs repair (💰300, 🔧25)'}` },
            { name: 'Luvaza', text: 'Click on each building to repair it!' }
        ], () => { this.showLuvazaMenu() })
    }
}