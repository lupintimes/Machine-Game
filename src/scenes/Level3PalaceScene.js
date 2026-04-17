import DialogBox from '../dialog.js'

export default class Level3PalaceScene extends Phaser.Scene {
    constructor() {
        super('Level3PalaceScene')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000)

        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // Dark palace scene
        this.add.text(W / 2, 50, '👑 King\'s Palace - Night', {
            fontSize: '28px',
            fill: '#441111'
        }).setOrigin(0.5)

        // Luvaza on ground
        this.add.rectangle(W / 2, H / 2 + 50, 50, 30, 0xff69b4, 0.5)
        this.add.text(W / 2, H / 2 + 80, 'Luvaza...', {
            fontSize: '18px',
            fill: '#ff69b4',
            fontStyle: 'italic'
        }).setOrigin(0.5)

        this.dialog.show([
            { name: '', text: 'You rush to the palace...' },
            { name: '', text: 'The halls are dark. Silent.' },
            { name: 'You', text: 'Luvaza! LUVAZA!' },
            { name: '', text: '...' },
            { name: '', text: 'You find her in the throne room.' },
            { name: '', text: 'She\'s on the ground. Not moving.' },
            { name: 'You', text: 'No... no no no...' },
            { name: 'You', text: 'Luvaza... please...' },
            { name: '', text: 'The comms device is still in her hand.' },
            { name: '', text: 'Her last words echo in your mind:' },
            { name: 'Luvaza (recording)', text: '"I heard everything... my father and the park cleaner..."' },
            { name: 'Luvaza (recording)', text: '"They planned the whole attack together..."' },
            { name: 'Luvaza (recording)', text: '"The Veridium... they want to sell it to..."' },
            { name: 'Luvaza (recording)', text: '"Please... be careful... I lo—"' },
            { name: '', text: 'The recording cuts off.' },
            { name: 'You', text: '...' },
            { name: 'You', text: 'They killed her.' },
            { name: 'You', text: 'Her own father...' },
            { name: 'You', text: 'Let her die to protect his secret.' },
            { name: 'You', text: '...' },
            { name: 'You', text: 'I will make them pay.' },
            { name: 'You', text: 'Every. Single. One of them.' },
            { name: '', text: 'You pick up the comms device.' },
            { name: '', text: 'The recording is the proof you need.' },
            { name: '', text: '📡 Obtained: Luvaza\'s Recording' }
        ], () => {
            GameState.setFlag('gfDead')
            GameState.addItem({
                id: 'luvaza_recording',
                name: 'Luvaza\'s Recording',
                icon: '📡',
                description: 'Her final words. Proof of the King\'s betrayal.',
                quantity: 1
            })

            this.cameras.main.fade(1000, 0, 0, 0)
            this.time.delayedCall(1000, () => {
                this.scene.start('CutsceneScene', {
                    key: 'gfDeath',
                    returnScene: 'HubScene'
                })
            })
        })
    }

    cleanerChat() {
        const friendship = GameState.parkCleanerFriendship || 0

        // ─── Rebuild done clue (existing) ──
        if (GameState.getFlag('rebuiltBuildings') && !GameState.getFlag('parkClueFound')) {
            // ... existing clue dialog
            return
        }

        // ─── Level 3 friendship dialogs ────
        if (GameState.level >= 3) {

            if (friendship === 0) {
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'You seem different lately.' },
                    { name: 'You', text: 'A lot has happened.' },
                    { name: 'Park Cleaner', text: 'Want to talk about it?' },
                    { name: 'You', text: 'Maybe another time.' },
                    { name: 'Park Cleaner', text: 'I\'m always here. That\'s what friends are for!' }
                ], () => {
                    GameState.parkCleanerFriendship = 1
                    this.showCleanerMenu()
                })

            } else if (friendship === 1) {
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'You know... I wasn\'t always a park cleaner.' },
                    { name: 'You', text: 'Oh? What did you do before?' },
                    { name: 'Park Cleaner', text: 'I was... in the military. Long time ago.' },
                    { name: 'Park Cleaner', text: 'Seen things. Done things.' },
                    { name: 'You', text: 'Why become a park cleaner then?' },
                    { name: 'Park Cleaner', text: 'Sometimes... you just want peace. Haha!' },
                    { name: 'You', text: '(Military background... interesting.)' }
                ], () => {
                    GameState.parkCleanerFriendship = 2
                    this.showCleanerMenu()
                })

            } else if (friendship === 2) {
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'Can I tell you something? As a friend?' },
                    { name: 'You', text: 'Of course.' },
                    { name: 'Park Cleaner', text: 'This city... it\'s sitting on something big.' },
                    { name: 'You', text: 'The Veridium.' },
                    { name: 'Park Cleaner', text: '...' },
                    { name: 'Park Cleaner', text: 'You know about it?' },
                    { name: 'You', text: 'I know enough.' },
                    { name: 'Park Cleaner', text: 'Then you know why they attacked.' },
                    { name: 'You', text: 'Tell me more.' },
                    { name: 'Park Cleaner', text: 'The Veridium can power anything.' },
                    { name: 'Park Cleaner', text: 'Weapons. Shields. Entire cities.' },
                    { name: 'Park Cleaner', text: 'Whoever controls it... controls everything.' },
                    { name: 'Park Cleaner', text: 'That\'s why they came. Not to destroy.' },
                    { name: 'Park Cleaner', text: 'To extract. To take what can\'t be taken publicly.' },
                    { name: 'You', text: 'And the King knows this?' },
                    { name: 'Park Cleaner', text: '...' },
                    { name: 'Park Cleaner', text: 'Everyone who matters knows.' },
                    { name: 'You', text: '(He knows too much. Way too much.)' },
                    { name: '', text: '📌 The full reason for the attack is now clear.' },
                    { name: '', text: 'The Veridium can control everything. That\'s what they want.' }
                ], () => {
                    GameState.parkCleanerFriendship = 3
                    GameState.setFlag('reasonForAttackKnown')
                    this.showCleanerMenu()
                })

            } else {
                // Random chats after friendship maxed
                const chats = [
                    [
                        { name: 'Park Cleaner', text: 'The park looks better every day.' },
                        { name: 'You', text: 'Thanks to you.' },
                        { name: 'Park Cleaner', text: 'Thanks to US. Haha!' }
                    ],
                    [
                        { name: 'Park Cleaner', text: 'You seem ready for something big.' },
                        { name: 'You', text: 'Maybe I am.' },
                        { name: 'Park Cleaner', text: 'Good. The world needs people who are ready.' }
                    ]
                ]
                const chat = chats[Math.floor(Math.random() * chats.length)]
                this.dialog.show(chat, () => { this.showCleanerMenu() })
            }
            return
        }

        // ─── Level 2 random chats ──────────
        const chats = [
            [
                { name: 'Park Cleaner', text: 'Beautiful day isn\'t it?' },
                { name: 'You', text: 'The city is half destroyed.' },
                { name: 'Park Cleaner', text: 'But the sky is still blue! Haha!' }
            ],
            [
                { name: 'Park Cleaner', text: 'More flowers. Always more flowers.' },
                { name: 'Park Cleaner', text: 'Even in the darkest times, flowers grow.' }
            ]
        ]
        const chat = chats[Math.floor(Math.random() * chats.length)]
        this.dialog.show(chat, () => { this.showCleanerMenu() })
    }

    update() {
        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }
}