import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class ParkScene extends Phaser.Scene {
    constructor() {
        super('ParkScene')
    }

    preload() {
        this.load.image('park-bg', 'assets/images/park-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background ────────────────────────────────
        this.bg = this.add.image(0, 0, 'park-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        // ─── Debris ────────────────────────────────────
        this.add.rectangle(400, H - 100, 200, 80, 0x443322)
            .setAlpha(0.6).setDepth(1)
        this.add.text(370, H - 150, '🌿', { fontSize: '40px' }).setDepth(2)

        this.add.rectangle(900, H - 110, 150, 70, 0x334433)
            .setAlpha(0.6).setDepth(1)
        this.add.text(870, H - 160, '🍃', { fontSize: '40px' }).setDepth(2)

        // ─── Park Cleaner NPC ──────────────────────────
        this.parkCleaner = this.add.rectangle(700, H / 2 + 50, 40, 70, 0x44aa44)
            .setDepth(3)

        this.parkCleanerLabel = this.add.text(700, H / 2 - 30, '🧹 Park Cleaner', {
            fontSize: '20px',
            fill: '#44ff44'
        }).setOrigin(0.5).setDepth(4)

        // ─── Friendship display ────────────────────────
        this.friendshipDisplay = this.add.text(700, H / 2 - 60, '', {
            fontSize: '16px'
        }).setOrigin(0.5).setDepth(4)
        this.updateFriendshipDisplay()

        // ─── Broom ─────────────────────────────────────
        this.add.rectangle(730, H / 2 + 80, 8, 60, 0x885533).setDepth(4)

        // ─── Interact hint ─────────────────────────────
        this.interactHint = this.add.text(0, 0, 'Press E to talk', {
            fontSize: '20px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(20).setVisible(false)

        // ─── Player ────────────────────────────────────
        this.player = this.physics.add.image(200, H / 2 + 100)
        this.player.setDisplaySize(104, 156)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(200, H / 2 + 100, 32, 48, 0x00ff88)
        this.playerGfx.setDepth(10)
        this.playerGfx.setScale(7.25)

        // ─── Camera ────────────────────────────────────
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // ─── Controls ──────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.eKey = this.input.keyboard.addKey('E')
        this.wasd = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.menuActive = false
        this.menuItems = []

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
        })

        // ─── Daily tracking ────────────────────────────
        this.lastCleanedDay = -1

        // ─── Scene Title ───────────────────────────────
        this.add.text(W / 2, 30, '🌿 Park', {
            fontSize: '28px',
            fill: '#44ff44'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Initialize friendship ─────────────────────
        if (GameState.flags.parkCleanerFriendship === undefined) {
            GameState.flags.parkCleanerFriendship = 0
        }

        // ─── First time intro ──────────────────────────
        if (!GameState.getFlag('metParkCleaner')) {
            this.dialog.show([
                { name: '', text: 'The park is covered in debris and fallen trees.' },
                { name: '', text: 'But someone is already cleaning it up...' }
            ])
        }
    }

    update() {
        const speed = 600

        if (this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
            return
        }

        if (this.menuActive) return

        this.player.setVelocity(0)

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed)
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        // ─── Distance to Park Cleaner ──────────────────
        const cleanerDist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.parkCleaner.x, this.parkCleaner.y
        )

        if (cleanerDist < 150) {
            this.interactHint.setVisible(true)
            this.interactHint.setPosition(
                this.parkCleaner.x - 80,
                this.parkCleaner.y - 130
            )
            this.parkCleaner.setStrokeStyle(3, 0xffff00)

            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.talkToParkCleaner()
            }
        } else {
            this.interactHint.setVisible(false)
            this.parkCleaner.setStrokeStyle(0)
        }
    }

    // ─── Friendship Display ────────────────────────────
    updateFriendshipDisplay() {
        const friendship = GameState.flags.parkCleanerFriendship || 0
        const hearts = '❤️'.repeat(friendship) + '🖤'.repeat(Math.max(0, 3 - friendship))
        this.friendshipDisplay.setText(hearts)
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

    // ─── Cleaner Menu ──────────────────────────────────
    showCleanerMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true
        this.menuItems = []

        this.menuOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(50)

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 500, 480, 0x1a1a2e)
            .setStrokeStyle(3, 0x44ff44).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 200, '🧹 Park Cleaner', {
            fontSize: '28px',
            fill: '#44ff44',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        // ─── Friendship in menu ────────────────────────
        const friendship = GameState.flags.parkCleanerFriendship || 0
        const hearts = '❤️'.repeat(friendship) + '🖤'.repeat(Math.max(0, 3 - friendship))
        const friendText = this.add.text(W / 2, H / 2 - 165, `Friendship: ${hearts}`, {
            fontSize: '16px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
        this.menuItems.push(friendText)

        let btnY = H / 2 - 90

        // 💬 Chat
        this.createMenuButton(W / 2, btnY, '💬 Chat', () => {
            this.closeMenu()
            this.cleanerChat()
        })
        btnY += 70

        // 🌿 Help Clean
        if (friendship < 3) {
            this.createMenuButton(W / 2, btnY, '🌿 Help Clean Park', () => {
                this.closeMenu()
                this.helpClean()
            })
            btnY += 70
        }

        // 📡 Think about comms
        if (GameState.getFlag('hasCommsDevice') &&
            !GameState.getFlag('gaveCommsToGF') &&
            GameState.getFlag('metLuvaza')) {
            this.createMenuButton(W / 2, btnY, '📡 Think about Luvaza...', () => {
                this.closeMenu()
                this.considerGivingComms()
            })
            btnY += 70
        }

        // 🔙 Leave
        this.createMenuButton(W / 2, btnY, '🔙 Leave', () => {
            this.closeMenu()
            this.scene.start('HubScene')
        })
    }

    createMenuButton(x, y, text, onClick) {
        const btn = this.add.rectangle(x, y, 380, 55, 0x333355)
            .setStrokeStyle(2, 0x44ff44)
            .setScrollFactor(0).setDepth(52)
            .setInteractive({ useHandCursor: true })

        const label = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(53)

        btn.on('pointerover', () => btn.setFillStyle(0x224422))
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
                    { name: 'Park Cleaner', text: 'You seem different lately.' },
                    { name: 'You', text: 'A lot has happened.' },
                    { name: 'Park Cleaner', text: 'Want to talk about it?' },
                    { name: 'You', text: 'Maybe another time.' },
                    { name: 'Park Cleaner', text: 'I\'m always here. That\'s what friends are for!' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 1
                    this.updateFriendshipDisplay()
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
                    GameState.flags.parkCleanerFriendship = 2
                    this.updateFriendshipDisplay()
                    this.showCleanerMenu()
                })

            } else if (friendship === 2) {
                // ─── VERIDIUM REVELATION ───────────────
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'Can I tell you something? As a friend?' },
                    { name: 'You', text: 'Of course.' },
                    { name: 'Park Cleaner', text: 'This city... it\'s sitting on something big.' },
                    { name: 'You', text: 'The Veridium.' },
                    { name: 'Park Cleaner', text: '... You know about it?' },
                    { name: 'You', text: 'I know enough. Tell me more.' },
                    { name: 'Park Cleaner', text: 'The Veridium can power anything.' },
                    { name: 'Park Cleaner', text: 'Weapons. Shields. Entire cities.' },
                    { name: 'Park Cleaner', text: 'Whoever controls it... controls everything.' },
                    { name: 'Park Cleaner', text: 'That\'s why they came. Not to destroy.' },
                    { name: 'Park Cleaner', text: 'To extract. To take what can\'t be taken publicly.' },
                    { name: 'You', text: 'And the King knows this?' },
                    { name: 'Park Cleaner', text: '...' },
                    { name: 'Park Cleaner', text: 'Everyone who matters knows.' },
                    { name: 'You', text: '(He knows too much. Way too much.)' },
                    { name: '', text: '📌 The reason for the attack: Veridium extraction' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 3
                    GameState.setFlag('reasonForAttackKnown')
                    GameState.setFlag('parkClueFound')
                    this.updateFriendshipDisplay()
                    this.ui.updateStats()

                    // ─── Check if armor is complete ─────
                    // If yes, trigger trader call + evening cutscene
                    if (GameState.getFlag('armorComplete') &&
                        GameState.getFlag('gaveCommsToGF')) {
                        this.triggerTraderCall()
                    } else {
                        this.showCleanerMenu()
                    }
                })

            } else {
                // ─── Post-friendship random chats ──────
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

        // ─── Level 2 random chats ──────────────────────
        const chats = [
            [
                { name: 'Park Cleaner', text: 'Beautiful day isn\'t it?' },
                { name: 'You', text: 'The city is half destroyed.' },
                { name: 'Park Cleaner', text: 'But the sky is still blue! Haha!' }
            ],
            [
                { name: 'Park Cleaner', text: 'More flowers. Always more flowers.' },
                { name: 'Park Cleaner', text: 'Even in the darkest times, flowers grow.' }
            ],
            [
                { name: 'Park Cleaner', text: 'I heard you\'re rebuilding the town.' },
                { name: 'You', text: 'Trying to.' },
                { name: 'Park Cleaner', text: 'Keep going. Don\'t let anything stop you.' }
            ]
        ]
        const randomChat = chats[Math.floor(Math.random() * chats.length)]
        this.dialog.show(randomChat, () => { this.showCleanerMenu() })
    }

    // ─── Help Clean ────────────────────────────────────
    helpClean() {
        if (this.lastCleanedDay === GameState.day) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'We\'ve done enough for today!' },
                { name: 'Park Cleaner', text: 'Come back tomorrow. Haha!' }
            ], () => { this.showCleanerMenu() })
            return
        }

        this.dialog.show([
            { name: 'Park Cleaner', text: 'Really? You\'ll help? Wonderful!' },
            { name: 'You', text: 'What needs doing?' },
            { name: 'Park Cleaner', text: 'Clear the debris near the fountain.' },
            { name: 'You', text: 'On it.' },
            { name: '', text: '... some time later ...' },
            { name: 'Park Cleaner', text: 'You work fast for an engineer!' },
            { name: 'Park Cleaner', text: 'Here. Take this.' },
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
            this.updateFriendshipDisplay()
            this.showCleanerMenu()
        })
    }

    // ─── Consider giving comms ─────────────────────────
    considerGivingComms() {
        this.dialog.show([
            { name: 'You', text: 'Luvaza is at the Town Center...' },
            { name: 'You', text: 'I should give her the comms device.' },
            { name: 'You', text: 'If anything happens... she needs to reach me.' },
            { name: 'You', text: 'I\'ll go find her.' }
        ], () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('TownCenterScene')
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ═══ TRADER CALLS PLAYER ═══════════════════════════
    // "Your armor is ready to wear!"
    // Then triggers the evening cutscene
    // ═══════════════════════════════════════════════════

    triggerTraderCall() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        // ─── Transmission effect ───────────────────────
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
                    { name: 'Trader', text: 'Kid! Can you hear me?' },
                    { name: 'You', text: 'Trader? What is it?' },
                    { name: 'Trader', text: 'I\'ve been running diagnostics on your armor.' },
                    { name: 'Trader', text: 'Everything checks out.' },
                    { name: 'Trader', text: 'Core. Servos. Plating. All systems green.' },
                    { name: 'You', text: 'So it\'s...' },
                    { name: 'Trader', text: 'Ready to wear. Fully operational.' },
                    { name: 'Trader', text: 'But I need you to come test it.' },
                    { name: 'Trader', text: 'Full movement test. Stress test. The works.' },
                    { name: 'Trader', text: 'Come to the base. Now if you can.' },
                    { name: 'You', text: 'On my way.' },
                    { name: 'Trader', text: 'Good. And kid...' },
                    { name: 'Trader', text: 'It\'s not a weapon. Remember that.' },
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
    // ═══ EVENING CUTSCENE ══════════════════════════════
    // Luvaza sees King + Park Cleaner at palace
    // She mishears their conversation
    // She confronts them — accident happens
    // Player gets the call too late
    // ═══════════════════════════════════════════════════

    triggerEveningCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        // ─── Fade to black ─────────────────────────────
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
            .setScrollFactor(0).setDepth(100)

        this.tweens.add({
            targets: overlay,
            alpha: 0.95,
            duration: 1500,
            onComplete: () => {

                // ─── Evening label ─────────────────────
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
            { name: 'King', text: '...the Veridium extraction must be stopped.' },
            { name: 'Park Cleaner', text: '...the boy has been investigating...' },
            { name: 'King', text: '...we need to act before the enemy does.' },
            { name: 'Park Cleaner', text: '...if the enemy finds him first...' },
            { name: 'King', text: '...then we eliminate the threat. Whatever it takes.' },
            { name: 'Park Cleaner', text: '...understood. I\'ll handle the situation.' },
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
            { name: 'Luvaza', text: '(whispering) No... father... you can\'t...' },
            { name: 'Luvaza', text: '(whispering) He\'s going to kill him...' },
            { name: 'Luvaza', text: '(whispering) I have to stop this. I have to confront him.' },
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
            { name: 'Luvaza', text: 'FATHER!' },
            { name: 'King', text: 'Luvaza?! What are you—' },
            { name: 'Luvaza', text: 'I HEARD YOU!' },
            { name: 'Luvaza', text: 'I heard everything in the garden!' },
            { name: 'Luvaza', text: 'You\'re going to kill him! The engineer!' },
            { name: 'King', text: 'What? No! Luvaza, you don\'t understand—' },
            { name: 'Luvaza', text: 'DON\'T LIE TO ME!' },
            { name: 'Luvaza', text: 'You said "eliminate the threat"!' },
            { name: 'Luvaza', text: 'You were talking about the boy I LOVE!' },
            { name: 'King', text: 'No! We were talking about the ENEMY spy!' },
            { name: 'Luvaza', text: 'And the Veridium! You planned the attack!' },
            { name: 'King', text: 'I\'m trying to PROTECT the Veridium!' },
            { name: 'Park Cleaner', text: 'Princess, please. I\'m a royal agent. I\'m on your side—' },
            { name: 'Luvaza', text: 'YOU! You\'re the one he said would "handle it"!' },
            { name: 'Luvaza', text: 'I won\'t let you hurt him!' },
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
            { name: 'King', text: '...Luvaza?' },
            { name: 'King', text: 'LUVAZA!' },
            { name: '', text: '' },
            { name: '', text: 'The King rushed to her side.' },
            { name: '', text: 'The Park Cleaner stood frozen.' },
            { name: '', text: 'The guards looked at their hands in horror.' },
            { name: '', text: '' },
            { name: '', text: 'She wasn\'t moving.' },
            { name: '', text: '' },
            { name: 'King', text: 'No... no no no... my little girl...' },
            { name: 'Park Cleaner', text: '...she... she wasn\'t supposed to...' },
            { name: '', text: '' },
            { name: '', text: 'The comms device in her pocket lit up.' },
            { name: '', text: 'One last automatic signal sent to the only contact.' },
            { name: '', text: '' },
            { name: '', text: 'Your name on the screen.' }
        ], () => {
            GameState.setFlag('gfDead')
            GameState.setFlag('luvazaVisitedPark')
            GameState.setFlag('gfHeardConversation')

            // ─── Now trigger comms alert ──────────────
            this.showCommsAlert(overlay)
        })
    }

    // ─── Comms Alert ───────────────────────────────────
    showCommsAlert(overlay) {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.dialog.show([
            { name: '', text: '' },
            { name: '', text: '── Back at your workshop ──' },
            { name: '', text: '' },
            { name: '', text: 'You were calibrating the armor when...' },
            { name: '', text: '' },
            { name: '', text: '📡 *BUZZ BUZZ BUZZ*' },
            { name: '', text: '' },
            { name: '', text: 'The comms channel crackles.' },
            { name: '', text: 'But there\'s no voice.' },
            { name: '', text: 'Just static.' },
            { name: '', text: 'And a location ping.' },
            { name: '', text: '' },
            { name: '', text: '📡 LOCATION: ROYAL PALACE' },
            { name: '', text: '📡 SIGNAL: LUVAZA\'S DEVICE' },
            { name: '', text: '📡 STATUS: EMERGENCY' },
            { name: '', text: '' },
            { name: 'You', text: '...' },
            { name: 'You', text: 'Luvaza.' },
            { name: 'You', text: 'Something happened.' },
            { name: 'You', text: 'Something bad.' },
            { name: '', text: '' },
            { name: 'You', text: 'I have to get to the palace. NOW.' },
            { name: '', text: '' },
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

            if (this.cameras && this.cameras.main) {
                this.cameras.main.fade(800, 0, 0, 0)
                this.time.delayedCall(800, () => {
                    this.scene.start('Level3PalaceScene')
                })
            } else {
                this.scene.start('Level3PalaceScene')
            }
        })
    }
}