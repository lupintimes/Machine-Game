import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class WorkshopScene extends Phaser.Scene {
    constructor() {
        super('WorkshopScene')
    }

    preload() {
        this.load.image('workshop-bg', 'assets/images/workshop-bg.png')
        this.load.image('lock-key', 'assets/images/ui/lock_key.png')
        this.load.image('e-key', 'assets/images/ui/E_key.png')
        this.load.image('lock-overlay', 'assets/images/ui/electric_bench_locked.png')
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
            'morning': 'workshop-morning',
            'afternoon': 'workshop-noon',
            'evening': 'workshop-evening',
            'night': 'workshop-night'
        }[GameState.timeOfDay] || 'workshop-morning'

        this.bg = this.add.image(0, 0, bgKey)
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        // ─── Stations ──────────────────────────────────
        this.stations = [
            {
                rect: this.add.rectangle(820, 800, 700, 600, 0x8b4513)
                    .setDepth(1).setAlpha(0),
                label: this.add.text(720, 500, '🔧 Hardware Bench', {
                    fontSize: '22px', fill: '#fff'
                }).setDepth(2),
                lockLabel: null,
                name: 'Hardware Bench',
                cooldown: false,
                locked: false
            },
            {
                rect: this.add.rectangle(1930, 800, 700, 600, 0x555577)
                    .setDepth(1).setAlpha(0),
                label: this.add.text(1830, 500, '⚡ Electrical Bench', {
                    fontSize: '22px', fill: '#fff'
                }).setDepth(2),
                lockLabel: null,
                name: 'Electrical Bench',
                cooldown: false,
                locked: !GameState.getFlag('electricalUnlocked')
            },
            {
                rect: this.add.rectangle(3250, 800, 1200, 600, 0x9b59b6)
                    .setDepth(1).setAlpha(0),
                label: this.add.text(3100, 500, '🔮 Magical Bench', {
                    fontSize: '22px', fill: '#fff'
                }).setDepth(2),
                lockLabel: null,
                name: 'Magical Bench',
                cooldown: false,
                locked: false
            }
        ]

        // ─── Lock visual on electrical ─────────────────
        // ─── Lock visual on electrical ─────────────────
        if (this.stations[1].locked) {
            this.stations[1].rect.setAlpha(0)

            // Same scale as background
            const bgScale = this.bg.scaleX

            this.stations[1].lockOverlay = this.add.image(1858, 730.00, 'lock-overlay')
                .setOrigin(0.5, 0.5)
                .setScale(bgScale)
                .setDepth(2)
                .setAlpha(0.8)

            this.stations[1].lockLabel = this.add.text(
                1830, 550, '🔒 Need 5 repair skill', {
                fontSize: '18px',
                fill: '#ff4444'
            }).setDepth(3)
        }

        // ─── Interact hint ─────────────────────────────
        this.interactHint = this.add.image(0, 0, 'e-key')
            .setScale(0.5)
            .setDepth(20)
            .setVisible(false)



        // ─── Player ────────────────────────────────────
        this.player = this.physics.add.image(400, 850)
        this.player.setDisplaySize(104, 156)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(400, 850, 32, 48, 0x00ff88)
        this.playerGfx.setDepth(10)
        this.playerGfx.setScale(7.25)

        // ─── Camera ────────────────────────────────────
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // ─── Controls ──────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.eKey = this.input.keyboard.addKey('E')
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)

        // ─── State ─────────────────────────────────────
        this.menuActive = false
        this.menuItems = []
        this.nearStation = null
        this.truthTriggered = false


        if (GameState.getFlag('learnedTruth')) {
            this.truthTriggered = true
        }



        // ─── Intro dialog ──────────────────────────────
        // In create() — replace the intro dialog block:
        if (!GameState.getFlag('workshopIntroSeen')) {
            // ─── Set flag IMMEDIATELY, not in callback ─────
            GameState.setFlag('workshopIntroSeen')

            this.dialog.show([
                { name: 'You', text: 'My workshop... at least this place is still standing.' },
                { name: 'You', text: 'I should start working soon.' }
            ])
        }
    }

        update() {
        const speed = 600

        // ─── Dialog takes priority ─────────────────────
        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                if (!this.dialog.isClosed) {
                    this.dialog.next()
                }
            }
            return
        }

        // ─── Menu blocks movement ──────────────────────
        if (this.menuActive) return

        // ─── Player movement ───────────────────────────
        this.player.setVelocity(0)

        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.player.setVelocityX(-speed)
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            this.player.setVelocityX(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        // ─── Electrical bench unlock (one time) ────────
        if (this.stations[1].locked && GameState.getFlag('electricalUnlocked')) {
            this.stations[1].locked = false
            this.stations[1].rect.setAlpha(0)
            if (this.stations[1].lockOverlay) {
                this.stations[1].lockOverlay.destroy()
                this.stations[1].lockOverlay = null
            }
            if (this.stations[1].lockLabel) {
                this.stations[1].lockLabel.destroy()
                this.stations[1].lockLabel = null
            }
        }

        // ─── Trader hint (one time) ────────────────────
        if (GameState.canMeetTrader() && !GameState.getFlag('traderHintShown')) {
            GameState.setFlag('traderHintShown')
            this.dialog.show([
                { name: 'You', text: 'I know enough now to look for parts.', expression: 'serious' },
                { name: 'You', text: 'Maybe the Junkyard trader has what I need.', expression: 'neutral' }
            ])
            return
        }

        // ─── Truth unlock check ────────────────────────
        this.checkTruthUnlock()

        // ─── Station proximity ─────────────────────────
        this.nearStation = null

        this.stations.forEach(station => {
            const r = station.rect
            const left = r.x - r.width / 2
            const right = r.x + r.width / 2
            const top = r.y - r.height / 2
            const bottom = r.y + r.height / 2

            const inside = this.player.x > left &&
                this.player.x < right &&
                this.player.y > top &&
                this.player.y < bottom

            if (inside) {
                this.nearStation = station
                this.interactHint.setTexture(station.locked ? 'lock-key' : 'e-key')
                this.interactHint.setVisible(true)
                this.interactHint.setPosition(
                    r.x + 220,
                    top + 120
                )
                station.rect.setStrokeStyle(3, station.locked ? 0xff0000 : 0xffff00)
            } else {
                station.rect.setStrokeStyle(0)
            }
        })

        if (!this.nearStation) {
            this.interactHint.setVisible(false)
        }

        // ─── Press E ───────────────────────────────────
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearStation) {
            this.onInteract(this.nearStation)
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── Can Do Work (night check) ─────────────────────
    // ═══════════════════════════════════════════════════
    canDoWork() {
        if (GameState.timeOfDay === 'night') {
            this.dialog.show([
                { name: 'You', text: 'It\'s too late to work...' },
                { name: 'You', text: 'I should get some rest.' },
                { name: '', text: '😴 Come back in the morning.' }
            ])
            return false
        }
        return true
    }

    // ═══════════════════════════════════════════════════
    // ─── Advance Work Time ─────────────────────────────
    // ═══════════════════════════════════════════════════
    advanceWorkTime() {
        GameState.advanceTime()
        this.ui.updateStats()
        this.ui.showTimeTransition()
    }

    // ═══════════════════════════════════════════════════
    // ─── On Interact ───────────────────────────────────
    // ═══════════════════════════════════════════════════
    onInteract(station) {
        if (station.locked) {
            this.dialog.show([
                { name: 'You', text: '🔒 I need more repair skill to work on this.' }
            ])
            return
        }

        if (station.cooldown) {
            this.dialog.show([
                { name: 'You', text: 'I just worked on this. Let me rest a bit.' }
            ])
            return
        }

        // ─── Hardware Bench ────────────────────────────
        if (station.name === 'Hardware Bench') {
            if (!this.canDoWork()) return
            this.advanceWorkTime()
            this.scene.pause('WorkshopScene')
            this.scene.launch('PressureValveGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        // ─── Electrical Bench ──────────────────────────
        if (station.name === 'Electrical Bench') {
            if (!this.canDoWork()) return
            this.advanceWorkTime()
            this.scene.pause('WorkshopScene')
            this.scene.launch('WireConnectGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        // ─── Magical Bench (NIGHT ONLY) ────────────────
        if (station.name === 'Magical Bench') {
            if (GameState.timeOfDay !== 'night') {
                this.dialog.show([
                    { name: 'You', text: 'The magical bench needs darkness to work...' },
                    { name: 'You', text: 'Ancient energy only flows at night.' },
                    { name: '', text: '🌙 Come back at night to use this bench.' }
                ])
                return
            }

            if (GameState.level >= 2) {
                this.showMagicalBenchMenu(station)
            } else {
                this.scene.pause('WorkshopScene')
                this.scene.launch('EnergyCalibrationGame')
                station.cooldown = true
                this.time.delayedCall(5000, () => { station.cooldown = false })
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── Truth Unlock Check ────────────────────────────
    // ═══════════════════════════════════════════════════
    checkTruthUnlock() {
        if (this.truthTriggered) return
        if (GameState.getFlag('learnedTruth')) {
            this.truthTriggered = true
            return
        }

        if (GameState.skills.research >= 30 &&
            !GameState.getFlag('researchClueFound')) {
            GameState.setFlag('researchClueFound')
            console.log('🔬 Research clue unlocked!')
        }

        const allClues =
            GameState.getFlag('researchClueFound') &&
            GameState.getFlag('luvazaClueFound') &&
            GameState.getFlag('parkClueFound') &&
            GameState.getFlag('traderClueFound')

        if (!allClues) return

        this.truthTriggered = true
        console.log('🎬 All clues found! Starting cutscene...')

        GameState.setFlag('learnedTruth')
        GameState.tryAdvanceLevel()
        this.ui.updateStats()

        this.cameras.main.fade(800, 0, 0, 0)
        this.time.delayedCall(800, () => {
            this.scene.start('CutsceneScene', {
                key: 'truthDiscovered',
                returnScene: 'WorkshopScene'
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── Magical Bench Menu ────────────────────────────
    // ═══════════════════════════════════════════════════
    showMagicalBenchMenu(station) {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true
        this.menuItems = []

        this.menuOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50)

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 600, 500, 0x1a1a1a)
            .setStrokeStyle(3, 0x9b59b6).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 210, '🔮 Magical Bench', {
            fontSize: '28px',
            fill: '#9b59b6',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        this.menuStats = this.add.text(W / 2, H / 2 - 160,
            `🔬 Research: ${GameState.skills.research}/30   ⚗️ Elixir: ${GameState.elixir}`, {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        // ─── Night indicator ───────────────────────────
        const timeInfo = this.add.text(W / 2, H / 2 - 125,
            '🌙 Night — Ancient energy is active', {
            fontSize: '14px',
            fill: '#9b59b6'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
        this.menuItems.push(timeInfo)

        // ─── Energy Calibration ────────────────────────
        this.createBenchButton(
            W / 2, H / 2 - 50,
            '⚡ Energy Calibration',
            'Earn elixir + research skill',
            () => {
                this.closeMagicalMenu()
                station.cooldown = true
                this.time.delayedCall(5000, () => { station.cooldown = false })
                this.scene.pause('WorkshopScene')
                this.scene.launch('EnergyCalibrationGame')
            }
        )

        // ─── Research ──────────────────────────────────
        const researchDone = GameState.skills.research >= 30
        const canResearch = GameState.elixir >= 1 && !researchDone

        this.createBenchButton(
            W / 2, H / 2 + 60,
            researchDone ? '✅ Research Complete' : '🔬 Research Attack Data',
            researchDone
                ? 'All clues gathered'
                : canResearch
                    ? `Costs ⚗️1 elixir | Progress: ${GameState.skills.research}/30`
                    : '❌ Need at least 1 elixir',
            () => {
                if (researchDone) {
                    this.closeMagicalMenu()
                    this.dialog.show([
                        { name: 'You', text: 'Research is complete.' },
                        { name: 'You', text: 'I need to gather all clues from others.' }
                    ])
                    return
                }
                if (GameState.elixir < 1) {
                    this.closeMagicalMenu()
                    this.dialog.show([
                        { name: 'You', text: 'I need at least 1 elixir to run the analysis.' },
                        { name: 'You', text: 'Play Energy Calibration to earn elixir.' }
                    ])
                    return
                }
                this.closeMagicalMenu()
                this.doResearch()
            },
            !canResearch && !researchDone
        )

        // ─── Back ──────────────────────────────────────
        this.createBenchButton(W / 2, H / 2 + 170, '🔙 Back', '', () => {
            this.closeMagicalMenu()
        })
    }

    createBenchButton(x, y, text, subtitle, onClick, locked = false) {
        const btn = this.add.rectangle(x, y, 500, 75, locked ? 0x222222 : 0x2a2a2a)

            .setStrokeStyle(2, locked ? 0x444444 : 0x9b59b6)
            .setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: !locked })

        const mainText = this.add.text(x, subtitle ? y - 12 : y, text, {
            fontSize: '20px',
            fill: locked ? '#666666' : '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(53)

        let subText = null
        if (subtitle) {
            subText = this.add.text(x, y + 16, subtitle, {
                fontSize: '14px',
                fill: locked ? '#444444' : '#aaaaaa'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(53)
        }

        if (!locked) {
            btn.on('pointerover', () => btn.setFillStyle(0x3a3a3a))
            btn.on('pointerout', () => btn.setFillStyle(0x2a2a2a))
        }
        btn.on('pointerdown', () => { if (!locked) onClick() })

        this.menuItems.push(btn, mainText)
        if (subText) this.menuItems.push(subText)
        return btn
    }

    closeMagicalMenu() {
        this.menuActive = false
        if (this.menuOverlay) this.menuOverlay.destroy()
        if (this.menuPanel) this.menuPanel.destroy()
        if (this.menuTitle) this.menuTitle.destroy()
        if (this.menuStats) this.menuStats.destroy()
        this.menuItems.forEach(item => item.destroy())
        this.menuItems = []
    }

    // ═══════════════════════════════════════════════════
    // ─── Research System ───────────────────────────────
    // ═══════════════════════════════════════════════════
    doResearch() {
        GameState.addElixir(-1)
        GameState.addSkill('research', 5)
        this.ui.updateStats()

        const research = GameState.skills.research

        if (research <= 5) {
            this.dialog.show([
                { name: 'You', text: 'Running attack pattern analysis...' },
                { name: 'You', text: 'Clue 1: The attackers knew exactly which districts to hit.' },
                { name: 'You', text: 'This wasn\'t random. They had a detailed map.' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 10) {
            this.dialog.show([
                { name: 'You', text: 'Cross referencing attack timing...' },
                { name: 'You', text: 'Clue 2: The attack happened during guard rotation.' },
                { name: 'You', text: 'Someone knew the security schedule inside out.' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 15) {
            this.dialog.show([
                { name: 'You', text: 'Analyzing the damage patterns...' },
                { name: 'You', text: 'Clue 3: Key areas were deliberately left untouched.' },
                { name: 'You', text: 'The material vaults... specifically avoided.' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 20) {
            this.dialog.show([
                { name: 'You', text: 'Investigating the material vaults...' },
                { name: 'You', text: 'Clue 4: A rare material only found in this city.' },
                { name: 'You', text: 'Can\'t be taken publicly. Someone wants it secretly.' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research <= 25) {
            this.dialog.show([
                { name: 'You', text: 'Deep analysis of enemy movement data...' },
                { name: 'You', text: 'Clue 5: The enemy had perfect knowledge of defenses.' },
                { name: 'You', text: 'This level of intel... from someone with high authority.' },
                { name: '', text: `🔬 Research Progress: ${research}/30` }
            ])
        } else if (research >= 30) {
            const luvaza = GameState.getFlag('luvazaClueFound')
            const park = GameState.getFlag('parkClueFound')
            const trader = GameState.getFlag('traderClueFound')

            if (luvaza && park && trader) {
                this.dialog.show([
                    { name: 'You', text: 'Final analysis complete...' },
                    { name: 'You', text: 'I have everything I need now.' },
                    { name: '', text: '🔬 All clues gathered! Head back to workshop.' }
                ])
            } else {
                const missing = []
                if (!luvaza) missing.push('💕 Talk more with Luvaza at Town Center')
                if (!park) missing.push('🌿 Talk more with Park Cleaner at Park')
                if (!trader) missing.push('🧑 Talk more with Trader at Junkyard')

                this.dialog.show([
                    { name: 'You', text: 'Research complete...' },
                    { name: 'You', text: 'But I still need more from others.' },
                    ...missing.map(m => ({ name: '📌', text: m })),
                    { name: '', text: '🔬 Research: 30/30 ✅' }
                ])
            }
        }
    }
}