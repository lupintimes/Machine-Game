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

        // ─── Scene Title ───────────────────────────────
        this.add.text(W / 2, 30, '🌿 Park', {
            fontSize: '28px',
            fill: '#44ff44'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Initialize friendship ─────────────────────
        if (GameState.flags.parkCleanerFriendship === undefined) {
            GameState.flags.parkCleanerFriendship = 0
        }

        // ─── Check for comms call trigger ──────────────
        if (this.shouldTriggerCommsCall()) {
            this.time.delayedCall(500, () => {
                this.triggerCommsCall()
            })
            return
        }

        // ─── Check for Luvaza park visit trigger ───────
        if (this.shouldTriggerLuvazaParkVisit()) {
            this.time.delayedCall(500, () => {
                this.triggerLuvazaParkVisit()
            })
            return
        }

        // ─── Check for trader transmission trigger ─────
        if (this.shouldTriggerTraderTransmission()) {
            this.time.delayedCall(1000, () => {
                this.triggerTraderTransmission()
            })
            return
        }

        // ─── First time intro ──────────────────────────
        if (!GameState.getFlag('metParkCleaner')) {
            this.dialog.show([
                { name: '', text: 'The park is covered in debris and fallen trees.' },
                { name: '', text: 'But someone is already cleaning it up...' }
            ])
        }
    }

    // ─── Trigger Condition Checks ──────────────────────

    shouldTriggerTraderTransmission() {
        return (
            GameState.getFlag('reasonForAttackKnown') &&
            GameState.getFlag('armorComplete') &&
            !GameState.getFlag('traderCalledCleaner') &&
            GameState.level >= 3
        )
    }

    shouldTriggerLuvazaParkVisit() {
        return (
            GameState.getFlag('traderCalledCleaner') &&
            GameState.getFlag('gaveCommsToGF') &&
            !GameState.getFlag('luvazaVisitedPark') &&
            GameState.level >= 3
        )
    }

    shouldTriggerCommsCall() {
        return (
            GameState.getFlag('luvazaVisitedPark') &&
            GameState.getFlag('gaveCommsToGF') &&
            !GameState.getFlag('gfCalledComms') &&
            GameState.level >= 3
        )
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
                { name: 'Park Cleaner', text: 'Oh! A visitor! Not many people come to the park these days.' },
                { name: 'You',          text: 'Understandable. The whole city is in chaos.' },
                { name: 'Park Cleaner', text: 'Haha, yeah. But someone has to clean up!' },
                { name: 'Park Cleaner', text: 'Might as well be me. I love this park.' },
                { name: 'You',          text: 'You seem very cheerful for someone cleaning up after an attack.' },
                { name: 'Park Cleaner', text: 'What can I say? A clean park means a happy city!' },
                { name: 'Park Cleaner', text: 'Besides, worrying doesn\'t fix anything. Action does!' },
                { name: 'You',          text: 'Fair enough. I\'m an engineer. I\'m trying to help rebuild.' },
                { name: 'Park Cleaner', text: 'An engineer! Perfect.' },
                { name: 'Park Cleaner', text: 'Maybe you could help me fix the park fountain sometime?' },
                { name: 'You',          text: 'Sure. I\'d be happy to.' },
                { name: 'Park Cleaner', text: 'Come back anytime. The park is always open!' }
            ], () => {
                GameState.setFlag('metParkCleaner')
                this.showCleanerMenu()
            })
        } else {
            this.showCleanerMenu()
        }
    }

    // ─── Park Cleaner Menu ─────────────────────────────
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

        // 🌿 Help Clean (only if friendship < 3)
        if (friendship < 3) {
            this.createMenuButton(W / 2, btnY, '🌿 Help Clean Park', () => {
                this.closeMenu()
                this.helpClean()
            })
            btnY += 70
        }

        // 📡 Think about comms (hint to go to TownCenter)
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
        btn.on('pointerout',  () => btn.setFillStyle(0x333355))
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

        // ─── Level 2 clue (rebuiltBuildings) ───────────
        if (GameState.getFlag('rebuiltBuildings') &&
            !GameState.getFlag('parkClueFound') &&
            GameState.level < 3) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'Ah! The city engineer! How goes the rebuilding?' },
                { name: 'You',          text: 'Good. Almost done.' },
                { name: 'Park Cleaner', text: 'Wonderful! This city deserves to shine again.' },
                { name: 'You',          text: 'Hey... can I ask you something?' },
                { name: 'Park Cleaner', text: 'Of course! Anything!' },
                { name: 'You',          text: 'Do you know anything about the material vaults?' },
                { name: 'Park Cleaner', text: '...' },
                { name: 'Park Cleaner', text: 'The Veridium vaults? Under the east district?' },
                { name: 'You',          text: 'How do you know about those?' },
                { name: 'Park Cleaner', text: 'Oh! I uh... I clean the parks near there.' },
                { name: 'Park Cleaner', text: 'You hear things. Haha!' },
                { name: 'You',          text: 'The name Veridium... that\'s classified.' },
                { name: 'Park Cleaner', text: 'Is it? I had no idea. Haha!' },
                { name: 'You',          text: '(He knew the exact name. Something isn\'t right.)' },
                { name: '',             text: '📌 Clue found! Keep investigating.' }
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
                    { name: 'You',          text: 'A lot has happened.' },
                    { name: 'Park Cleaner', text: 'Want to talk about it?' },
                    { name: 'You',          text: 'Maybe another time.' },
                    { name: 'Park Cleaner', text: 'I\'m always here. That\'s what friends are for!' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 1
                    this.updateFriendshipDisplay()
                    this.showCleanerMenu()
                })

            } else if (friendship === 1) {
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'You know... I wasn\'t always a park cleaner.' },
                    { name: 'You',          text: 'Oh? What did you do before?' },
                    { name: 'Park Cleaner', text: 'I was... in the military. Long time ago.' },
                    { name: 'Park Cleaner', text: 'Seen things. Done things.' },
                    { name: 'You',          text: 'Why become a park cleaner then?' },
                    { name: 'Park Cleaner', text: 'Sometimes... you just want peace. Haha!' },
                    { name: 'You',          text: '(Military background... interesting.)' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 2
                    this.updateFriendshipDisplay()
                    this.showCleanerMenu()
                })

            } else if (friendship === 2) {
                // ─── VERIDIUM REVELATION ───────────────
                this.dialog.show([
                    { name: 'Park Cleaner', text: 'Can I tell you something? As a friend?' },
                    { name: 'You',          text: 'Of course.' },
                    { name: 'Park Cleaner', text: 'This city... it\'s sitting on something big.' },
                    { name: 'You',          text: 'The Veridium.' },
                    { name: 'Park Cleaner', text: '... You know about it?' },
                    { name: 'You',          text: 'I know enough. Tell me more.' },
                    { name: 'Park Cleaner', text: 'The Veridium can power anything.' },
                    { name: 'Park Cleaner', text: 'Weapons. Shields. Entire cities.' },
                    { name: 'Park Cleaner', text: 'Whoever controls it... controls everything.' },
                    { name: 'Park Cleaner', text: 'That\'s why they came. Not to destroy.' },
                    { name: 'Park Cleaner', text: 'To extract. To take what can\'t be taken publicly.' },
                    { name: 'You',          text: 'And the King knows this?' },
                    { name: 'Park Cleaner', text: '...' },
                    { name: 'Park Cleaner', text: 'Everyone who matters knows.' },
                    { name: 'You',          text: '(He knows too much. Way too much.)' },
                    { name: '',             text: '📌 The reason for the attack: Veridium extraction' }
                ], () => {
                    GameState.flags.parkCleanerFriendship = 3
                    GameState.setFlag('reasonForAttackKnown')
                    GameState.setFlag('parkClueFound')
                    this.updateFriendshipDisplay()
                    this.ui.updateStats()
                    this.showCleanerMenu()
                })

            } else {
                // ─── Post-friendship random chats ──────
                const chats = [
                    [
                        { name: 'Park Cleaner', text: 'The park looks better every day.' },
                        { name: 'You',          text: 'Thanks to you.' },
                        { name: 'Park Cleaner', text: 'Thanks to US. Haha!' }
                    ],
                    [
                        { name: 'Park Cleaner', text: 'You seem ready for something big.' },
                        { name: 'You',          text: 'Maybe I am.' },
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
                { name: 'You',          text: 'The city is half destroyed.' },
                { name: 'Park Cleaner', text: 'But the sky is still blue! Haha!' }
            ],
            [
                { name: 'Park Cleaner', text: 'More flowers. Always more flowers.' },
                { name: 'Park Cleaner', text: 'Even in the darkest times, flowers grow.' }
            ],
            [
                { name: 'Park Cleaner', text: 'I heard you\'re rebuilding the town.' },
                { name: 'You',          text: 'Trying to.' },
                { name: 'Park Cleaner', text: 'Keep going. Don\'t let anything stop you.' }
            ]
        ]
        const randomChat = chats[Math.floor(Math.random() * chats.length)]
        this.dialog.show(randomChat, () => { this.showCleanerMenu() })
    }

    // ─── Help Clean ────────────────────────────────────
    helpClean() {
        if (this.cleanedToday) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'We\'ve done enough for today!' },
                { name: 'Park Cleaner', text: 'Come back tomorrow. Haha!' }
            ], () => { this.showCleanerMenu() })
            return
        }

        this.dialog.show([
            { name: 'Park Cleaner', text: 'Really? You\'ll help? Wonderful!' },
            { name: 'You',          text: 'What needs doing?' },
            { name: 'Park Cleaner', text: 'Clear the debris near the fountain.' },
            { name: 'You',          text: 'On it.' },
            { name: '',             text: '... some time later ...' },
            { name: 'Park Cleaner', text: 'You work fast for an engineer!' },
            { name: 'Park Cleaner', text: 'Here. Take this.' },
            { name: '',             text: '⚗️ You received an Elixir!' }
        ], () => {
            GameState.addElixir(1)
            GameState.addReputation(10)
            GameState.addItem({
                id: 'elixir',
                name: 'Elixir',
                icon: '⚗️',
                description: 'A mysterious liquid found in the park.',
                quantity: 1
            })
            this.cleanedToday = true
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
    // ═══ STEP 1: TRADER TRANSMISSION ═══════════════════
    // After friendship 3 + armor complete
    // Trader calls Park Cleaner about armor upgrade part
    // ═══════════════════════════════════════════════════

    triggerTraderTransmission() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        this.dialog.show([
            { name: '',             text: 'You\'re walking through the park when...' },
            { name: '',             text: '📡 *bzzt* A radio crackle comes from the Park Cleaner\'s pocket.' },
            { name: 'Park Cleaner', text: 'Oh! Excuse me for a moment.' },
            { name: '',             text: 'The Park Cleaner steps away and answers.' },
            { name: '',             text: 'You can only hear bits of the conversation...' },
            { name: 'Park Cleaner', text: '...yes... I understand...' },
            { name: 'Park Cleaner', text: '...the Veridium deposits... yes...' },
            { name: 'Park Cleaner', text: '...I\'ll meet you at the palace tonight...' },
            { name: 'Park Cleaner', text: '...the King needs to know about the extraction plan...' },
            { name: '',             text: 'He hangs up and turns back to you.' },
            { name: 'Park Cleaner', text: 'Sorry about that! Old friend checking in.' },
            { name: 'Park Cleaner', text: 'Nothing important. Haha!' },
            { name: 'You',          text: '...' },
            { name: 'You',          text: '(Veridium... extraction plan... the palace...)' },
            { name: 'You',          text: '(He\'s meeting someone at the palace tonight.)' },
            { name: 'You',          text: '(Something is very wrong.)' },
            { name: '',             text: '📌 The Park Cleaner is meeting someone at the palace tonight.' },
            { name: '',             text: '📌 This could be connected to the attack.' }
        ], () => {
            GameState.setFlag('traderCalledCleaner')
            this.menuActive = false
            this.ui.updateStats()

            // ─── If Luvaza has comms, next event triggers ─
            if (GameState.getFlag('gaveCommsToGF')) {
                this.dialog.show([
                    { name: 'You', text: '(Luvaza is at the palace sometimes...)' },
                    { name: 'You', text: '(I hope she doesn\'t run into anything...)' },
                    { name: 'You', text: '(I should check on her soon.)' }
                ], () => {
                    this.showCleanerMenu()
                })
            } else {
                this.showCleanerMenu()
            }
        })
    }

    // ═══════════════════════════════════════════════════
    // ═══ STEP 2: LUVAZA VISITS PARK ════════════════════
    // She comes to the park, sees King + Cleaner talking
    // She MISHEARS their conversation
    // ═══════════════════════════════════════════════════

    triggerLuvazaParkVisit() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        // ─── Dark overlay for cutscene feel ────────────
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(90)

        const sceneLabel = this.add.text(W / 2, 80, '🌙 Later that evening...', {
            fontSize: '28px',
            fill: '#4444aa',
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(91)

        this.time.delayedCall(2000, () => {
            overlay.destroy()
            sceneLabel.destroy()

            this.dialog.show([
                { name: '',      text: '── Meanwhile, at the Palace Garden ──' },
                { name: '',      text: 'Luvaza was walking through the palace gardens.' },
                { name: '',      text: 'She heard voices near the old fountain.' },
                { name: '',      text: 'She recognized her father\'s voice...' },
                { name: '',      text: '...and someone else.' },
                { name: '',      text: 'She hid behind the hedges and listened.' },
                { name: '',      text: '── What she heard ──' },
                { name: 'King',         text: '...the Veridium extraction must proceed.' },
                { name: 'Park Cleaner', text: '...the boy is getting too close.' },
                { name: 'King',         text: '...we need to move faster.' },
                { name: 'Park Cleaner', text: '...if he finds out about our plan...' },
                { name: 'King',         text: '...then we eliminate the threat.' },
                { name: 'Park Cleaner', text: '...understood. I\'ll handle it.' },
                { name: '',      text: '── What they were ACTUALLY discussing ──' },
                { name: '',      text: 'The King was discussing PROTECTING the Veridium.' },
                { name: '',      text: 'The "boy getting close" was the enemy spy.' },
                { name: '',      text: '"Eliminate the threat" meant stopping the ENEMY.' },
                { name: '',      text: 'The Park Cleaner was actually a royal agent.' },
                { name: '',      text: 'He was investigating who attacked the city.' },
                { name: '',      text: '── But Luvaza didn\'t hear the full context ──' },
                { name: '',      text: 'She thought "the boy" meant YOU.' },
                { name: '',      text: 'She thought her father planned the attack.' },
                { name: '',      text: 'She thought the Park Cleaner was the enemy.' },
                { name: '',      text: 'She was WRONG.' },
                { name: '',      text: 'But she didn\'t know that.' },
                { name: '',      text: '...' },
                { name: 'Luvaza', text: '(whispering) No... father... how could you...' },
                { name: 'Luvaza', text: '(whispering) I have to warn him...' },
                { name: 'Luvaza', text: '(whispering) I have to use the comms device...' },
                { name: '',       text: 'Luvaza ran from the garden.' },
                { name: '',       text: 'She didn\'t see the King\'s worried face.' },
                { name: '',       text: 'She didn\'t hear what came next.' },
                { name: 'King',         text: '...did you hear something?' },
                { name: 'Park Cleaner', text: '...probably just the wind.' },
                { name: 'King',         text: '...I hope the boy is safe. He\'s done so much for this city.' },
                { name: 'Park Cleaner', text: '...I\'ll make sure nothing happens to him.' },
                { name: '',      text: '── Luvaza grabs the comms device ──' }
            ], () => {
                GameState.setFlag('luvazaVisitedPark')
                GameState.setFlag('gfHeardConversation')
                this.menuActive = false
                this.ui.updateStats()

                // ─── Trigger comms call immediately ────
                this.time.delayedCall(1000, () => {
                    this.triggerCommsCall()
                })
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ═══ STEP 3: COMMS CALL FROM LUVAZA ════════════════
    // She calls the player — panicked, misunderstanding
    // ═══════════════════════════════════════════════════

    triggerCommsCall() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true

        // ─── Static effect ─────────────────────────────
        const staticOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(100)

        const signalText = this.add.text(W / 2, H / 2 - 60, '📡 INCOMING TRANSMISSION', {
            fontSize: '36px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

        this.tweens.add({
            targets: signalText,
            alpha: { from: 1, to: 0.2 },
            duration: 150,
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                signalText.destroy()
                staticOverlay.destroy()

                this.dialog.show([
                    { name: '',       text: '📡 *static*... *crackle*...' },
                    { name: 'Luvaza', text: '...can you hear me?!' },
                    { name: 'You',    text: 'Luvaza?! What\'s wrong?' },
                    { name: 'Luvaza', text: 'I\'m at the palace!' },
                    { name: 'Luvaza', text: 'I heard my father talking to the park cleaner!' },
                    { name: 'You',    text: 'What? What did you hear?' },
                    { name: 'Luvaza', text: 'They\'re planning something! The Veridium!' },
                    { name: 'Luvaza', text: 'My father... he said to "eliminate the threat"!' },
                    { name: 'Luvaza', text: 'I think he means YOU!' },
                    { name: 'You',    text: 'Luvaza, calm down. What exactly—' },
                    { name: 'Luvaza', text: 'NO! You don\'t understand!' },
                    { name: 'Luvaza', text: 'He planned the attack! The park cleaner is working with him!' },
                    { name: 'Luvaza', text: 'I\'m going to confront him!' },
                    { name: 'You',    text: 'WAIT! Don\'t do anything! Let me—' },
                    { name: 'Luvaza', text: 'I can\'t just stand by while my father—' },
                    { name: 'Luvaza', text: 'I have to know the truth!' },
                    { name: 'You',    text: 'Luvaza PLEASE! You might be wrong! Just WAIT!' },
                    { name: 'Luvaza', text: 'I\'m going to the throne room. Right now.' },
                    { name: 'You',    text: 'NO! DON\'T!' },
                    { name: 'Luvaza', text: 'I\'m sorry. I have to do this.' },
                    { name: 'Luvaza', text: 'I love y—' },
                    { name: '',       text: '📡 *she hangs up*' },
                    { name: '',       text: '...' },
                    { name: 'You',    text: 'LUVAZA!' },
                    { name: 'You',    text: 'She\'s going to confront the King...' },
                    { name: 'You',    text: 'Based on what she THINKS she heard...' },
                    { name: 'You',    text: 'If the King is innocent and she accuses him...' },
                    { name: 'You',    text: 'Or if he\'s NOT innocent...' },
                    { name: 'You',    text: 'Either way she\'s in danger.' },
                    { name: 'You',    text: 'I have to get there NOW.' },
                    { name: '',       text: '⚠️ RUSH TO THE PALACE' }
                ], () => {
                    GameState.setFlag('gfCalledComms')
                    this.showRushScreen()
                })
            }
        })
    }

    // ─── Rush to Palace ────────────────────────────────
    showRushScreen() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.rushItems = []

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.95)
            .setScrollFactor(0).setDepth(100)
        this.rushItems.push(overlay)

        const addText = (x, y, text, style) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(101)
            this.rushItems.push(t)
            return t
        }

        const urgentText = addText(W / 2, H / 2 - 80, '⚠️ LUVAZA IS IN DANGER', {
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

        addText(W / 2, H / 2, 'She\'s confronting the King based on a misunderstanding.', {
            fontSize: '22px',
            fill: '#ffffff'
        })

        addText(W / 2, H / 2 + 40, 'You must stop her before it\'s too late.', {
            fontSize: '22px',
            fill: '#ff4444',
            fontStyle: 'italic'
        })

        const goBtn = addText(W / 2, H / 2 + 160, '[ RUSH TO PALACE ]', {
            fontSize: '30px',
            fill: '#ff0000',
            fontStyle: 'bold'
        })
        goBtn.setInteractive({ useHandCursor: true })

        goBtn.on('pointerover', () => goBtn.setStyle({ fill: '#ffffff' }))
        goBtn.on('pointerout',  () => goBtn.setStyle({ fill: '#ff0000' }))
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