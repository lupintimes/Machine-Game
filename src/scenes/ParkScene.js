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

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background ────────────────
        this.bg = this.add.image(0, 0, 'park-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        // ─── Debris piles ──────────────
        this.add.rectangle(400, H - 100, 200, 80, 0x443322)
            .setAlpha(0.6).setDepth(1)
        this.add.text(370, H - 150, '🌿', { fontSize: '40px' }).setDepth(2)

        this.add.rectangle(900, H - 110, 150, 70, 0x334433)
            .setAlpha(0.6).setDepth(1)
        this.add.text(870, H - 160, '🍃', { fontSize: '40px' }).setDepth(2)

        // ─── Park Cleaner ──────────────
        this.parkCleaner = this.add.rectangle(700, H / 2 + 50, 40, 70, 0x44aa44)
            .setDepth(3)

        this.add.text(700, H / 2 - 30, '🧹 Park Cleaner', {
            fontSize: '20px',
            fill: '#44ff44'
        }).setOrigin(0.5).setDepth(4)

        // His broom
        this.add.rectangle(730, H / 2 + 80, 8, 60, 0x885533)
            .setDepth(4)

        // ─── Interact hint ─────────────
        this.interactHint = this.add.text(0, 0, 'Press E to talk', {
            fontSize: '20px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(20).setVisible(false)

        // ─── Player ────────────────────
        this.player = this.physics.add.image(200, H / 2 + 100)
        this.player.setDisplaySize(104, 156)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(200, H / 2 + 100, 32, 48, 0x00ff88)
        this.playerGfx.setDepth(10)
        this.playerGfx.setScale(7.25)

        // ─── Camera ────────────────────
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // ─── Controls ──────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey('SPACE')
        this.eKey = this.input.keyboard.addKey('E')
        this.wasd = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

        // ─── Dialog ────────────────────
        this.dialog = new DialogBox(this)
        this.menuActive = false
        this.menuItems = []

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 30, '🌿 Park', {
            fontSize: '28px',
            fill: '#44ff44'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        // ─── Intro ─────────────────────
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

        this.player.setVelocity(0)

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed)
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed)
        }

        this.playerGfx.x = this.player.x
        this.playerGfx.y = this.player.y

        // ─── Check distance to Park Cleaner ─
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

        this.ui.updateStats()
    }

    // ─── Talk to Park Cleaner ──────────────────────────
    talkToParkCleaner() {
        if (!GameState.getFlag('metParkCleaner')) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'Oh! A visitor! Not many people come to the park these days.' },
                { name: 'You', text: 'Understandable. The whole city is in chaos.' },
                { name: 'Park Cleaner', text: 'Haha, yeah. But someone has to clean up!' },
                { name: 'Park Cleaner', text: 'Might as well be me. I love this park.' },
                { name: 'You', text: 'You seem very cheerful for someone cleaning up after an attack.' },
                { name: 'Park Cleaner', text: 'What can I say? A clean park means a happy city!' },
                { name: 'Park Cleaner', text: 'Besides, worrying doesn\'t fix anything.' },
                { name: 'Park Cleaner', text: 'Action does!' },
                { name: 'You', text: 'Fair enough. I\'m an engineer. I\'m trying to help rebuild.' },
                { name: 'Park Cleaner', text: 'An engineer! Perfect.' },
                { name: 'Park Cleaner', text: 'Maybe you could help me fix the park fountain sometime?' },
                { name: 'You', text: 'Sure. I\'d be happy to.' },
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

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 500, 400, 0x1a1a2e)
            .setStrokeStyle(3, 0x44ff44).setScrollFactor(0).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 160, '🧹 Park Cleaner', {
            fontSize: '28px',
            fill: '#44ff44',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

        // 💬 Talk
        this.createMenuButton(W / 2, H / 2 - 60, '💬 Chat', () => {
            this.closeMenu()
            this.cleanerChat()
        })

        // 🌿 Help Clean
        this.createMenuButton(W / 2, H / 2 + 20, '🌿 Help Clean Park', () => {
            this.closeMenu()
            this.helpClean()
        })

        // 🔙 Leave
        this.createMenuButton(W / 2, H / 2 + 100, '🔙 Leave', () => {
            this.closeMenu()
            this.scene.start('HubScene')
        })
    }

    createMenuButton(x, y, text, onClick) {
        const btn = this.add.rectangle(x, y, 350, 55, 0x333355)
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

    // ─── Cleaner Chat (random cheerful dialogs) ────────
    cleanerChat() {
        // ─── Special clue dialog (once) ────
        if (GameState.getFlag('rebuiltBuildings') && !GameState.getFlag('parkClueFound')) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'Ah! The city engineer! How goes the rebuilding?' },
                { name: 'You', text: 'Good. Almost done.' },
                { name: 'Park Cleaner', text: 'Wonderful! This city deserves to shine again.' },
                { name: 'You', text: 'Hey... can I ask you something?' },
                { name: 'Park Cleaner', text: 'Of course! Anything!' },
                { name: 'You', text: 'Do you know anything about the material vaults?' },
                { name: 'Park Cleaner', text: '...' },
                { name: 'Park Cleaner', text: 'The Veridium vaults? Under the east district?' },
                { name: 'You', text: 'How do you know about those?' },
                { name: 'Park Cleaner', text: 'Oh! I uh... I clean the parks near there.' },
                { name: 'Park Cleaner', text: 'You hear things. Haha!' },
                { name: 'You', text: 'The name Veridium... that\'s classified information.' },
                { name: 'Park Cleaner', text: '...' },
                { name: 'Park Cleaner', text: 'Is it? I had no idea. Haha!' },
                { name: 'Park Cleaner', text: 'Well! These leaves won\'t sweep themselves!' },
                { name: 'You', text: '(He knew the exact name. Something isn\'t right.)' },
                { name: '', text: '📌 Clue found! Keep investigating.' }
            ], () => {
                GameState.setFlag('parkClueFound')
                this.showCleanerMenu()

                // Check if truth unlocks
                if (GameState.skills.research >= 30 &&
                    GameState.getFlag('luvazaClueFound') &&
                    GameState.getFlag('parkClueFound')) {
                    this.time.delayedCall(500, () => {
                        // Go to workshop to trigger cutscene
                        this.dialog.show([
                            { name: 'You', text: 'I have all the pieces now.' },
                            { name: 'You', text: 'I need to go back to my workshop and put this together.' }
                        ])
                    })
                }
            })
            return
        }

        // ─── Random chats ──────────────────
        const chats = [
            [
                { name: 'Park Cleaner', text: 'Beautiful day isn\'t it? Well... despite everything.' },
                { name: 'You', text: 'The city is half destroyed.' },
                { name: 'Park Cleaner', text: 'But the sky is still blue! Haha!' }
            ],
            [
                { name: 'Park Cleaner', text: 'You know what this park needs?' },
                { name: 'You', text: 'What?' },
                { name: 'Park Cleaner', text: 'More flowers. Always more flowers.' },
                { name: 'Park Cleaner', text: 'Even in the darkest times, flowers grow.' }
            ],
            [
                { name: 'Park Cleaner', text: 'I heard you\'re rebuilding the town.' },
                { name: 'You', text: 'Trying to.' },
                { name: 'Park Cleaner', text: 'Good. The city needs that energy.' },
                { name: 'Park Cleaner', text: 'Keep going. Don\'t let anything stop you.' }
            ],
            [
                { name: 'Park Cleaner', text: 'Strange times, aren\'t they?' },
                { name: 'You', text: 'Very.' },
                { name: 'Park Cleaner', text: 'But every storm passes.' },
                { name: 'Park Cleaner', text: 'The important thing is who\'s standing when it does.' }
            ]
        ]

        const randomChat = chats[Math.floor(Math.random() * chats.length)]
        this.dialog.show(randomChat, () => {
            this.showCleanerMenu()
        })
    }

    // ─── Help Clean ────────────────────────────────────
    helpClean() {
        if (this.cleanedToday) {
            this.dialog.show([
                { name: 'Park Cleaner', text: 'We\'ve done enough for today!' },
                { name: 'Park Cleaner', text: 'Come back tomorrow. Haha!' }
            ], () => {
                this.showCleanerMenu()
            })
            return
        }

        this.dialog.show([
            { name: 'Park Cleaner', text: 'Really? You\'ll help? Wonderful!' },
            { name: 'You', text: 'What needs doing?' },
            { name: 'Park Cleaner', text: 'Clear the debris near the fountain.' },
            { name: 'Park Cleaner', text: 'Then maybe fix the benches.' },
            { name: 'You', text: 'On it.' },
            { name: '', text: '... some time later ...' },
            { name: 'Park Cleaner', text: 'You work fast for an engineer!' },
            { name: 'You', text: 'It\'s what I do.' },
            { name: 'Park Cleaner', text: 'Here. Take this. A little something from the park.' },
            { name: '', text: '⚗️ You received an Elixir!' }
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
            this.showCleanerMenu()
        })
    }
}