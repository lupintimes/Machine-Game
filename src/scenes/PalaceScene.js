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

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background (16:9 fixed) ────
        this.bg = this.add.image(W / 2, H / 2, 'palace-bg')
        this.bg.setOrigin(0.5, 0.5)
        this.bg.setDepth(-1)
        this.bg.setDisplaySize(W, H)

        // ─── King NPC ──────────────────
        this.king = this.add.rectangle(W / 2, H / 2 - 80, 50, 80, 0x8b6914)
            .setDepth(2)

        this.add.text(W / 2, H / 2 - 150, '👑 King', {
            fontSize: '22px',
            fill: '#ffdd00'
        }).setOrigin(0.5).setDepth(3)

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 30, '👑 King\'s Palace', {
            fontSize: '28px',
            fill: '#ffdd00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Dialog ────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.menuActive = false
        this.menuItems = []

        // ─── Trigger interaction on enter
        if (!GameState.getFlag('metKing')) {
            this.dialog.show([
                { name: '', text: 'The palace... still standing but the air is heavy.' },
                { name: '', text: 'The King notices you entering.' },
                { name: 'King', text: 'Ah... a visitor. In these dark times.' },
                { name: 'You', text: 'Your Majesty. The city is in ruins.' },
                { name: 'King', text: 'Yes... I know. My own palace has not been spared.' },
                { name: 'King', text: 'Half my throne room is rubble. My people are suffering.' },
                { name: 'You', text: 'Do you know who did this?' },
                { name: 'King', text: 'Not yet. But we will find them.' },
                { name: 'King', text: 'You seem capable, young engineer.' },
                { name: 'You', text: 'I\'m doing what I can.' },
                { name: 'King', text: 'Then perhaps you can help.' },
                { name: 'King', text: 'My daughter Luvaza is at the town center.' },
                { name: 'King', text: 'She\'s coordinating the rebuilding efforts.' },
                { name: 'King', text: 'Some key buildings need urgent repairs.' },
                { name: 'You', text: 'I\'ll help where I can.' },
                { name: 'King', text: 'Good. The city needs people like you right now.' }
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
        // ─── Only handle dialog space press ─
        if (this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
        // No player movement at all
    }

    // ─── King Menu ─────────────────────────────────────
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
            fontSize: '28px',
            fill: '#ffdd00',
            fontStyle: 'bold'
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
            fontSize: '20px',
            fill: locked ? '#666666' : '#ffffff'
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

    // ─── King Talk ─────────────────────────────────────
    kingTalk() {
        if (!GameState.getFlag('rebuiltBuildings')) {
            this.dialog.show([
                { name: 'King', text: 'How goes the repairs?' },
                { name: 'You', text: 'Still working on it.' },
                { name: 'King', text: 'Please hurry. The people need hope.' },
                { name: 'King', text: 'Go see Luvaza at the town center.' },
                { name: 'King', text: 'She\'ll tell you which buildings need urgent attention.' }
            ], () => { this.showKingMenu() })

        } else if (!GameState.getFlag('learnedTruth')) {
            this.dialog.show([
                { name: 'King', text: 'Thank you for the repairs. The city feels safer.' },
                { name: 'You', text: 'Your Majesty... I\'ve been researching the attack.' },
                { name: 'King', text: 'Oh? Have you found anything?' },
                { name: 'You', text: 'Not yet. But something doesn\'t add up.' },
                { name: 'King', text: 'Keep looking. We need answers.' },
                { name: 'King', text: 'But be careful. These are dangerous times.' }
            ], () => { this.showKingMenu() })

        } else if (!GameState.getFlag('toldKing')) {
            this.dialog.show([
                { name: 'You', text: 'Your Majesty. I know who attacked the city.' },
                { name: 'King', text: 'What? Who?' },
                { name: 'You', text: 'The Enemy Boss. It wasn\'t random. It was planned.' },
                { name: 'King', text: '...' },
                { name: 'King', text: 'That\'s... a serious accusation.' },
                { name: 'You', text: 'I have evidence. The attack patterns, the timing...' },
                { name: 'King', text: 'I see. Leave this with me. I\'ll investigate.' },
                { name: 'You', text: 'Something about his reaction felt wrong.' },
                { name: '', text: 'The King didn\'t seem surprised at all...' }
            ], () => {
                GameState.setFlag('toldKing')
                this.showKingMenu()
            })

        } else {
            this.dialog.show([
                { name: 'King', text: 'I am... looking into the matter you raised.' },
                { name: 'King', text: 'These things take time.' },
                { name: 'You', text: 'Of course.' },
                { name: '', text: 'He\'s hiding something. I can feel it.' }
            ], () => { this.showKingMenu() })
        }
    }

    // ─── Quest Status ──────────────────────────────────
    showQuestStatus() {
        const rebuilt = GameState.getFlag('rebuiltBuildings')
        const buildings = GameState.rebuiltBuildings || []

        this.dialog.show([
            { name: 'King', text: 'Here are the buildings that need repair:' },
            { name: '🏥', text: `Medical Center: ${buildings.includes('medical') ? '✅ Repaired' : '❌ Needs repair'}` },
            { name: '🏫', text: `School: ${buildings.includes('school') ? '✅ Repaired' : '❌ Needs repair'}` },
            { name: '⚡', text: `Power Station: ${buildings.includes('power') ? '✅ Repaired' : '❌ Needs repair'}` },
            { name: 'King', text: rebuilt ? 'All buildings repaired! Thank you.' : 'Go to town center. Luvaza will guide you.' }
        ], () => { this.showKingMenu() })
    }
}