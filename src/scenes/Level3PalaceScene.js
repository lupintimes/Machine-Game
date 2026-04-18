import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class Level3PalaceScene extends Phaser.Scene {
    constructor() {
        super('Level3PalaceScene')
    }

    preload() {
        this.load.image('palace-bg', 'assets/images/palace-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Dark palace ───────────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(-2)

        this.bg = this.add.image(W / 2, H / 2, 'palace-bg')
        this.bg.setOrigin(0.5, 0.5)
        this.bg.setDepth(-1)
        this.bg.setDisplaySize(W, H)
        this.bg.setAlpha(0.2)

        this.add.rectangle(W / 2, H / 2, W, H, 0x220000, 0.4).setDepth(0)

        // ─── Scene Title ───────────────────────────────
        this.add.text(W / 2, 30, '👑 King\'s Palace — Night', {
            fontSize: '28px',
            fill: '#441111'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.cutsceneItems = []

        // ─── Start ─────────────────────────────────────
        this.startBetrayalSequence()
    }

    update() {
        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }

    // ─── The Betrayal Sequence ─────────────────────────
    startBetrayalSequence() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        const runOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.95)
            .setScrollFactor(0).setDepth(100)

        const runText = this.add.text(W / 2, H / 2, 'Running to the Palace...', {
            fontSize: '30px',
            fill: '#ff4444',
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        let dots = 0
        this.time.addEvent({
            delay: 400,
            callback: () => {
                dots++
                runText.setText('Running to the Palace' + '.'.repeat(dots % 4))
            },
            repeat: 8
        })

        this.time.delayedCall(3500, () => {
            runOverlay.destroy()
            runText.destroy()

            this.dialog.show([
                { name: '',    text: 'You burst through the palace gates.' },
                { name: '',    text: 'The guards look confused. Worried.' },
                { name: 'You', text: 'WHERE IS LUVAZA?!' },
                { name: '',    text: 'A guard points toward the throne room.' },
                { name: '',    text: 'You hear shouting from inside...' },
                { name: '',    text: 'You run. Faster than you\'ve ever run.' },
                { name: '',    text: 'You reach the throne room doors.' },
                { name: '',    text: 'They\'re open.' }
            ], () => {
                this.showConfrontation()
            })
        })
    }

    // ─── The Confrontation ─────────────────────────────
    showConfrontation() {
        this.dialog.show([
            { name: '',      text: 'You step inside.' },
            { name: '',      text: 'The scene freezes you in place.' },
            { name: '',      text: 'Luvaza is standing in the center of the room.' },
            { name: '',      text: 'She\'s facing the King. Tears streaming down her face.' },
            { name: '',      text: 'The Park Cleaner stands beside the King.' },
            { name: '',      text: 'Guards surround her.' },
            { name: 'Luvaza', text: 'I HEARD YOU! I heard everything!' },
            { name: 'Luvaza', text: 'You planned the attack! You and this... this CLEANER!' },
            { name: 'King',   text: 'Luvaza, please calm down. You don\'t understand—' },
            { name: 'Luvaza', text: 'DON\'T tell me I don\'t understand!' },
            { name: 'Luvaza', text: 'You said "eliminate the threat"!' },
            { name: 'Luvaza', text: 'You were talking about the boy I love!' },
            { name: 'King',   text: 'No! Luvaza, we were talking about the ENEMY—' },
            { name: 'Luvaza', text: 'LIAR!' },
            { name: '',       text: 'Luvaza lunges forward toward the King.' },
            { name: '',       text: 'The guards react.' },
            { name: '',       text: '...' },
            { name: '',       text: 'One of them pushes her back.' },
            { name: '',       text: 'She stumbles.' },
            { name: '',       text: 'She falls.' },
            { name: '',       text: 'Her head hits the marble floor.' },
            { name: '',       text: '...' },
            { name: '',       text: 'A terrible silence fills the room.' },
            { name: 'King',   text: 'LUVAZA!' },
            { name: '',       text: 'The King rushes to her side.' },
            { name: '',       text: 'The Park Cleaner\'s face goes white.' },
            { name: 'You',    text: 'No...' },
            { name: '',       text: 'You push past the guards.' },
            { name: '',       text: 'You kneel beside her.' },
            { name: '',       text: 'She\'s not moving.' },
            { name: 'You',    text: 'Luvaza... please...' },
            { name: 'King',   text: 'My daughter... what have I...' },
            { name: 'Park Cleaner', text: 'She wasn\'t supposed to be here...' },
            { name: 'Park Cleaner', text: 'She wasn\'t supposed to hear any of that...' },
            { name: 'You',    text: 'What... what was she talking about?' },
            { name: 'You',    text: 'What did she hear?!' },
            { name: 'King',   text: '...' },
            { name: 'King',   text: 'We were discussing protection of the Veridium.' },
            { name: 'King',   text: 'The "threat" was the enemy spy in the city.' },
            { name: 'King',   text: 'Not... not your friend. Not you.' },
            { name: 'Park Cleaner', text: 'I\'m a royal agent. I was investigating the attack.' },
            { name: 'Park Cleaner', text: 'I went undercover as a park cleaner.' },
            { name: 'Park Cleaner', text: 'The King asked me to protect the Veridium.' },
            { name: 'Park Cleaner', text: 'She... she heard us out of context.' },
            { name: 'You',    text: '...' },
            { name: 'You',    text: 'She thought you were the villains.' },
            { name: 'You',    text: 'She thought she was protecting me.' },
            { name: 'King',   text: 'She was trying to save you...' },
            { name: 'King',   text: 'And it killed her.' },
            { name: '',       text: '...' },
            { name: '',       text: 'The King breaks down.' },
            { name: '',       text: 'The Park Cleaner stares at the floor.' },
            { name: '',       text: 'The guards stand frozen.' },
            { name: 'You',    text: 'She died because of a misunderstanding.' },
            { name: 'You',    text: 'Because she loved me too much.' },
            { name: 'You',    text: 'Because she heard half a conversation.' },
            { name: 'You',    text: 'And I wasn\'t there to stop her.' },
            { name: '',       text: '...' },
            { name: '',       text: 'You pick up the comms device from her hand.' },
            { name: '',       text: 'The screen still shows your name.' },
            { name: '',       text: 'Her last call.' },
            { name: '',       text: '...' },
            { name: 'You',    text: 'I should have been faster.' },
            { name: 'You',    text: 'I should have told her to wait.' },
            { name: 'You',    text: 'I should have...' },
            { name: '',       text: '...' },
            { name: 'King',   text: 'The real enemy is still out there.' },
            { name: 'King',   text: 'The one who actually attacked our city.' },
            { name: 'King',   text: 'We will find them. Together.' },
            { name: 'King',   text: 'For her.' },
            { name: 'You',    text: '...' },
            { name: 'You',    text: 'For her.' },
            { name: '',       text: 'You stand up.' },
            { name: '',       text: 'You walk out of the palace.' },
            { name: '',       text: 'The rain begins to fall.' }
        ], () => {
            GameState.setFlag('gfDead')
            GameState.setFlag('learnedTruth')
            GameState.setFlag('conspiracyRevealed')
            GameState.addItem({
                id: 'luvaza_comms',
                name: 'Luvaza\'s Comms Device',
                icon: '📡',
                description: 'Her comms device. Your name is still on the screen.',
                quantity: 1
            })
            this.showDeathCutscene()
        })
    }

    // ─── Death Cutscene ────────────────────────────────
    showDeathCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cutsceneItems = []

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1)
            .setScrollFactor(0).setDepth(200)
        this.cutsceneItems.push(overlay)

        const addText = (x, y, text, style, delay) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(201)
                .setAlpha(0)
            this.cutsceneItems.push(t)
            this.time.delayedCall(delay, () => {
                this.tweens.add({ targets: t, alpha: 1, duration: 1200 })
            })
            return t
        }

        addText(W / 2, H / 2 - 250, 'In memory of', {
            fontSize: '22px',
            fill: '#666666',
            fontStyle: 'italic'
        }, 1000)

        addText(W / 2, H / 2 - 180, '💔 Luvaza', {
            fontSize: '52px',
            fill: '#ff4444',
            fontStyle: 'bold'
        }, 2500)

        addText(W / 2, H / 2 - 100, '"I love y—"', {
            fontSize: '28px',
            fill: '#ff8888',
            fontStyle: 'italic'
        }, 4500)

        addText(W / 2, H / 2 - 50, '— Her last words on the comms', {
            fontSize: '18px',
            fill: '#555555'
        }, 6000)

        addText(W / 2, H / 2 + 30, 'She died trying to protect someone she loved.', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }, 8000)

        addText(W / 2, H / 2 + 65, 'Based on a conversation she only half heard.', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }, 9500)

        addText(W / 2, H / 2 + 100, 'The cruelest tragedies are the ones that didn\'t need to happen.', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'italic'
        }, 11000)

        addText(W / 2, H / 2 + 170, 'The real enemy is still out there.', {
            fontSize: '22px',
            fill: '#ff8800'
        }, 13000)

        // ─── Level 4 unlock ────────────────────────────
        this.time.delayedCall(15000, () => {
            const levelUp = this.add.text(W / 2, H / 2 + 230,
                '⚔️ LEVEL 4 UNLOCKED: FIND THE TRUE ENEMY ⚔️', {
                fontSize: '30px',
                fill: '#ff0000',
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0)
            this.cutsceneItems.push(levelUp)
            this.tweens.add({ targets: levelUp, alpha: 1, duration: 1000 })
        })

        // ─── Continue ──────────────────────────────────
        this.time.delayedCall(17000, () => {
            const cont = this.add.text(W / 2, H / 2 + 310, '[ Continue... ]', {
                fontSize: '22px',
                fill: '#333333'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
                .setAlpha(0)
                .setInteractive({ useHandCursor: true })
            this.cutsceneItems.push(cont)

            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })

            cont.on('pointerover', () => cont.setStyle({ fill: '#ffffff' }))
            cont.on('pointerout',  () => cont.setStyle({ fill: '#333333' }))
            cont.on('pointerdown', () => {
                GameState.tryAdvanceLevel()
                this.ui.updateStats()
                this.cutsceneItems.forEach(item => item.destroy())
                this.cameras.main.fade(1000, 0, 0, 0)
                this.time.delayedCall(1000, () => {
                    this.scene.start('HubScene')
                })
            })
        })
    }
}