import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class Level3PalaceScene extends Phaser.Scene {
    constructor() {
        super('Level3PalaceScene')
    }

    preload() {
        this.load.image('palace-bg', 'assets/images/palace-bg.webp')
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

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
        })

        this.startArrivalSequence()
    }

    update() {
        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }

    // ─── Arrival ───────────────────────────────────────
    startArrivalSequence() {
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

        const dotEvent = this.time.addEvent({
            delay: 400,
            callback: () => {
                dots++
                runText.setText('Running to the Palace' + '.'.repeat(dots % 4))
            },
            repeat: 8
        })

        this.time.delayedCall(3500, () => {
            dotEvent.remove()
            runOverlay.destroy()
            runText.destroy()
        })

        this.time.delayedCall(3600, () => {
            this.dialog.show([
                { name: '', text: 'You burst through the palace gates.' },
                { name: '', text: 'The guards look shaken. Some are crying.' },
                { name: 'You', text: 'WHERE IS SHE?!' },
                { name: '', text: 'No one answers.' },
                { name: '', text: 'You run through the halls.' },
                { name: '', text: 'Past the gardens. Past the corridors.' },
                { name: '', text: 'You reach the throne room.' },
                { name: '', text: 'The doors are wide open.' },
                { name: '', text: '' },
                { name: '', text: 'You step inside.' },
                { name: '', text: '' },
                { name: '', text: 'And you see her.' },
                { name: '', text: '' },
                { name: '', text: 'On the marble floor.' },
                { name: '', text: 'Not moving.' },
                { name: '', text: '' },
                { name: '', text: 'The King is kneeling beside her.' },
                { name: '', text: 'His face is... broken.' },
                { name: '', text: 'The Park Cleaner stands against the wall.' },
                { name: '', text: 'Staring at nothing.' }
            ], () => {
                this.showDiscovery()
            })
        })
    }

    // ─── Discovery ─────────────────────────────────────
    showDiscovery() {
        this.dialog.show([
            { name: 'You', text: 'No...' },
            { name: '', text: 'You rush to her side.' },
            { name: '', text: 'You kneel down.' },
            { name: 'You', text: 'Luvaza... Luvaza please...' },
            { name: '', text: 'Her eyes are closed.' },
            { name: '', text: 'Peaceful.' },
            { name: '', text: 'Like she\'s sleeping.' },
            { name: '', text: '' },
            { name: '', text: 'But she\'s not sleeping.' },
            { name: '', text: '' },
            { name: 'You', text: 'What happened?! WHAT HAPPENED?!' },
            { name: 'King', text: '...' },
            { name: 'King', text: 'She came in... she was screaming...' },
            { name: 'King', text: 'She said she heard us talking in the garden.' },
            { name: 'King', text: 'She thought...' },
            { name: 'King', text: 'She thought I planned the attack on the city.' },
            { name: 'King', text: 'She thought I wanted to kill you.' },
            { name: 'You', text: 'What...?' },
            { name: 'Park Cleaner', text: 'She heard us discussing the Veridium defense plan.' },
            { name: 'Park Cleaner', text: 'But she only heard pieces.' },
            { name: 'Park Cleaner', text: 'Out of context.' },
            { name: 'Park Cleaner', text: '"Eliminate the threat" meant the enemy spy.' },
            { name: 'Park Cleaner', text: '"The boy investigating" was the enemy agent.' },
            { name: 'Park Cleaner', text: 'Not you. Never you.' },
            { name: 'You', text: '...' },
            { name: 'You', text: 'Then what happened to her?' },
            { name: 'King', text: 'She lunged at him.' },
            { name: 'King', text: 'The guards... they reacted.' },
            { name: 'King', text: 'They grabbed her. She pulled free.' },
            { name: 'King', text: 'She fell.' },
            { name: 'King', text: 'Hit her head on the floor.' },
            { name: 'King', text: '...' },
            { name: 'King', text: 'An accident.' },
            { name: 'King', text: 'A stupid... horrible... accident.' },
            { name: '', text: '' },
            { name: 'You', text: 'She died...' },
            { name: 'You', text: 'Because she misheard a conversation.' },
            { name: 'You', text: 'Because she thought you were going to hurt me.' },
            { name: 'You', text: 'Because she loved me.' },
            { name: '', text: '' },
            { name: 'King', text: 'I loved her too.' },
            { name: 'King', text: 'More than this kingdom.' },
            { name: 'King', text: 'More than the Veridium.' },
            { name: 'King', text: 'More than anything.' },
            { name: '', text: '' },
            { name: 'Park Cleaner', text: 'I\'m a royal agent.' },
            { name: 'Park Cleaner', text: 'I went undercover to find who really attacked the city.' },
            { name: 'Park Cleaner', text: 'The King asked me to protect the Veridium.' },
            { name: 'Park Cleaner', text: 'And to protect people like you.' },
            { name: 'Park Cleaner', text: 'I failed to protect the one person who mattered most.' },
            { name: '', text: '' },
            { name: 'You', text: '...' },
            { name: '', text: 'You pick up the comms device from her pocket.' },
            { name: '', text: 'The screen shows one thing:' },
            { name: '', text: '📡 "EMERGENCY SIGNAL SENT"' },
            { name: '', text: 'She tried to warn you.' },
            { name: '', text: 'Even in her last moments.' },
            { name: '', text: '' },
            { name: 'King', text: 'The real enemy is still out there.' },
            { name: 'King', text: 'Whoever attacked this city...' },
            { name: 'King', text: 'They\'re still planning.' },
            { name: 'King', text: 'We will find them.' },
            { name: 'King', text: 'For her.' },
            { name: 'You', text: '...' },
            { name: 'You', text: 'For her.' },
            { name: '', text: '' },
            { name: '', text: 'You stand up slowly.' },
            { name: '', text: 'You look at the armor on your body.' },
            { name: '', text: 'Built for protection.' },
            { name: '', text: 'But you couldn\'t protect her.' },
            { name: '', text: '' },
            { name: '', text: 'You walk out of the palace.' },
            { name: '', text: 'Into the rain.' },
            { name: '', text: 'Alone.' }
        ], () => {
            GameState.setFlag('learnedTruth')
            GameState.setFlag('enemyTerritoryUnlocked')
            GameState.addItem({
                id: 'luvaza_comms',
                name: 'Luvaza\'s Comms Device',
                icon: '📡',
                description: 'Her comms device. Emergency signal still on screen.',
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

        addText(W / 2, H / 2 - 100, '"She tried to save the one she loved."', {
            fontSize: '24px',
            fill: '#ff8888',
            fontStyle: 'italic'
        }, 4500)

        addText(W / 2, H / 2 - 50, '"Based on words she only half heard."', {
            fontSize: '22px',
            fill: '#aa6666',
            fontStyle: 'italic'
        }, 6000)

        addText(W / 2, H / 2 + 30, 'No one planned her death.', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }, 8000)

        addText(W / 2, H / 2 + 60, 'No one wanted it.', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }, 9000)

        addText(W / 2, H / 2 + 100, 'The cruelest tragedies are the ones\nthat didn\'t need to happen.', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'italic',
            align: 'center'
        }, 10500)

        addText(W / 2, H / 2 + 170, 'The real enemy is still out there.', {
            fontSize: '22px',
            fill: '#ff8800'
        }, 12500)

        // ─── Level 4 ──────────────────────────────────
        this.time.delayedCall(14500, () => {
            const levelUp = this.add.text(W / 2, H / 2 + 230,
                '⚔️ LEVEL 4: FIND THE TRUE ENEMY ⚔️', {
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
            cont.on('pointerout', () => cont.setStyle({ fill: '#333333' }))
            cont.on('pointerdown', () => {
                GameState.tryAdvanceLevel()
                GameState.setFlag('enemyTerritoryUnlocked')
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