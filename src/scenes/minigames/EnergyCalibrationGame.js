export default class EnergyCalibrationGame extends Phaser.Scene {
    constructor() {
        super('EnergyCalibrationGame')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.hits = 0
        this.misses = 0
        this.maxMisses = 3
        this.totalRounds = 5
        this.round = 0
        this.waiting = false

        // ─── Background ────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(0)
        this.add.rectangle(W / 2, H / 2, 700, 700, 0x0a0a1a).setDepth(1)
            .setStrokeStyle(3, 0xff00ff)

        // ─── Title ─────────────────────
        this.add.text(W / 2, H / 2 - 310, '🔮 Energy Calibration', {
            fontSize: '36px',
            fill: '#ff00ff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2)

        this.add.text(W / 2, H / 2 - 260, 'Press SPACE when rings align!', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setDepth(2)

        // ─── Orb ───────────────────────
        this.orb = this.add.circle(W / 2, H / 2, 60, 0xff00ff).setDepth(3)
        this.orb.setStrokeStyle(4, 0xffffff)

        // ─── Outer ring ────────────────
        this.outerRing = this.add.circle(W / 2, H / 2, 150, 0x000000, 0).setDepth(3)
        this.outerRing.setStrokeStyle(6, 0xff00ff)

        // ─── Pulse ring (moves in/out) ─
        this.pulseRing = this.add.circle(W / 2, H / 2, 250, 0x000000, 0).setDepth(3)
        this.pulseRing.setStrokeStyle(4, 0xffffff)
        this.pulseRadius = 250
        this.pulseSpeed = 3
        this.pulseDirection = -1

        // ─── Miss indicators ───────────
        this.missIndicators = []
        for (let i = 0; i < this.maxMisses; i++) {
            const dot = this.add.circle(W / 2 - 30 + (i * 30), H / 2 + 220, 10, 0xff0000).setDepth(4)
            this.missIndicators.push(dot)
        }

        // ─── Status texts ──────────────
        this.roundText = this.add.text(W / 2, H / 2 - 200, `Round: 1 / ${this.totalRounds}`, {
            fontSize: '22px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(4)

        this.hitsText = this.add.text(W / 2, H / 2 + 170, `✅ Hits: 0`, {
            fontSize: '22px',
            fill: '#00ff88'
        }).setOrigin(0.5).setDepth(4)

        this.resultText = this.add.text(W / 2, H / 2 + 260, 'Press SPACE!', {
            fontSize: '26px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(4)

        // ─── Space key ─────────────────
        this.spaceKey = this.input.keyboard.addKey('SPACE')
    }

    update() {
        if (this.waiting) return

        // Move pulse ring in/out
        this.pulseRadius += this.pulseSpeed * this.pulseDirection

        if (this.pulseRadius <= 60) {
            this.pulseDirection = 1
        } else if (this.pulseRadius >= 250) {
            this.pulseDirection = -1
        }

        this.pulseRing.setRadius(this.pulseRadius)

        // Orb glow effect
        const proximity = 1 - Math.abs(this.pulseRadius - 150) / 100
        const glowColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 255, g: 0, b: 255 },
            { r: 255, g: 255, b: 255 },
            100,
            Math.floor(proximity * 100)
        )
        this.orb.setFillStyle(
            Phaser.Display.Color.GetColor(glowColor.r, glowColor.g, glowColor.b)
        )

        // Check space press
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.checkPress()
        }
    }

    checkPress() {
        // Perfect if pulse ring is within 20px of outer ring (150)
        const diff = Math.abs(this.pulseRadius - 150)

        if (diff <= 25) {
            // Perfect hit!
            this.hits++
            this.hitsText.setText(`✅ Hits: ${this.hits}`)
            this.resultText.setText('🎯 Perfect!')
            this.resultText.setFill('#00ff88')
            this.cameras.main.flash(200, 0, 255, 0)
        } else {
            // Miss!
            this.misses++
            this.resultText.setText('❌ Miss!')
            this.resultText.setFill('#ff4444')
            this.cameras.main.shake(200, 0.01)

            // Update miss indicators
            this.missIndicators.forEach((dot, i) => {
                if (i < this.misses) {
                    dot.setFillStyle(0x333333)
                }
            })

            if (this.misses >= this.maxMisses) {
                this.endGame(false)
                return
            }
        }

        this.round++
        this.roundText.setText(`Round: ${this.round + 1} / ${this.totalRounds}`)

        if (this.round >= this.totalRounds) {
            this.endGame(true)
            return
        }

        // Brief pause between rounds
        this.waiting = true
        this.time.delayedCall(800, () => {
            this.waiting = false
            this.resultText.setText('Press SPACE!')
            this.resultText.setFill('#ffffff')
        })
    }

    endGame(success) {
        this.waiting = true

        if (success && this.hits >= 3) {
            this.resultText.setText(`✅ Calibrated! ${this.hits}/${this.totalRounds} hits!`)
            this.resultText.setFill('#00ff88')
            GameState.addElixir(this.hits)
            GameState.addSkill('research', 5)
            GameState.addReputation(2)
        } else {
            this.resultText.setText('❌ Calibration failed! No reward.')
            this.resultText.setFill('#ff4444')
        }

        this.time.delayedCall(2500, () => {
            this.scene.stop('EnergyCalibrationGame')
            this.scene.resume('WorkshopScene')
        })
    }
}