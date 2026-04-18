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

        // ─── Dark background ───────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(-2)

        // ─── Background ────────────────────────────────
        this.bg = this.add.image(W / 2, H / 2, 'palace-bg')
        this.bg.setOrigin(0.5, 0.5)
        this.bg.setDepth(-1)
        this.bg.setDisplaySize(W, H)
        this.bg.setAlpha(0.3) // ← dark tint for night feel

        // ─── Dark red overlay for mood ─────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x220000, 0.4).setDepth(0)

        // ─── Scene Title ───────────────────────────────
        this.add.text(W / 2, 30, '👑 King\'s Palace — Night', {
            fontSize: '28px',
            fill: '#441111'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Luvaza on ground ──────────────────────────
        this.add.rectangle(W / 2, H / 2 + 50, 50, 30, 0xff69b4, 0.5).setDepth(2)
        this.add.text(W / 2, H / 2 + 80, 'Luvaza...', {
            fontSize: '20px',
            fill: '#ff69b4',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(2)

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Start the betrayal sequence ───────────────
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

        // ─── Running to palace animation ───────────────
        const runOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.95)
            .setScrollFactor(0).setDepth(100)

        const runText = this.add.text(W / 2, H / 2, 'Running to the Palace...', {
            fontSize: '30px',
            fill: '#ff4444',
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        // ─── Dots animation ────────────────────────────
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
                { name: '',    text: 'The guards step aside. They look... afraid.' },
                { name: 'You', text: 'LUVAZA!' },
                { name: '',    text: 'Your voice echoes through empty halls.' },
                { name: '',    text: 'You run deeper. Past the throne room.' },
                { name: '',    text: 'Past the gardens. Down the corridor.' },
                { name: '',    text: 'Until you reach the back chamber.' },
                { name: '',    text: 'The door is open.' },
                { name: '',    text: 'You step inside.' },
                { name: '',    text: '...' },
                { name: '',    text: 'On the floor...' },
                { name: '',    text: 'Luvaza.' },
                { name: '',    text: 'She\'s not moving.' },
                { name: 'You', text: 'No...' },
                { name: '',    text: 'You rush to her side.' },
                { name: '',    text: 'Her eyes are closed.' },
                { name: '',    text: 'The comms device is shattered beside her.' },
                { name: 'You', text: 'Luvaza... please... wake up...' },
                { name: '',    text: '...' },
                { name: '',    text: 'She doesn\'t respond.' },
                { name: 'You', text: 'No. NO!' }
            ], () => {
                this.showConfrontation()
            })
        })
    }

    // ─── Confrontation with King and Park Cleaner ──────
    showConfrontation() {
        this.dialog.show([
            { name: '',             text: 'Behind you... footsteps.' },
            { name: 'King',         text: 'I told her not to come here tonight.' },
            { name: 'You',          text: '...you.' },
            { name: 'King',         text: 'She was my daughter.' },
            { name: 'King',         text: 'But she heard too much.' },
            { name: 'You',          text: 'YOU KILLED HER!' },
            { name: 'King',         text: 'I didn\'t pull the trigger.' },
            { name: '',             text: 'The Park Cleaner steps out of the shadows.' },
            { name: 'Park Cleaner', text: 'She would have ruined everything.' },
            { name: 'You',          text: 'YOU...' },
            { name: 'You',          text: 'I cleaned the park with you.' },
            { name: 'You',          text: 'I TRUSTED you.' },
            { name: 'Park Cleaner', text: 'And I told you the truth.' },
            { name: 'Park Cleaner', text: 'About the Veridium. About everything.' },
            { name: 'Park Cleaner', text: 'I told you someone this city trusts completely.' },
            { name: 'Park Cleaner', text: 'Did you never wonder who that was?' },
            { name: 'You',          text: '...' },
            { name: 'King',         text: 'The Veridium under this city...' },
            { name: 'King',         text: 'It\'s worth more than every life in it.' },
            { name: 'King',         text: 'I did what was necessary.' },
            { name: 'You',          text: 'Necessary?!' },
            { name: 'You',          text: 'You destroyed your own city!' },
            { name: 'You',          text: 'You killed your own DAUGHTER!' },
            { name: 'King',         text: 'Sacrifices must be made for power.' },
            { name: 'Park Cleaner', text: 'Walk away boy. You can\'t fight us both.' },
            { name: 'You',          text: '...' },
            { name: 'You',          text: 'You\'re right.' },
            { name: 'You',          text: 'I can\'t fight you. Not today.' },
            { name: 'You',          text: 'But I will come back.' },
            { name: 'You',          text: 'And when I do...' },
            { name: 'You',          text: 'This armor isn\'t just protection anymore.' },
            { name: 'King',         text: 'Guards. Let him go.' },
            { name: 'King',         text: 'He\'s nothing without her.' },
            { name: '',             text: '...' },
            { name: '',             text: 'You kneel beside Luvaza one last time.' },
            { name: 'You',          text: 'I\'m sorry I wasn\'t fast enough.' },
            { name: 'You',          text: 'I promise...' },
            { name: 'You',          text: 'They will answer for this.' },
            { name: '',             text: 'You pick up the shattered comms device.' },
            { name: '',             text: 'The recording is still there.' },
            { name: '',             text: '📡 Obtained: Luvaza\'s Recording' },
            { name: '',             text: 'You walk out of the palace.' },
            { name: '',             text: 'The doors close behind you.' },
            { name: '',             text: 'The rain begins to fall.' }
        ], () => {
            GameState.setFlag('gfDead')
            GameState.setFlag('learnedTruth')
            GameState.setFlag('conspiracyRevealed')
            GameState.addItem({
                id: 'luvaza_recording',
                name: 'Luvaza\'s Recording',
                icon: '📡',
                description: 'Her final words. Proof of the King\'s betrayal.',
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

        addText(W / 2, H / 2 - 220, 'In memory of', {
            fontSize: '22px',
            fill: '#666666',
            fontStyle: 'italic'
        }, 1000)

        addText(W / 2, H / 2 - 160, '💔 Luvaza', {
            fontSize: '52px',
            fill: '#ff4444',
            fontStyle: 'bold'
        }, 2500)

        addText(W / 2, H / 2 - 80, '"I love y—"', {
            fontSize: '28px',
            fill: '#ff8888',
            fontStyle: 'italic'
        }, 4500)

        addText(W / 2, H / 2 - 30, '— Her last words', {
            fontSize: '18px',
            fill: '#555555'
        }, 6000)

        addText(W / 2, H / 2 + 60, 'The King betrayed his city.', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }, 8000)

        addText(W / 2, H / 2 + 95, 'The Park Cleaner took her life.', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }, 9500)

        addText(W / 2, H / 2 + 130, 'And now... nothing will ever be the same.', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'italic'
        }, 11000)

        // ─── Level 4 unlock ────────────────────────────
        this.time.delayedCall(13000, () => {
            const levelUp = this.add.text(W / 2, H / 2 + 210, '⚔️ LEVEL 4 UNLOCKED: REVENGE ⚔️', {
                fontSize: '34px',
                fill: '#ff0000',
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0)
            this.cutsceneItems.push(levelUp)
            this.tweens.add({ targets: levelUp, alpha: 1, duration: 1000 })
        })

        // ─── Continue button ───────────────────────────
        this.time.delayedCall(15500, () => {
            const cont = this.add.text(W / 2, H / 2 + 290, '[ Continue... ]', {
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
                GameState.advanceLevel() // → Level 4
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