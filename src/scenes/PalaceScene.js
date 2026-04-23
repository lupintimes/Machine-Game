import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class PalaceScene extends Phaser.Scene {
    constructor() {
        super('PalaceScene')
    }

    preload() {
        this.load.image('palace-bg', 'assets/images/palace-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.ui = new UI(this)
        this.ui.create()

        this.bg = this.add.image(W / 2, H / 2, 'palace-bg')
            .setOrigin(0.5, 0.5)
            .setDepth(-1)
            .setDisplaySize(W, H)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.menuActive = false
        this.menuItems = []

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
        })

        if (!GameState.getFlag('metKing')) {
            this.dialog.show([
                { name: '', text: 'The palace... still standing but the air is heavy.' },
                { name: '', text: 'The King notices you entering.' },
                { name: 'King', text: 'Ah... a visitor. In these dark times.', expression: 'serious' },
                { name: 'You', text: 'Your Majesty. The city is in ruins.', expression: 'serious' },
                { name: 'King', text: 'Yes... I know. My own palace has not been spared.', expression: 'sad' },
                { name: 'King', text: 'Half my throne room is rubble. My people are suffering.', expression: 'serious' },
                { name: 'You', text: 'Do you know who did this?', expression: 'determined' },
                { name: 'King', text: 'Not yet. But we will find them.', expression: 'serious' },
                { name: 'King', text: 'You seem capable, young engineer.', expression: 'neutral' },
                { name: 'You', text: 'I\'m doing what I can.', expression: 'neutral' },
                { name: 'King', text: 'Then perhaps you can help.', expression: 'neutral' },
                { name: 'King', text: 'My daughter Luvaza is at the town center.', expression: 'neutral' },
                { name: 'King', text: 'She\'s coordinating the rebuilding efforts.', expression: 'serious' },
                { name: 'King', text: 'Some key buildings need urgent repairs.', expression: 'serious' },
                { name: 'You', text: 'I\'ll help where I can.', expression: 'determined' },
                { name: 'King', text: 'Good. The city needs people like you right now.', expression: 'neutral' }
            ], () => {
                GameState.setFlag('metKing')
                GameState.setFlag('kingGaveQuest')
                this.showKingMenu()
            })
        } else {
            this.showKingMenu()
        }
    }

    update() {
        if (this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }

    showKingMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true
        this.menuItems = []

        this.menuOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50)

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 500, 400, 0x1a1a2e)
            .setStrokeStyle(3, 0xffdd00).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 160, '👑 King', {
            fontSize: '28px', fill: '#ffdd00', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        this.createMenuButton(W / 2, H / 2 - 60, '💬 Talk', () => {
            this.closeMenu()
            this.kingTalk()
        })

        this.createMenuButton(W / 2, H / 2 + 20, '📋 Rebuild Quest', () => {
            this.closeMenu()
            this.showQuestStatus()
        })

        this.createMenuButton(W / 2, H / 2 + 100, '🔙 Leave', () => {
            this.closeMenu()
            this.scene.start('HubScene')
        })
    }

    createMenuButton(x, y, text, onClick, locked = false) {
        const btn = this.add.rectangle(x, y, 350, 55, locked ? 0x222233 : 0x333355)
            .setStrokeStyle(2, locked ? 0x444444 : 0xffdd00)
            .setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: !locked })

        const label = this.add.text(x, y, text, {
            fontSize: '20px', fill: locked ? '#666666' : '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(53)

        if (!locked) {
            btn.on('pointerover', () => btn.setFillStyle(0x444433))
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

    kingTalk() {
        if (!GameState.getFlag('rebuiltBuildings')) {
            this.dialog.show([
                { name: 'King', text: 'How goes the repairs?', expression: 'neutral' },
                { name: 'You', text: 'Still working on it.', expression: 'neutral' },
                { name: 'King', text: 'Please hurry. The people need hope.', expression: 'serious' },
                { name: 'King', text: 'Go see Luvaza at the town center.', expression: 'neutral' },
                { name: 'King', text: 'She\'ll tell you which buildings need urgent attention.', expression: 'neutral' }
            ], () => { this.showKingMenu() })

        } else if (!GameState.getFlag('learnedTruth')) {
            this.dialog.show([
                { name: 'King', text: 'Thank you for the repairs. The city feels safer.', expression: 'neutral' },
                { name: 'You', text: 'Your Majesty... I\'ve been researching the attack.', expression: 'serious' },
                { name: 'King', text: 'Oh? Have you found anything?', expression: 'surprised' },
                { name: 'You', text: 'Not yet. But something doesn\'t add up.', expression: 'serious' },
                { name: 'King', text: 'Keep looking. We need answers.', expression: 'serious' },
                { name: 'King', text: 'But be careful. These are dangerous times.', expression: 'suspicious' }
            ], () => { this.showKingMenu() })

        } else if (!GameState.getFlag('toldKing')) {
            this.dialog.show([
                { name: 'You', text: 'Your Majesty. I know who attacked the city.', expression: 'determined' },
                { name: 'King', text: 'What? Who?', expression: 'surprised' },
                { name: 'You', text: 'The Enemy Boss. It wasn\'t random. It was planned.', expression: 'serious' },
                { name: 'King', text: '...', expression: 'suspicious' },
                { name: 'King', text: 'That\'s... a serious accusation.', expression: 'suspicious' },
                { name: 'You', text: 'I have evidence. The attack patterns, the timing...', expression: 'determined' },
                { name: 'King', text: 'I see. Leave this with me. I\'ll investigate.', expression: 'suspicious' },
                { name: 'You', text: 'Something about his reaction felt wrong.', expression: 'serious' },
                { name: '', text: 'The King didn\'t seem surprised at all...' }
            ], () => {
                GameState.setFlag('toldKing')

                const advanced = GameState.tryAdvanceLevel()
                this.ui.updateStats()

                if (advanced) {
                    this.triggerLevel2Complete()
                } else {
                    this.showKingMenu()
                }
            })

        } else {
            this.dialog.show([
                { name: 'King', text: 'I am... looking into the matter you raised.', expression: 'suspicious' },
                { name: 'King', text: 'These things take time.', expression: 'serious' },
                { name: 'You', text: 'Of course.', expression: 'serious' },
                { name: '', text: 'He\'s hiding something. I can feel it.' }
            ], () => { this.showKingMenu() })
        }
    }

    triggerLevel2Complete() {
        this.cameras.main.fade(800, 0, 0, 0)
        this.time.delayedCall(800, () => {
            this.scene.start('CutsceneScene', {
                key: 'level2Complete',
                returnScene: 'HubScene'
            })
        })
    }

    showQuestStatus() {
        const rebuilt = GameState.getFlag('rebuiltBuildings')
        const buildings = GameState.rebuiltBuildings || []

        this.dialog.show([
            { name: 'King', text: 'Here are the buildings that need repair:', expression: 'neutral' },
            { name: '🏥', text: `Medical Center: ${buildings.includes('hospital') ? '✅ Repaired' : '❌ Needs repair'}` },
            { name: '💧', text: `Water Station: ${buildings.includes('water') ? '✅ Repaired' : '❌ Needs repair'}` },
            { name: '⚡', text: `Power Station: ${buildings.includes('power') ? '✅ Repaired' : '❌ Needs repair'}` },
            { name: '🏛️', text: `Town Hall: ${buildings.includes('town') ? '✅ Repaired' : '❌ Needs repair'}` },
            { name: 'King', text: rebuilt ? 'All buildings repaired! Thank you.' : 'Go to town center. Luvaza will guide you.', expression: rebuilt ? 'neutral' : 'serious' }
        ], () => { this.showKingMenu() })
    }
}