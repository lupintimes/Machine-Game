import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class WorkshopScene extends Phaser.Scene {
    constructor() {
        super('WorkshopScene')
    }

    preload() {
        this.load.image('workshop-bg', 'assets/images/workshop-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background ────────────────
        this.bg = this.add.image(0, 0, 'workshop-bg')
        this.bg.setOrigin(0, 0)
        this.bg.setDepth(-1)

        const scaleY = H / this.bg.height
        this.bg.setScale(scaleY)

        const scaledWidth = this.bg.width * scaleY
        this.physics.world.setBounds(0, 0, scaledWidth, H)
        this.cameras.main.setBounds(0, 0, scaledWidth, H)

        // ─── Interactable Stations ─────
        this.stations = [
            {
                rect: this.add.rectangle(820, 800, 700, 600, 0x8b4513).setDepth(1).setAlpha(0.3),
                name: 'Repair Bench',
                cooldown: false,
                reward: { money: 50, repair: 5, reputation: 3 }
            },
            {
                rect: this.add.rectangle(1930, 800, 700, 600, 0x555577).setDepth(1).setAlpha(0.3),
                name: 'Generator',
                cooldown: false,
                reward: { money: 80, repair: 8, reputation: 5 }
            },
            {
                rect: this.add.rectangle(3250, 800, 1200, 600, 0x665544).setDepth(1).setAlpha(0.3),
                name: 'Engine Rack',
                cooldown: false,
                reward: { money: 30, repair: 3, reputation: 2, elixir: true }
            }
        ]



        // ─── Press E hint ──────────────
        this.interactHint = this.add.text(0, 0, 'Press E to interact', {
            fontSize: '20px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(20).setVisible(false)

        // ─── Cooldown hint ─────────────
        this.cooldownHint = this.add.text(0, 0, '⏳ Cooling down...', {
            fontSize: '18px',
            fill: '#ff4444',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setDepth(20).setVisible(false).setScrollFactor(0)

        // ─── Player ────────────────────
        this.player = this.physics.add.image(400, 850)
        this.player.setDisplaySize(32, 48)
        this.player.body.setCollideWorldBounds(true)
        this.playerGfx = this.add.rectangle(400, 850, 32, 48, 0x00ff88)
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
        this.dialog.show([
            { name: 'You', text: 'My workshop... at least this place is still standing.' },
            { name: 'You', text: 'The armor is half done. I need a power core.' }
        ])

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 50, '🔧 Workshop', {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        this.nearStation = null
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

        // ─── Check distance to stations ─
        this.nearStation = null

        this.stations.forEach(station => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                station.rect.x, station.rect.y
            )

            if (dist < 200) {
                this.nearStation = station

                // Show hint above station
                this.interactHint.setVisible(true)
                this.interactHint.setPosition(
                    station.rect.x - 80,
                    station.rect.y - 250
                )

                // Highlight station
                station.rect.setStrokeStyle(3, 0xffff00)
                station.rect.setAlpha(0.5)
            } else {
                station.rect.setStrokeStyle(0)
                station.rect.setAlpha(0.3)
            }
        })

        if (!this.nearStation) {
            this.interactHint.setVisible(false)
        }

        // ─── Press E to interact ────────
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearStation) {
            this.onInteract(this.nearStation)
        }

        this.ui.updateStats()
    }

    onInteract(station) {
        if (station.cooldown) {
            this.dialog.show([
                { name: 'You', text: 'I just worked on this. Let me rest a bit.' }
            ])
            return
        }

        if (station.name === 'Repair Bench') {
            this.scene.pause('WorkshopScene')
            this.scene.launch('PressureValveGame')  // ← swapped
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        if (station.name === 'Generator') {
            this.scene.pause('WorkshopScene')
            this.scene.launch('WireConnectGame')  // ← swapped
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }

        if (station.name === 'Engine Rack') {
            this.scene.pause('WorkshopScene')
            this.scene.launch('EnergyCalibrationGame')
            station.cooldown = true
            this.time.delayedCall(5000, () => { station.cooldown = false })
        }
    }

    applyReward(station) {
        const r = station.reward

        // Apply rewards to GameState
        GameState.earnMoney(r.money)
        GameState.addSkill('repair', r.repair)
        GameState.addReputation(r.reputation)
        if (r.elixir) GameState.addElixir(1)

        // Update UI
        this.ui.updateStats()

        // Start cooldown (5 seconds)
        station.cooldown = true
        station.rect.setAlpha(0.15)

        this.time.delayedCall(5000, () => {
            station.cooldown = false
            station.rect.setAlpha(0.3)
        })

        // Check level 1 complete
        if (GameState.isLevel1Complete()) {
            this.dialog.show([
                { name: 'You', text: 'I have enough money now!' },
                { name: 'You', text: 'Time to visit the Junkyard and buy that power core!' }
            ])
        }
    }
}