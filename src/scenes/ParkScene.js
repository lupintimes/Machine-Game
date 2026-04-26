import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class ParkScene extends Phaser.Scene {
    constructor() {
        super('ParkScene')
    }

  


    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
        })

        // ─── Background ────────────────────────────────
        this.bg = this.add.image(0, 0, 'park-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.menuActive = false

        // ─── Daily tracking ────────────────────────────
        this.lastCleanedDay = -1

        // ─── Initialize friendship ─────────────────────
        if (GameState.flags.parkCleanerFriendship === undefined) {
            GameState.flags.parkCleanerFriendship = 0
        }

        // ─── Auto-trigger on enter ─────────────────────
        if (!GameState.getFlag('metParkCleaner')) {
            this.time.delayedCall(100, () => {
                this.dialog.show([
                    { name: '', text: 'The park is covered in debris and fallen trees.' },
                    { name: '', text: 'But someone is already cleaning it up...' }
                ], () => {
                    this.talkToParkCleaner()
                })
            })
        } else {
            this.time.delayedCall(100, () => {
                this.showCleanerMenu()
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

    // ─── Talk to Park Cleaner ──────────────────────────
    talkToParkCleaner() {
        if (!GameState.getFlag('metParkCleaner')) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'Oh! A visitor! Not many people come to the park these days.', expression: 'surprised' },
                { name: 'You', text: 'Understandable. The whole city is in chaos.', expression: 'serious' },
                { name: 'Park Cleaner', text: 'Haha, yeah. But someone has to clean up!', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'Might as well be me. I love this park.', expression: 'neutral' },
                { name: 'You', text: 'You seem very cheerful for someone cleaning up after an attack.', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'What can I say? A clean park means a happy city!', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'Besides, worrying doesn\'t fix anything. Action does!', expression: 'serious' },
                { name: 'You', text: 'Fair enough. I\'m an engineer. I\'m trying to help rebuild.', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'An engineer! Perfect.', expression: 'surprised' },
                { name: 'Park Cleaner', text: 'Maybe you could help me fix the park fountain sometime?', expression: 'neutral' },
                { name: 'You', text: 'Sure. I\'d be happy to.', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'Come back anytime. The park is always open!', expression: 'neutral' }
            ], () => {
                GameState.setFlag('metParkCleaner')
                this.showCleanerMenu()
            })
        } else {
            this.showCleanerMenu()
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── Cleaner Menu (Choice Panel) ───────────────────
    // ═══════════════════════════════════════════════════

    showCleanerMenu() {
        this.menuActive = true

        const friendship = GameState.flags.parkCleanerFriendship || 0
        const hearts = '❤️'.repeat(friendship) + '🖤'.repeat(Math.max(0, 3 - friendship))
        const green = { fill: '#88ff88' }

        const showClean = friendship < 3
        const showComms = GameState.getFlag('hasCommsDevice') &&
                          !GameState.getFlag('gaveCommsToGF') &&
                          GameState.getFlag('metLuvaza')

        // ── Calculate which purple slots to hide ───────
        const hidden = []
        if (!showClean && !showComms) hidden.push(1) // Hide teal if nothing to show
        if (!(showClean && showComms)) hidden.push(2) // Hide purple if we don't need both

        const choices = [
            // ── Slot 0: Chat (Green) ───────────────────
            {
                text: '💬 Chat',
                style: green,
                onSelect: () => {
                    this.menuActive = false
                    this.cleanerChat()
                }
            },
            // ── Slot 1: Help Clean OR Comms (Teal) ─────
            showClean
                ? {
                    text: '🌿 Help Clean Park',
                    style: green,
                    onSelect: () => {
                        this.menuActive = false
                        this.helpClean()
                    }
                }
                : showComms
                    ? {
                        text: '📡 Think about Luvaza...',
                        style: green,
                        onSelect: () => {
                            this.menuActive = false
                            this.considerGivingComms()
                        }
                    }
                    : { text: '', style: { fill: 'transparent' }, onSelect: () => {} },
            // ── Slot 2: Comms OR Empty (Purple) ────────
            showClean && showComms
                ? {
                    text: '📡 Think about Luvaza...',
                    style: green,
                    onSelect: () => {
                        this.menuActive = false
                        this.considerGivingComms()
                    }
                }
                : { text: '', style: { fill: 'transparent' }, onSelect: () => {} },
            // ── Slot 3: Leave (Dark) ───────────────────
            {
                text: '🔙 Leave',
                style: { fill: '#888888', fontStyle: 'italic' },
                onSelect: () => {
                    this.menuActive = false
                    this.cameras.main.fade(300, 0, 0, 0)
                    this.time.delayedCall(300, () => this.scene.start('HubScene'))
                }
            }
        ]

        this.dialog.showChoices(choices, {
            title: '🧹 Park Cleaner',
            subtitle: `Friendship: ${hearts}`,
            titleStyle: {
                fontSize: '60px',
                fill: '#44ff44'
            },
            subtitleStyle: {
                fontSize: '28px',
                fill: '#88ff88'
            },
            hiddenSlots: hidden
        })
    }

    // ─── Cleaner Chat ──────────────────────────────────
    cleanerChat() {
        const friendship = GameState.flags.parkCleanerFriendship || 0

        // ─── Level 2 clue ──────────────────────────────
        if (GameState.getFlag('rebuiltBuildings') &&
            !GameState.getFlag('parkClueFound') &&
            GameState.level < 3) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'Ah! The city engineer! How goes the rebuilding?', expression: 'neutral' },
                { name: 'You', text: 'Good. Almost done.', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'Wonderful! This city deserves to shine again.', expression: 'neutral' },
                { name: 'You', text: 'Hey... can I ask you something?', expression: 'serious' },
                { name: 'Park Cleaner', text: 'Of course! Anything!', expression: 'neutral' },
                { name: 'You', text: 'Do you know anything about the material vaults?', expression: 'serious' },
                { name: 'Park Cleaner', text: '...', expression: 'worried' },
                { name: 'Park Cleaner', text: 'The Veridium vaults? Under the east district?', expression: 'worried' },
                { name: 'You', text: 'How do you know about those?', expression: 'surprised' },
                { name: 'Park Cleaner', text: 'Oh! I uh... I clean the parks near there.', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'You hear things. Haha!', expression: 'neutral' },
                { name: 'You', text: 'The name Veridium... that\'s classified.', expression: 'serious' },
                { name: 'Park Cleaner', text: 'Is it? I had no idea. Haha!', expression: 'neutral' },
                { name: 'You', text: '(He knew the exact name. Something isn\'t right.)', expression: 'serious' },
                { name: '', text: '📌 Clue found! Keep investigating.' }
            ], () => {
                GameState.setFlag('parkClueFound')
                this.showCleanerMenu()
            })
            return
        }

        // ─── Level 3 friendship dialogs ────────────────
        if (GameState.level >= 3) {
            if (friendship === 0) {
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'You seem different lately.', expression: 'worried' },
                    { name: 'You', text: 'A lot has happened.', expression: 'sad' },
                    { name: 'Park Cleaner', text: 'Want to talk about it?', expression: 'neutral' },
                    { name: 'You', text: 'Maybe another time.', expression: 'neutral' },
                    { name: 'Park Cleaner', text: 'I\'m always here. That\'s what friends are for!', expression: 'neutral' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 1
                    this.showCleanerMenu()
                })

            } else if (friendship === 1) {
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'You know... I wasn\'t always a park cleaner.', expression: 'serious' },
                    { name: 'You', text: 'Oh? What did you do before?', expression: 'surprised' },
                    { name: 'Park Cleaner', text: 'I was... in the military. Long time ago.', expression: 'serious' },
                    { name: 'Park Cleaner', text: 'Seen things. Done things.', expression: 'serious' },
                    { name: 'You', text: 'Why become a park cleaner then?', expression: 'neutral' },
                    { name: 'Park Cleaner', text: 'Sometimes... you just want peace. Haha!', expression: 'neutral' },
                    { name: 'You', text: '(Military background... interesting.)', expression: 'serious' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 2
                    this.showCleanerMenu()
                })

            } else if (friendship === 2) {
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'Can I tell you something? As a friend?', expression: 'serious' },
                    { name: 'You', text: 'Of course.', expression: 'neutral' },
                    { name: 'Park Cleaner', text: 'This city... it\'s sitting on something big.', expression: 'serious' },
                    { name: 'You', text: 'The Veridium.', expression: 'serious' },
                    { name: 'Park Cleaner', text: '... You know about it?', expression: 'surprised' },
                    { name: 'You', text: 'I know enough. Tell me more.', expression: 'determined' },
                    { name: 'Park Cleaner', text: 'The Veridium can power anything.', expression: 'serious' },
                    { name: 'Park Cleaner', text: 'Weapons. Shields. Entire cities.', expression: 'serious' },
                    { name: 'Park Cleaner', text: 'Whoever controls it... controls everything.', expression: 'serious' },
                    { name: 'Park Cleaner', text: 'That\'s why they came. Not to destroy.', expression: 'serious' },
                    { name: 'Park Cleaner', text: 'To extract. To take what can\'t be taken publicly.', expression: 'serious' },
                    { name: 'You', text: 'And the King knows this?', expression: 'surprised' },
                    { name: 'Park Cleaner', text: '...', expression: 'worried' },
                    { name: 'Park Cleaner', text: 'Everyone who matters knows.', expression: 'serious' },
                    { name: 'You', text: '(He knows too much. Way too much.)', expression: 'serious' },
                    { name: '', text: '📌 The reason for the attack: Veridium extraction' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 3
                    GameState.setFlag('reasonForAttackKnown')
                    GameState.setFlag('parkClueFound')
                    this.ui.updateStats()

                    if (GameState.getFlag('armorComplete') &&
                        GameState.getFlag('gaveCommsToGF')) {
                        this.triggerTraderCall()
                    } else {
                        this.showCleanerMenu()
                    }
                })

            } else {
                const chats = [
                    [
                        { name: 'Park Cleaner', text: 'The park looks better every day.', expression: 'neutral' },
                        { name: 'You', text: 'Thanks to you.', expression: 'neutral' },
                        { name: 'Park Cleaner', text: 'Thanks to US. Haha!', expression: 'neutral' }
                    ],
                    [
                        { name: 'Park Cleaner', text: 'You seem ready for something big.', expression: 'serious' },
                        { name: 'You', text: 'Maybe I am.', expression: 'determined' },
                        { name: 'Park Cleaner', text: 'Good. The world needs people who are ready.', expression: 'serious' }
                    ]
                ]
                const chat = chats[Math.floor(Math.random() * chats.length)]
                this.dialog.show(chat, () => { this.showCleanerMenu() })
            }
            return
        }

        // ─── Level 2 random chats ──────────────────────
        const chats = [
            [
                { name: 'Park Cleaner', text: 'Beautiful day isn\'t it?', expression: 'neutral' },
                { name: 'You', text: 'The city is half destroyed.', expression: 'sad' },
                { name: 'Park Cleaner', text: 'But the sky is still blue! Haha!', expression: 'neutral' }
            ],
            [
                { name: 'Park Cleaner', text: 'More flowers. Always more flowers.', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'Even in the darkest times, flowers grow.', expression: 'serious' }
            ],
            [
                { name: 'Park Cleaner', text: 'I heard you\'re rebuilding the town.', expression: 'neutral' },
                { name: 'You', text: 'Trying to.', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'Keep going. Don\'t let anything stop you.', expression: 'serious' }
            ]
        ]
        const randomChat = chats[Math.floor(Math.random() * chats.length)]
        this.dialog.show(randomChat, () => { this.showCleanerMenu() })
    }

    // ─── Help Clean ────────────────────────────────────
    helpClean() {
        if (this.lastCleanedDay === GameState.day) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'We\'ve done enough for today!', expression: 'neutral' },
                { name: 'Park Cleaner', text: 'Come back tomorrow. Haha!', expression: 'neutral' }
            ], () => { this.showCleanerMenu() })
            return
        }

        this.dialog.show([
            { name: 'Park Cleaner', text: 'Really? You\'ll help? Wonderful!', expression: 'surprised' },
            { name: 'You', text: 'What needs doing?', expression: 'neutral' },
            { name: 'Park Cleaner', text: 'Clear the debris near the fountain.', expression: 'neutral' },
            { name: 'You', text: 'On it.', expression: 'determined' },
            { name: '', text: '... some time later ...' },
            { name: 'Park Cleaner', text: 'You work fast for an engineer!', expression: 'surprised' },
            { name: 'Park Cleaner', text: 'Here. Take this.', expression: 'neutral' },
            { name: '', text: '⚗️ You received an Elixir!' }
        ], () => {
            this.lastCleanedDay = GameState.day
            GameState.addElixir(1)
            GameState.addReputation(10)
            GameState.addItem({
                id: 'elixir',
                name: 'Elixir',
                icon: '⚗️',
                description: 'A mysterious liquid found in the park.',
                quantity: 1
            })
            this.ui.updateStats()
            this.showCleanerMenu()
        })
    }

    // ─── Consider giving comms ─────────────────────────
    considerGivingComms() {
        this.dialog.show([
            { name: 'You', text: 'Luvaza is at the Town Center...', expression: 'serious' },
            { name: 'You', text: 'I should give her the comms device.', expression: 'serious' },
            { name: 'You', text: 'If anything happens... she needs to reach me.', expression: 'determined' },
            { name: 'You', text: 'I\'ll go find her.', expression: 'determined' }
        ], () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('TownCenterScene')
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── TRADER CALL ───────────────────────────────────
    // ═══════════════════════════════════════════════════

    triggerTraderCall() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        const staticOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(90)

        const signalText = this.add.text(W / 2, H / 2, '📡 INCOMING: TRADER', {
            fontSize: '32px',
            fill: '#ff8800',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(91)

        this.tweens.add({
            targets: signalText,
            alpha: { from: 1, to: 0.3 },
            duration: 200,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                signalText.destroy()
                staticOverlay.destroy()

                this.dialog.show([
                    { name: '', text: '📡 *bzzt*' },
                    { name: 'Trader', text: 'Kid! Can you hear me?', expression: 'serious' },
                    { name: 'You', text: 'Trader? What is it?', expression: 'surprised' },
                    { name: 'Trader', text: 'I\'ve been running diagnostics on your armor.', expression: 'neutral' },
                    { name: 'Trader', text: 'Everything checks out.', expression: 'smug' },
                    { name: 'Trader', text: 'Core. Servos. Plating. All systems green.', expression: 'serious' },
                    { name: 'You', text: 'So it\'s...', expression: 'surprised' },
                    { name: 'Trader', text: 'Ready to wear. Fully operational.', expression: 'smug' },
                    { name: 'Trader', text: 'But I need you to come test it.', expression: 'serious' },
                    { name: 'Trader', text: 'Full movement test. Stress test. The works.', expression: 'serious' },
                    { name: 'Trader', text: 'Come to the base. Now if you can.', expression: 'neutral' },
                    { name: 'You', text: 'On my way.', expression: 'determined' },
                    { name: 'Trader', text: 'Good. And kid...', expression: 'neutral' },
                    { name: 'Trader', text: 'It\'s not a weapon. Remember that.', expression: 'serious' },
                    { name: '', text: '📡 *transmission ends*' },
                    { name: '', text: '🤖 Head to the Secret Base to test the armor!' }
                ], () => {
                    GameState.setFlag('traderCalledArmor')
                    this.menuActive = false
                    this.ui.updateStats()
                    this.showCleanerMenu()
                })
            }
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── EVENING CUTSCENE ──────────────────────────────
    // ═══════════════════════════════════════════════════

    triggerEveningCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
            .setScrollFactor(0).setDepth(100)

        this.tweens.add({
            targets: overlay,
            alpha: 0.95,
            duration: 1500,
            onComplete: () => {
                const eveningText = this.add.text(W / 2, H / 2, '🌙 Later that evening...', {
                    fontSize: '36px',
                    fill: '#4444aa',
                    fontStyle: 'italic'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0)

                this.tweens.add({
                    targets: eveningText,
                    alpha: 1,
                    duration: 1000,
                    onComplete: () => {
                        this.time.delayedCall(2000, () => {
                            this.tweens.add({
                                targets: eveningText,
                                alpha: 0,
                                duration: 800,
                                onComplete: () => {
                                    eveningText.destroy()
                                    this.showLuvazaDiscovery(overlay)
                                }
                            })
                        })
                    }
                })
            }
        })
    }

    // ─── Luvaza's Discovery ────────────────────────────
    showLuvazaDiscovery(overlay) {
        this.dialog.show([
            { name: '', text: '── Palace Gardens ──' },
            { name: '', text: 'Luvaza was walking through the palace grounds.' },
            { name: '', text: 'She often came here to think.' },
            { name: '', text: 'Tonight the gardens were quiet.' },
            { name: '', text: 'Too quiet.' },
            { name: '', text: '...' },
            { name: '', text: 'Then she heard voices.' },
            { name: '', text: 'Her father\'s voice. And someone else.' },
            { name: '', text: 'Coming from behind the old fountain.' },
            { name: '', text: 'She crept closer and hid behind the hedges.' },
            { name: '', text: '' },
            { name: '', text: '── What she heard ──' },
            { name: 'King', text: '...the Veridium extraction must be stopped.', expression: 'serious' },
            { name: 'Park Cleaner', text: '...the boy has been investigating...', expression: 'serious' },
            { name: 'King', text: '...we need to act before the enemy does.', expression: 'serious' },
            { name: 'Park Cleaner', text: '...if the enemy finds him first...', expression: 'worried' },
            { name: 'King', text: '...then we eliminate the threat. Whatever it takes.', expression: 'angry' },
            { name: 'Park Cleaner', text: '...understood. I\'ll handle the situation.', expression: 'serious' },
            { name: '', text: '' },
            { name: '', text: '── What they ACTUALLY meant ──' },
            { name: '', text: 'The King wanted to PROTECT the Veridium from enemies.' },
            { name: '', text: '"The boy" who\'s been investigating = the ENEMY spy.' },
            { name: '', text: '"Eliminate the threat" = stop the ENEMY\'s plan.' },
            { name: '', text: 'The Park Cleaner was a ROYAL AGENT investigating the attack.' },
            { name: '', text: '' },
            { name: '', text: '── But Luvaza only heard fragments ──' },
            { name: '', text: 'She heard "the boy" and thought they meant YOU.' },
            { name: '', text: 'She heard "eliminate" and thought they meant KILL.' },
            { name: '', text: 'She heard "Veridium extraction" and thought THEY planned it.' },
            { name: '', text: '' },
            { name: '', text: 'She was wrong about everything.' },
            { name: '', text: 'But she didn\'t know that.' },
            { name: '', text: '' },
            { name: 'Luvaza', text: '(whispering) No... father... you can\'t...', expression: 'worried' },
            { name: 'Luvaza', text: '(whispering) He\'s going to kill him...', expression: 'worried' },
            { name: 'Luvaza', text: '(whispering) I have to stop this. I have to confront him.', expression: 'serious' },
            { name: '', text: '' },
            { name: '', text: 'Luvaza didn\'t run away.' },
            { name: '', text: 'She didn\'t call for help.' },
            { name: '', text: 'She didn\'t use the comms device.' },
            { name: '', text: '' },
            { name: '', text: 'She walked straight into the throne room.' }
        ], () => {
            this.showConfrontationCutscene(overlay)
        })
    }

    // ─── Confrontation + Death ─────────────────────────
    showConfrontationCutscene(overlay) {
        this.dialog.show([
            { name: '', text: '── The Throne Room ──' },
            { name: '', text: 'The King and the Park Cleaner were standing by the map table.' },
            { name: '', text: 'Planning. Strategizing.' },
            { name: '', text: 'Luvaza burst through the doors.' },
            { name: '', text: '' },
            { name: 'Luvaza', text: 'FATHER!', expression: 'serious' },
            { name: 'King', text: 'Luvaza?! What are you—', expression: 'surprised' },
            { name: 'Luvaza', text: 'I HEARD YOU!', expression: 'serious' },
            { name: 'Luvaza', text: 'I heard everything in the garden!', expression: 'serious' },
            { name: 'Luvaza', text: 'You\'re going to kill him! The engineer!', expression: 'worried' },
            { name: 'King', text: 'What? No! Luvaza, you don\'t understand—', expression: 'surprised' },
            { name: 'Luvaza', text: 'DON\'T LIE TO ME!', expression: 'serious' },
            { name: 'Luvaza', text: 'You said "eliminate the threat"!', expression: 'serious' },
            { name: 'Luvaza', text: 'You were talking about the boy I LOVE!', expression: 'sad' },
            { name: 'King', text: 'No! We were talking about the ENEMY spy!', expression: 'angry' },
            { name: 'Luvaza', text: 'And the Veridium! You planned the attack!', expression: 'serious' },
            { name: 'King', text: 'I\'m trying to PROTECT the Veridium!', expression: 'angry' },
            { name: 'Park Cleaner', text: 'Princess, please. I\'m a royal agent. I\'m on your side—', expression: 'serious' },
            { name: 'Luvaza', text: 'YOU! You\'re the one he said would "handle it"!', expression: 'serious' },
            { name: 'Luvaza', text: 'I won\'t let you hurt him!', expression: 'serious' },
            { name: '', text: '' },
            { name: '', text: 'Luvaza lunged toward the Park Cleaner.' },
            { name: '', text: 'The royal guards reacted on instinct.' },
            { name: '', text: 'One of them grabbed her arm.' },
            { name: '', text: 'She pulled free—' },
            { name: '', text: 'Lost her balance—' },
            { name: '', text: 'And fell.' },
            { name: '', text: '' },
            { name: '', text: 'Her head hit the marble floor.' },
            { name: '', text: '' },
            { name: '', text: 'The sound echoed through the empty halls.' },
            { name: '', text: '' },
            { name: '', text: '...' },
            { name: '', text: '' },
            { name: '', text: 'Silence.' },
            { name: '', text: '' },
            { name: 'King', text: '...Luvaza?', expression: 'surprised' },
            { name: 'King', text: 'LUVAZA!', expression: 'angry' },
            { name: '', text: '' },
            { name: '', text: 'The King rushed to her side.' },
            { name: '', text: 'The Park Cleaner stood frozen.' },
            { name: '', text: 'The guards looked at their hands in horror.' },
            { name: '', text: '' },
            { name: '', text: 'She wasn\'t moving.' },
            { name: '', text: '' },
            { name: 'King', text: 'No... no no no... my little girl...', expression: 'angry' },
            { name: 'Park Cleaner', text: '...she... she wasn\'t supposed to...', expression: 'worried' },
            { name: '', text: '' },
            { name: '', text: 'The comms device in her pocket lit up.' },
            { name: '', text: 'One last automatic signal sent to the only contact.' },
            { name: '', text: '' },
            { name: '', text: 'Your name on the screen.' }
        ], () => {
            GameState.setFlag('gfDead')
            GameState.setFlag('luvazaVisitedPark')
            GameState.setFlag('gfHeardConversation')
            this.showCommsAlert(overlay)
        })
    }

    // ─── Comms Alert ───────────────────────────────────
    showCommsAlert(overlay) {
        this.dialog.show([
            { name: '', text: '── Back at your workshop ──' },
            { name: '', text: 'You were calibrating the armor when...' },
            { name: '', text: '📡 *BUZZ BUZZ BUZZ*' },
            { name: '', text: 'The comms channel crackles.' },
            { name: '', text: 'But there\'s no voice.' },
            { name: '', text: 'Just static.' },
            { name: '', text: 'And a location ping.' },
            { name: '', text: '' },
            { name: '', text: '📡 LOCATION: ROYAL PALACE' },
            { name: '', text: '📡 SIGNAL: LUVAZA\'S DEVICE' },
            { name: '', text: '📡 STATUS: EMERGENCY' },
            { name: '', text: '' },
            { name: 'You', text: '...', expression: 'surprised' },
            { name: 'You', text: 'Luvaza.', expression: 'serious' },
            { name: 'You', text: 'Something happened.', expression: 'serious' },
            { name: 'You', text: 'Something bad.', expression: 'angry' },
            { name: '', text: '' },
            { name: 'You', text: 'I have to get to the palace. NOW.', expression: 'determined' },
            { name: '', text: '⚠️ RUSH TO THE PALACE' }
        ], () => {
            GameState.setFlag('gfCalledComms')
            GameState.setFlag('conspiracyRevealed')
            if (overlay) overlay.destroy()
            this.showRushScreen()
        })
    }

    // ─── Rush Screen ───────────────────────────────────
    showRushScreen() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.rushItems = []

        const rushOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.95)
            .setScrollFactor(0).setDepth(100)
        this.rushItems.push(rushOverlay)

        const addText = (x, y, text, style) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(101)
            this.rushItems.push(t)
            return t
        }

        const urgentText = addText(W / 2, H / 2 - 80, '⚠️ EMERGENCY SIGNAL', {
            fontSize: '48px',
            fill: '#ff0000',
            fontStyle: 'bold'
        })

        this.tweens.add({
            targets: urgentText,
            alpha: { from: 1, to: 0.3 },
            duration: 400,
            yoyo: true,
            repeat: -1
        })

        addText(W / 2, H / 2, 'Luvaza\'s comms device sent an emergency ping.', {
            fontSize: '22px',
            fill: '#ffffff'
        })

        addText(W / 2, H / 2 + 40, 'Location: Royal Palace. No voice. Just static.', {
            fontSize: '20px',
            fill: '#ff8888'
        })

        addText(W / 2, H / 2 + 80, 'Something is very wrong.', {
            fontSize: '22px',
            fill: '#ff4444',
            fontStyle: 'italic'
        })

        const goBtn = addText(W / 2, H / 2 + 170, '[ RUSH TO PALACE ]', {
            fontSize: '30px',
            fill: '#ff0000',
            fontStyle: 'bold'
        })
        goBtn.setInteractive({ useHandCursor: true })

        goBtn.on('pointerover', () => goBtn.setStyle({ fill: '#ffffff' }))
        goBtn.on('pointerout', () => goBtn.setStyle({ fill: '#ff0000' }))
        goBtn.on('pointerdown', () => {
            this.rushItems.forEach(item => {
                if (item && item.active) item.destroy()
            })
            this.rushItems = []
            this.cameras.main.fade(800, 0, 0, 0)
            this.time.delayedCall(800, () => {
                this.scene.start('Level3PalaceScene')
            })
        })
    }
}