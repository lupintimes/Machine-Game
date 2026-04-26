import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class PalaceScene extends Phaser.Scene {
    constructor() {
        super('PalaceScene')
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

    // ═══════════════════════════════════════════════════
    // ─── King Menu (Choice Panel) ──────────────────────
    // ═══════════════════════════════════════════════════
    showKingMenu() {
        this.menuActive = true

        const gold = { fill: '#ffeebb' }

        this.dialog.showChoices([
            {
                text: '💬 Talk',
                style: gold,
                onSelect: () => {
                    this.menuActive = false
                    this.kingTalk()
                }
            },
            {
                text: '📋 Rebuild Quest',
                style: gold,
                onSelect: () => {
                    this.menuActive = false
                    this.showQuestStatus()
                }
            },
            {
                text: '',
                style: { fill: 'transparent' },
                onSelect: () => {}
            },
            {
                text: '🔙 Leave',
                style: { fill: '#888888', fontStyle: 'italic' },
                onSelect: () => {
                    this.menuActive = false
                    this.scene.start('HubScene')
                }
            }
        ], {
            title: '👑 King',
            subtitle: 'Ruler of the fallen city',
            titleStyle: {
                fontSize: '72px',
                fill: '#ffdd00'
            },
            subtitleStyle: {
                fontSize: '24px',
                fill: '#ccaa00'
            },
            hiddenSlots: [2] // Hide the purple button
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── King Talk ─────────────────────────────────────
    // ═══════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════
    // ─── Quest Status ──────────────────────────────────
    // ═══════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════
    // ─── Level Transition ──────────────────────────────
    // ═══════════════════════════════════════════════════
    triggerLevel2Complete() {
        this.cameras.main.fade(800, 0, 0, 0)
        this.time.delayedCall(800, () => {
            this.scene.start('CutsceneScene', {
                key: 'level2Complete',
                returnScene: 'HubScene'
            })
        })
    }
}