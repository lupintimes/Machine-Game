import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class TownCenterScene extends Phaser.Scene {
    constructor() {
        super('TownCenterScene')
    }

    preload() {
        this.load.image('town-ruined', 'assets/images/towncenter/town_ruined.png')

        this.load.image('btn-hospital', 'assets/images/towncenter/hospital_button.png')
        this.load.image('btn-water', 'assets/images/towncenter/water_button.png')
        this.load.image('btn-power', 'assets/images/towncenter/power_button.png')
        this.load.image('btn-town', 'assets/images/towncenter/town_button.png')

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

        this.bg = this.add.image(W / 2, H / 2, 'town-ruined')
            .setDisplaySize(W, H)
            .setDepth(0)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.menuActive = false
        this.menuItems = []
        this.buildings = []
        this.firstMeetItems = []

        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
        })

        if (!GameState.rebuiltBuildings) GameState.rebuiltBuildings = []

        // ═══════════════════════════════════════════════
        // ─── BUILDINGS ─────────────────────────────────
        // ═══════════════════════════════════════════════

        // ─── Town Hall (clickable, not repairable) ─────
        this.createBuilding({
            id: 'town',
            btnKey: 'btn-town',
            fixedKey: 'btn-town-fixed',
            btnX: 965,
            btnY: 417,
            label: 'Town Hall',
            repairCost: 0,
            repairSkill: 0,
            repaired: true
        })

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

        // ═══════════════════════════════════════════════
        // ─── LUVAZA + BACK BUTTON ──────────────────────
        // ═══════════════════════════════════════════════

        this.createLuvaza({
            x: W * 0.35,
            y: H * 0.75,
            labelOffsetY: -50
        })

        this.createBackButton()

        // ═══════════════════════════════════════════════
        // ─── FIRST VISIT: zoomed town hall ─────────────
        // ═══════════════════════════════════════════════

        if (!GameState.getFlag('metLuvaza')) {

            // Hide buildings
            this.buildings.forEach(b => {
                b.btnImage.setVisible(false)
            })

            // Hide normal Luvaza
            this.luvazaSprite.setVisible(false)
            this.luvazaLabel.setVisible(false)
            if (this.luvazaZone) this.luvazaZone.setVisible(false)

            // Hide back button during intro
            if (this.backBtn) this.backBtn.setVisible(false)

            // Hide main background
            this.bg.setVisible(false)

            // ─── Zoomed town hall background ───────────
            this.introBg = this.add.image(W / 2, H / 2, 'btn-town')
                .setDisplaySize(W, H)
                .setDepth(0)
                .setScrollFactor(0)

            // ─── Luvaza standing near town hall ────────
            this.introLuvaza = this.add.rectangle(W / 2 + 100, H / 2 + 80, 40, 70, 0xff69b4)
                .setDepth(5)
                .setScrollFactor(0)
                .setAlpha(0)

            this.introLuvazaLabel = this.add.text(W / 2 + 100, H / 2 + 30, '💕 Luvaza', {
                fontSize: '20px', fill: '#ff69b4'
            }).setOrigin(0.5).setDepth(6).setScrollFactor(0).setAlpha(0)

            // ─── Fade Luvaza in ────────────────────────
            this.time.delayedCall(600, () => {
                this.tweens.add({
                    targets: [this.introLuvaza, this.introLuvazaLabel],
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {

                        // ─── Make Luvaza tappable ──────
                        this.introLuvaza.setInteractive({ useHandCursor: true })

                        // ─── Tap hint ──────────────────
                        this.introTapHint = this.add.text(W / 2 + 100, H / 2 - 10, '👆 Tap to talk', {
                            fontSize: '14px',
                            fill: '#ffff00',
                            fontStyle: 'bold'
                        }).setOrigin(0.5).setDepth(7).setScrollFactor(0)

                        this.tweens.add({
                            targets: this.introTapHint,
                            alpha: 0.3,
                            duration: 800,
                            yoyo: true,
                            repeat: -1
                        })

                        // ─── On tap → start dialog ─────
                        this.introLuvaza.on('pointerdown', () => {
                            if (this.introTapHint) {
                                this.introTapHint.destroy()
                                this.introTapHint = null
                            }

                            // ─── If already met, setup town hall click ─────
                            if (GameState.getFlag('metLuvaza')) {
                                this.setupTownHallClick()
                            }
                            this.introLuvaza.disableInteractive()
                            this.talkToLuvaza()
                        })
                    }
                })
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
    // ─── FIRST MEET MENU (zoomed view) ─────────────────
    // ═══════════════════════════════════════════════════

        showFirstMeetMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.firstMeetItems = []

        const panel = this.add.rectangle(W / 2, H - 120, 400, 140, 0x000000, 0.8)
            .setStrokeStyle(2, 0xff69b4)
            .setScrollFactor(0).setDepth(50)
        this.firstMeetItems.push(panel)

        // ─── Fix Buildings button ──────────────────────
        const fixBtn = this.add.rectangle(W / 2, H - 140, 300, 50, 0x333355)
            .setStrokeStyle(2, 0x00ff88)
            .setScrollFactor(0).setDepth(51)
            .setInteractive({ useHandCursor: true })
        this.firstMeetItems.push(fixBtn)

        const fixLabel = this.add.text(W / 2, H - 140, '🔧 Fix Buildings', {
            fontSize: '20px', fill: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
        this.firstMeetItems.push(fixLabel)

        fixBtn.on('pointerover', () => fixBtn.setFillStyle(0x444477))
        fixBtn.on('pointerout', () => fixBtn.setFillStyle(0x333355))
        fixBtn.on('pointerdown', () => {
            this.cleanupIntro()
            this.transitionToFullView()
        })

        // ─── Back to Hub button ────────────────────────
        const hubBtn = this.add.rectangle(W / 2, H - 80, 300, 50, 0x333355)
            .setStrokeStyle(2, 0x888888)
            .setScrollFactor(0).setDepth(51)
            .setInteractive({ useHandCursor: true })
        this.firstMeetItems.push(hubBtn)

        const hubLabel = this.add.text(W / 2, H - 80, '🔙 Back to Hub', {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
        this.firstMeetItems.push(hubLabel)

        hubBtn.on('pointerover', () => hubBtn.setFillStyle(0x443344))
        hubBtn.on('pointerout', () => hubBtn.setFillStyle(0x333355))
        hubBtn.on('pointerdown', () => {
            this.cleanupIntro()
            this.cameras.main.fade(300, 0, 0, 0)
            this.time.delayedCall(300, () => this.scene.start('HubScene'))
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── CLEANUP INTRO ELEMENTS ────────────────────────
    // ═══════════════════════════════════════════════════

    cleanupIntro() {
        if (this.introBg) { this.introBg.destroy(); this.introBg = null }
        if (this.introLuvaza) { this.introLuvaza.destroy(); this.introLuvaza = null }
        if (this.introLuvazaLabel) { this.introLuvazaLabel.destroy(); this.introLuvazaLabel = null }
        if (this.introTapHint) { this.introTapHint.destroy(); this.introTapHint = null }
        if (this.firstMeetItems) {
            this.firstMeetItems.forEach(item => item.destroy())
            this.firstMeetItems = []
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── TRANSITION TO FULL VIEW ───────────────────────
    // ═══════════════════════════════════════════════════

    transitionToFullView() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Flash transition ──────────────────────────
        this.cameras.main.flash(400, 255, 255, 255)

        // ─── Show main background ──────────────────────
        this.bg.setVisible(true)

        // ─── Show Luvaza at normal position ────────────
        this.luvazaSprite.setPosition(W * 0.35, H * 0.75)
        this.luvazaLabel.setPosition(W * 0.35, H * 0.75 - 50)
        this.luvazaSprite.setVisible(true)
        this.luvazaLabel.setVisible(true)

        if (this.luvazaZone) {
            this.luvazaZone.setPosition(W * 0.35, H * 0.75)
            this.luvazaZone.setVisible(true)
        }

        // ─── Show back button ──────────────────────────
        if (this.backBtn) this.backBtn.setVisible(true)

        // ─── Fade in buildings one by one ──────────────
        this.buildings.forEach((b, i) => {
            b.btnImage.setVisible(true)
            b.btnImage.setAlpha(0)
            this.tweens.add({
                targets: b.btnImage,
                alpha: 1,
                duration: 400,
                delay: i * 200
            })
        })

        // ─── Make town hall image clickable ─────────────
        this.setupTownHallClick()
    }


    transitionToFullView() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Flash transition ──────────────────────────
        this.cameras.main.flash(400, 255, 255, 255)

        // ─── Show main background ──────────────────────
        this.bg.setVisible(true)

        // ─── Show Luvaza at normal position ────────────
        this.luvazaSprite.setPosition(W * 0.35, H * 0.75)
        this.luvazaLabel.setPosition(W * 0.35, H * 0.75 - 50)
        this.luvazaSprite.setVisible(true)
        this.luvazaLabel.setVisible(true)

        if (this.luvazaZone) {
            this.luvazaZone.setPosition(W * 0.35, H * 0.75)
            this.luvazaZone.setVisible(true)
        }

        // ─── Show back button ──────────────────────────
        if (this.backBtn) this.backBtn.setVisible(true)

        // ─── Fade in buildings one by one ──────────────
        this.buildings.forEach((b, i) => {
            b.btnImage.setVisible(true)
            b.btnImage.setAlpha(0)
            this.tweens.add({
                targets: b.btnImage,
                alpha: 1,
                duration: 400,
                delay: i * 200
            })
        })

        // ─── Make town hall image clickable ─────────────
        this.setupTownHallClick()
    }

    // ═══════════════════════════════════════════════════
    // ─── ENTER TOWN HALL ZOOMED VIEW ───────────────────
    // ═══════════════════════════════════════════════════

        enterTownHallView() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Hide everything ───────────────────────────
        this.buildings.forEach(b => {
            b.btnImage.setVisible(false)
        })
        this.luvazaSprite.setVisible(false)
        this.luvazaLabel.setVisible(false)
        if (this.luvazaZone) this.luvazaZone.setVisible(false)
        if (this.backBtn) this.backBtn.setVisible(false)
        this.bg.setVisible(false)

        // ─── Show zoomed town hall ─────────────────────
        this.townViewBg = this.add.image(W / 2, H / 2, 'btn-town')
            .setDisplaySize(W, H)
            .setDepth(0)
            .setScrollFactor(0)
            .setAlpha(0)

        this.tweens.add({
            targets: this.townViewBg,
            alpha: 1,
            duration: 400
        })

        // ─── Luvaza in zoomed view ─────────────────────
        this.townViewLuvaza = this.add.rectangle(W / 2 + 100, H / 2 + 80, 40, 70, 0xff69b4)
            .setDepth(5).setScrollFactor(0)

        this.townViewLuvazaLabel = this.add.text(W / 2 + 100, H / 2 + 30, '💕 Luvaza', {
            fontSize: '20px', fill: '#ff69b4'
        }).setOrigin(0.5).setDepth(6).setScrollFactor(0)

        this.townViewLuvaza.setInteractive({ useHandCursor: true })

        this.townViewLuvaza.on('pointerover', () => {
            this.townViewLuvaza.setStrokeStyle(3, 0xffff00)
        })
        this.townViewLuvaza.on('pointerout', () => {
            this.townViewLuvaza.setStrokeStyle(0)
        })
        this.townViewLuvaza.on('pointerdown', () => {
            this.showLuvazaMenu()
        })

        // ─── Back button (go back to full view) ────────
        this.townViewBack = this.add.text(80, 40, '◀ Back', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 12, y: 6 }
        }).setDepth(50).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.townViewBack.on('pointerover', () => this.townViewBack.setFill('#ffff00'))
        this.townViewBack.on('pointerout', () => this.townViewBack.setFill('#ffffff'))
        this.townViewBack.on('pointerdown', () => {
            this.leaveTownHallView()
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── LEAVE TOWN HALL VIEW ──────────────────────────
    // ═══════════════════════════════════════════════════

    leaveTownHallView() {
        this.cleanupTownHallView()
        this.transitionToFullView()
    }

    // ═══════════════════════════════════════════════════
    // ─── CLEANUP TOWN HALL VIEW ────────────────────────
    // ═══════════════════════════════════════════════════

    cleanupTownHallView() {
        if (this.townViewBg) { this.townViewBg.destroy(); this.townViewBg = null }
        if (this.townViewLuvaza) { this.townViewLuvaza.destroy(); this.townViewLuvaza = null }
        if (this.townViewLuvazaLabel) { this.townViewLuvazaLabel.destroy(); this.townViewLuvazaLabel = null }
        if (this.townViewBack) { this.townViewBack.destroy(); this.townViewBack = null }
        if (this.townViewHub) { this.townViewHub.destroy(); this.townViewHub = null }
    }


    setupTownHallClick() {
        const townBuilding = this.buildings.find(b => b.id === 'town')
        if (!townBuilding) return

        townBuilding.btnImage.setInteractive({
            useHandCursor: true,
            pixelPerfect: true,
            alphaTolerance: 50
        })

        townBuilding.btnImage.on('pointerover', () => {
            this.showTooltip(
                townBuilding.btnImage.x,
                townBuilding.btnImage.y - (townBuilding.btnImage.displayHeight / 2) - 20,
                '🏛️ Enter Town Hall'
            )
            townBuilding.btnImage.setTint(0xddddff)
        })

        townBuilding.btnImage.on('pointerout', () => {
            this.hideTooltip()
            townBuilding.btnImage.clearTint()
        })

        townBuilding.btnImage.on('pointerdown', () => {
            this.hideTooltip()
            townBuilding.btnImage.clearTint()
            this.enterTownHallView()
        })
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
                { name: 'You', text: 'This building is already repaired.', expression: 'neutral' }
            ])
            return
        }

        if (GameState.skills.repair < building.repairSkill) {
            this.dialog.show([
                { name: 'You', text: `Need 🔧${building.repairSkill} repair skill.`, expression: 'serious' },
                { name: 'You', text: `Current: 🔧${GameState.skills.repair}`, expression: 'sad' }
            ])
            return
        }

        if (GameState.money < building.repairCost) {
            this.dialog.show([
                { name: 'You', text: `Need 💰${building.repairCost}.`, expression: 'serious' },
                { name: 'You', text: `Current: 💰${GameState.money}`, expression: 'sad' }
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

        const allBuilt = ['hospital', 'water', 'power']
            .every(id => GameState.rebuiltBuildings.includes(id))

        if (allBuilt) {
            GameState.setFlag('rebuiltBuildings')
            this.dialog.show([
                { name: 'You', text: '⭐ All buildings repaired!', expression: 'determined' },
                { name: 'Luvaza', text: 'You did it! The whole town center is operational!', expression: 'happy' },
                { name: 'Luvaza', text: 'My father will be so pleased.', expression: 'happy' },
                { name: 'You', text: 'It\'s what needed to be done.', expression: 'serious' },
                { name: '', text: '+20 reputation earned!' }
            ])
        } else {
            this.dialog.show([
                { name: 'You', text: `✅ ${building.label} repaired!`, expression: 'determined' },
                { name: 'You', text: '+20 reputation, +5 repair skill earned.', expression: 'neutral' }
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

        this.luvazaZone = this.add.rectangle(x, y, 100, 120, 0x000000, 0)
            .setDepth(7)
            .setInteractive({ useHandCursor: true })

        const zone = this.luvazaZone

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

        this.backBtn = this.add.text(W - 30, 80, '🔙', {
            fontSize: '32px'
        }).setOrigin(1, 0).setDepth(50).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.backBtn.on('pointerover', () => {
            this.showTooltip(W - 60, 120, 'Back to Hub')
        })
        this.backBtn.on('pointerout', () => {
            this.hideTooltip()
        })
        this.backBtn.on('pointerdown', () => {
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
                { name: 'Luvaza', text: 'Oh! You scared me.', expression: 'surprised' },
                { name: 'You', text: 'Sorry. Are you okay?', expression: 'neutral' },
                { name: 'Luvaza', text: 'I\'m fine. Just trying to organize the cleanup.', expression: 'serious' },
                { name: 'Luvaza', text: 'So many people lost their homes...', expression: 'sad' },
                { name: 'You', text: 'You\'re the King\'s daughter, right?', expression: 'neutral' },
                { name: 'Luvaza', text: 'Yes. I\'m Luvaza. And you are?', expression: 'neutral' },
                { name: 'You', text: 'An engineer. I want to help rebuild.', expression: 'determined' },
                { name: 'Luvaza', text: 'Really? That\'s amazing!', expression: 'happy' },
                { name: 'Luvaza', text: 'Three buildings need urgent repair.', expression: 'serious' },
                { name: 'Luvaza', text: 'The Medical Center, Water Station, and Power Station.', expression: 'serious' },
                { name: 'Luvaza', text: 'My father asked me to oversee it.', expression: 'neutral' },
                { name: 'You', text: 'I\'ll get to work.', expression: 'determined' },
                { name: 'Luvaza', text: 'Thank you. The city needs more people like you.', expression: 'happy' }
            ], () => {
                GameState.setFlag('metLuvaza')
                this.showFirstMeetMenu()
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

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 500, 450, 0x1a1a2e)
            .setStrokeStyle(3, 0xff69b4).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 190, '💕 Luvaza', {
            fontSize: '28px', fill: '#ff69b4', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        // ─── Talk ──────────────────────────────────────
        this.createMenuButton(W / 2, H / 2 - 100, '💬 Talk', () => {
            this.closeMenu()
            this.luvazaTalk()
        })

        // ─── Building Status ───────────────────────────
        this.createMenuButton(W / 2, H / 2 - 30, '🏗️ Building Status', () => {
            this.closeMenu()
            this.showBuildingStatus()
        })

        // ─── Fix Buildings (go to full map) ────────────
        const inTownView = this.townViewBg && this.townViewBg.visible
        if (inTownView) {
            this.createMenuButton(W / 2, H / 2 + 40, '🔧 Fix Buildings', () => {
                this.closeMenu()
                this.leaveTownHallView()
            })
        }

        // ─── Back to Hub ───────────────────────────────
        this.createMenuButton(W / 2, H / 2 + 110, '🔙 Back to Hub', () => {
            this.closeMenu()
            if (inTownView) this.cleanupTownHallView()
            this.cameras.main.fade(300, 0, 0, 0)
            this.time.delayedCall(300, () => this.scene.start('HubScene'))
        })

        // ─── Close menu ────────────────────────────────
        this.createMenuButton(W / 2, H / 2 + 180, '✖ Close', () => {
            this.closeMenu()
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
                { name: 'You', text: 'Luvaza, I have something for you.', expression: 'serious' },
                { name: 'Luvaza', text: 'What is it?', expression: 'surprised' },
                { name: 'You', text: 'A communication device. So we can stay in touch.', expression: 'neutral' },
                { name: 'Luvaza', text: 'That\'s so thoughtful!', expression: 'happy' },
                { name: 'You', text: 'If anything happens... if you see anything strange...', expression: 'serious' },
                { name: 'You', text: 'Contact me immediately. Promise?', expression: 'serious' },
                { name: 'Luvaza', text: 'I promise. Thank you.', expression: 'happy' },
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
                { name: 'Luvaza', text: 'The people are scared.', expression: 'sad' },
                { name: 'Luvaza', text: 'But seeing someone working to fix things...', expression: 'worried' },
                { name: 'Luvaza', text: 'It gives them hope.', expression: 'neutral' },
                { name: 'You', text: 'I\'ll do what I can.', expression: 'determined' },
                { name: 'Luvaza', text: 'Start with the Medical Center. People are getting hurt.', expression: 'serious' }
            ], () => { this.showLuvazaMenu() })

        } else if (rebuilt.length < 3) {
            this.dialog.show([
                { name: 'Luvaza', text: `${rebuilt.length} building${rebuilt.length > 1 ? 's' : ''} repaired! You\'re doing great.`, expression: 'happy' },
                { name: 'Luvaza', text: 'Keep going. Every repair matters.', expression: 'serious' },
                { name: 'You', text: 'I won\'t stop until it\'s all fixed.', expression: 'determined' },
                { name: 'Luvaza', text: 'I\'m glad you\'re here.', expression: 'happy' }
            ], () => { this.showLuvazaMenu() })

        } else if (!GameState.getFlag('luvazaClueFound')) {
            this.dialog.show([
                { name: 'Luvaza', text: 'You repaired everything! Thank you so much.', expression: 'happy' },
                { name: 'You', text: 'Luvaza... can I ask you something personal?', expression: 'serious' },
                { name: 'Luvaza', text: 'Of course. What is it?', expression: 'neutral' },
                { name: 'You', text: 'Has your father been acting strange lately?', expression: 'serious' },
                { name: 'Luvaza', text: '...', expression: 'worried' },
                { name: 'Luvaza', text: 'Why do you ask?', expression: 'worried' },
                { name: 'You', text: 'Just... something feels off. About the attack.', expression: 'serious' },
                { name: 'Luvaza', text: 'Now that you mention it...', expression: 'worried' },
                { name: 'Luvaza', text: 'He was having secret meetings. Weeks before the attack.', expression: 'serious' },
                { name: 'Luvaza', text: 'Late at night. He never told me who with.', expression: 'sad' },
                { name: 'Luvaza', text: 'I thought it was just... kingdom business.', expression: 'neutral' },
                { name: 'You', text: 'Do you remember anything about them?', expression: 'serious' },
                { name: 'Luvaza', text: 'Just one thing. A name I heard through the door.', expression: 'worried' },
                { name: 'Luvaza', text: 'I didn\'t think much of it then...', expression: 'sad' },
                { name: 'Luvaza', text: 'But it was the name of someone outside the kingdom.', expression: 'serious' },
                { name: 'You', text: 'Outside the kingdom...', expression: 'surprised' },
                { name: 'Luvaza', text: 'I\'m sure it\'s nothing. Father would never...', expression: 'worried' },
                { name: 'Luvaza', text: 'He loves this city.', expression: 'sad' },
                { name: 'You', text: '(Something is definitely wrong here.)', expression: 'serious' },
                { name: '', text: '📌 Clue found! Keep investigating.' }
            ], () => {
                GameState.setFlag('luvazaClueFound')
                this.showLuvazaMenu()
            })

        } else {
            this.dialog.show([
                { name: 'Luvaza', text: 'Is everything okay? You seem troubled.', expression: 'worried' },
                { name: 'You', text: 'Just thinking about the attack.', expression: 'serious' },
                { name: 'Luvaza', text: 'Be careful. Promise me.', expression: 'worried' },
                { name: 'You', text: 'I promise.', expression: 'determined' }
            ], () => { this.showLuvazaMenu() })
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── BUILDING STATUS ───────────────────────────────
    // ═══════════════════════════════════════════════════

    showBuildingStatus() {
        const rebuilt = GameState.rebuiltBuildings || []
        this.dialog.show([
            { name: 'Luvaza', text: 'Here\'s the current status:', expression: 'serious' },
            { name: '🏥', text: `Medical Center: ${rebuilt.includes('hospital') ? '✅ Repaired' : '❌ Needs repair (💰150, 🔧10)'}` },
            { name: '💧', text: `Water Station: ${rebuilt.includes('water') ? '✅ Repaired' : '❌ Needs repair (💰200, 🔧15)'}` },
            { name: '⚡', text: `Power Station: ${rebuilt.includes('power') ? '✅ Repaired' : '❌ Needs repair (💰250, 🔧20)'}` },
            { name: 'Luvaza', text: 'Click on each building to repair it!', expression: 'neutral' }
        ], () => { this.showLuvazaMenu() })
    }
}