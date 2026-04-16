import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class TownCenterScene extends Phaser.Scene {
    constructor() {
        super('TownCenterScene')
    }

    preload() {
        this.load.image('towncenter-bg', 'assets/images/towncenter-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background ────────────────
        this.bg = this.add.image(0, 0, 'towncenter-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        // ─── Ruins ─────────────────────
        // Collapsed building left
        this.add.rectangle(300, H - 200, 300, 200, 0x443322)
            .setAlpha(0.7).setDepth(1)
        this.add.text(250, H - 280, '🏚️', { fontSize: '48px' }).setDepth(2)

        // Rubble piles
        this.add.rectangle(600, H - 80, 200, 60, 0x554433)
            .setAlpha(0.6).setDepth(1)
        this.add.rectangle(1200, H - 90, 150, 70, 0x443322)
            .setAlpha(0.6).setDepth(1)

        // ─── Buildings to repair ────────
        this.buildings = [
            {
                id: 'medical',
                rect: this.add.rectangle(500, H / 2 - 50, 180, 250, 0x553333)
                    .setDepth(1).setAlpha(0.7),
                icon: this.add.text(500, H / 2 - 100, '🏥', { fontSize: '40px' })
                    .setOrigin(0.5).setDepth(2),
                label: this.add.text(500, H / 2 + 80, 'Medical Center', {
                    fontSize: '16px', fill: '#ff4444'
                }).setOrigin(0.5).setDepth(2),
                status: this.add.text(500, H / 2 + 105, '❌ Damaged', {
                    fontSize: '14px', fill: '#ff4444'
                }).setOrigin(0.5).setDepth(2),
                repairCost: 150,
                repairSkill: 10
            },
            {
                id: 'school',
                rect: this.add.rectangle(900, H / 2 - 50, 180, 250, 0x335533)
                    .setDepth(1).setAlpha(0.7),
                icon: this.add.text(900, H / 2 - 100, '🏫', { fontSize: '40px' })
                    .setOrigin(0.5).setDepth(2),
                label: this.add.text(900, H / 2 + 80, 'School', {
                    fontSize: '16px', fill: '#ff4444'
                }).setOrigin(0.5).setDepth(2),
                status: this.add.text(900, H / 2 + 105, '❌ Damaged', {
                    fontSize: '14px', fill: '#ff4444'
                }).setOrigin(0.5).setDepth(2),
                repairCost: 200,
                repairSkill: 15
            },
            {
                id: 'power',
                rect: this.add.rectangle(1300, H / 2 - 50, 180, 250, 0x333355)
                    .setDepth(1).setAlpha(0.7),
                icon: this.add.text(1300, H / 2 - 100, '⚡', { fontSize: '40px' })
                    .setOrigin(0.5).setDepth(2),
                label: this.add.text(1300, H / 2 + 80, 'Power Station', {
                    fontSize: '16px', fill: '#ff4444'
                }).setOrigin(0.5).setDepth(2),
                status: this.add.text(1300, H / 2 + 105, '❌ Damaged', {
                    fontSize: '14px', fill: '#ff4444'
                }).setOrigin(0.5).setDepth(2),
                repairCost: 250,
                repairSkill: 20
            }
        ]

        // Update building status if already repaired
        this.updateBuildingStatus()

        // ─── Luvaza (GF) ───────────────
        this.luvaza = this.add.rectangle(700, H / 2 + 100, 40, 70, 0xff69b4)
            .setDepth(3)
        this.add.text(700, H / 2 + 30, '💕 Luvaza', {
            fontSize: '20px',
            fill: '#ff69b4'
        }).setOrigin(0.5).setDepth(4)

        // ─── Interact hint ─────────────
        this.interactHint = this.add.text(0, 0, 'Press E to interact', {
            fontSize: '20px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(20).setVisible(false)

        // ─── Player ────────────────────
        this.player = this.physics.add.image(200, H / 2 + 100)
        this.player.setDisplaySize(104, 156)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(200, H / 2 + 100, 32, 48, 0x00ff88)
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
        this.menuActive = false
        this.menuItems = []
        this.nearTarget = null

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 30, '🏛️ Town Center', {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── First time intro ──────────
        if (!GameState.getFlag('metLuvaza')) {
            this.dialog.show([
                { name: '', text: 'The town center is barely recognizable.' },
                { name: '', text: 'Collapsed walls, debris everywhere.' },
                { name: '', text: 'But someone is already here, trying to help...' }
            ])
        }
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

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed)
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        this.nearTarget = null

        // ─── Check Luvaza ──────────────
        const luvazaDist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.luvaza.x, this.luvaza.y
        )

        if (luvazaDist < 150) {
            this.nearTarget = 'luvaza'
            this.interactHint.setVisible(true)
            this.interactHint.setPosition(this.luvaza.x - 70, this.luvaza.y - 120)
            this.luvaza.setStrokeStyle(3, 0xffff00)
        } else {
            this.luvaza.setStrokeStyle(0)
        }

        // ─── Check Buildings ───────────
        this.buildings.forEach(building => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                building.rect.x, building.rect.y
            )

            if (dist < 150 && !GameState.rebuiltBuildings?.includes(building.id)) {
                this.nearTarget = building
                this.interactHint.setVisible(true)
                this.interactHint.setPosition(
                    building.rect.x - 80,
                    building.rect.y - 200
                )
                building.rect.setStrokeStyle(3, 0xffff00)
            } else {
                building.rect.setStrokeStyle(0)
            }
        })

        if (!this.nearTarget) {
            this.interactHint.setVisible(false)
        }

        // ─── Press E ───────────────────
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            if (this.nearTarget === 'luvaza') {
                this.talkToLuvaza()
            } else if (this.nearTarget && this.nearTarget.id) {
                this.repairBuilding(this.nearTarget)
            }
        }

        this.ui.updateStats()
    }

    // ─── Update building visuals ───────────────────────
    updateBuildingStatus() {
        if (!GameState.rebuiltBuildings) GameState.rebuiltBuildings = []

        this.buildings.forEach(building => {
            if (GameState.rebuiltBuildings.includes(building.id)) {
                building.rect.setFillStyle(0x225522)
                building.rect.setAlpha(0.9)
                building.status.setText('✅ Repaired')
                building.status.setFill('#00ff88')
                building.label.setFill('#00ff88')
            }
        })
    }

    // ─── Talk to Luvaza ────────────────────────────────
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
                { name: 'Luvaza', text: 'Three buildings need urgent repair.' },
                { name: 'Luvaza', text: 'The Medical Center, the School and the Power Station.' },
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

    // ─── Luvaza Menu ───────────────────────────────────
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
            fontSize: '28px',
            fill: '#ff69b4',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        // 💬 Talk
        this.createMenuButton(W / 2, H / 2 - 60, '💬 Talk', () => {
            this.closeMenu()
            this.luvazaTalk()
        })

        // 📋 Building status
        this.createMenuButton(W / 2, H / 2 + 20, '🏗️ Building Status', () => {
            this.closeMenu()
            this.showBuildingStatus()
        })

        // 🔙 Leave
        this.createMenuButton(W / 2, H / 2 + 100, '🔙 Leave', () => {
            this.closeMenu()
            this.scene.start('HubScene')
        })
    }

    createMenuButton(x, y, text, onClick) {
        const btn = this.add.rectangle(x, y, 350, 55, 0x333355)
            .setStrokeStyle(2, 0xff69b4)
            .setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: true })

        const label = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(53)

        btn.on('pointerover', () => btn.setFillStyle(0x443344))
        btn.on('pointerout', () => btn.setFillStyle(0x333355))
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

    // ─── Luvaza Talk ───────────────────────────────────
    luvazaTalk() {
        const rebuilt = GameState.rebuiltBuildings || []

        if (rebuilt.length === 0) {
            this.dialog.show([
                { name: 'Luvaza', text: 'The people are scared.' },
                { name: 'Luvaza', text: 'But seeing someone working to fix things...' },
                { name: 'Luvaza', text: 'It gives them hope.' },
                { name: 'You', text: 'I\'ll do what I can.' },
                { name: 'Luvaza', text: 'Start with the Medical Center. People are getting hurt.' }
            ], () => { this.showLuvazaMenu() })
        } else if (rebuilt.length < 3) {
            this.dialog.show([
                { name: 'Luvaza', text: `${rebuilt.length} building${rebuilt.length > 1 ? 's' : ''} repaired! You\'re doing great.` },
                { name: 'Luvaza', text: 'Keep going. Every repair matters.' },
                { name: 'You', text: 'I won\'t stop until it\'s all fixed.' },
                { name: 'Luvaza', text: 'I\'m glad you\'re here.' }
            ], () => { this.showLuvazaMenu() })
        } else {
            this.dialog.show([
                { name: 'Luvaza', text: 'You repaired everything!' },
                { name: 'Luvaza', text: 'The city feels alive again.' },
                { name: 'You', text: 'It\'s a start. There\'s still much to do.' },
                { name: 'Luvaza', text: 'You\'re amazing, you know that?' },
                { name: 'You', text: 'Luvaza... I need to tell you something.' },
                { name: 'You', text: 'I\'ve been researching the attack.' },
                { name: 'Luvaza', text: 'What did you find?' },
                { name: 'You', text: 'Nothing yet. But I will.' },
                { name: 'Luvaza', text: 'Be careful. Promise me.' }
            ], () => { this.showLuvazaMenu() })
        }
    }

    // ─── Building Status ───────────────────────────────
    showBuildingStatus() {
        const rebuilt = GameState.rebuiltBuildings || []
        this.dialog.show([
            { name: 'Luvaza', text: 'Here\'s the current status:' },
            { name: '🏥', text: `Medical Center: ${rebuilt.includes('medical') ? '✅ Repaired' : '❌ Needs repair (💰150, 🔧10)'}` },
            { name: '🏫', text: `School: ${rebuilt.includes('school') ? '✅ Repaired' : '❌ Needs repair (💰200, 🔧15)'}` },
            { name: '⚡', text: `Power Station: ${rebuilt.includes('power') ? '✅ Repaired' : '❌ Needs repair (💰250, 🔧20)'}` },
            { name: 'Luvaza', text: 'Walk up to each building and press E to repair!' }
        ], () => { this.showLuvazaMenu() })
    }

    // ─── Repair Building ───────────────────────────────
    repairBuilding(building) {
        if (!GameState.rebuiltBuildings) GameState.rebuiltBuildings = []

        if (GameState.rebuiltBuildings.includes(building.id)) {
            this.dialog.show([
                { name: 'You', text: 'This building is already repaired.' }
            ])
            return
        }

        if (GameState.skills.repair < building.repairSkill) {
            this.dialog.show([
                { name: 'You', text: `I need at least ${building.repairSkill} repair skill for this.` },
                { name: 'You', text: `Current skill: ${GameState.skills.repair}` }
            ])
            return
        }

        if (GameState.money < building.repairCost) {
            this.dialog.show([
                { name: 'You', text: `I need 💰${building.repairCost} to repair this.` },
                { name: 'You', text: `I only have 💰${GameState.money}.` }
            ])
            return
        }

        // ─── Repair! ───────────────────
        GameState.spendMoney(building.repairCost)
        GameState.rebuiltBuildings.push(building.id)
        GameState.addReputation(20)
        GameState.addSkill('repair', 5)

        // Update visual
        building.rect.setFillStyle(0x225522)
        building.rect.setAlpha(0.9)
        building.status.setText('✅ Repaired')
        building.status.setFill('#00ff88')
        building.label.setFill('#00ff88')

        this.ui.updateStats()

        // Check if all rebuilt
        const allBuilt = ['medical', 'school', 'power']
            .every(id => GameState.rebuiltBuildings.includes(id))

        if (allBuilt) {
            GameState.setFlag('rebuiltBuildings')
            this.dialog.show([
                { name: 'You', text: '⭐ All buildings repaired!' },
                { name: 'Luvaza', text: 'You did it! The whole town center is operational!' },
                { name: 'Luvaza', text: 'My father will be so pleased.' },
                { name: 'You', text: 'It\'s what needed to be done.' },
                { name: '', text: '+20 reputation earned!' }
            ])
        } else {
            this.dialog.show([
                { name: 'You', text: `✅ ${building.id === 'medical' ? 'Medical Center' : building.id === 'school' ? 'School' : 'Power Station'} repaired!` },
                { name: 'You', text: '+20 reputation, +5 repair skill earned.' }
            ])
        }
    }
}