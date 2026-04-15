export default class PressureValveGame extends Phaser.Scene {
    constructor() {
        super('PressureValveGame')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.timeLeft = 20
        this.failed = false

        // ─── Background ────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(0)
        this.add.rectangle(W / 2, H / 2, 1000, 700, 0x110a00).setDepth(1)
            .setStrokeStyle(3, 0xffaa00)

        // ─── Title ─────────────────────
        this.add.text(W / 2, H / 2 - 310, '🔧 Pressure Valve', {
            fontSize: '36px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2)

        this.add.text(W / 2, H / 2 - 260, 'Click gauges to release pressure before it EXPLODES!', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setDepth(2)

        // ─── Timer ─────────────────────
        this.timerText = this.add.text(W / 2, H / 2 - 220, 'Time: 20', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(2)

        this.time.addEvent({
            delay: 1000,
            callback: this.tickTimer,
            callbackScope: this,
            loop: true
        })

        // ─── Gauges ────────────────────
        this.gauges = []
        const positions = [
            W / 2 - 350,
            W / 2 - 120,
            W / 2 + 120,
            W / 2 + 350
        ]

        positions.forEach((x, i) => {
            this.gauges.push(this.createGauge(x, H / 2 + 20, i))
        })

        // ─── Result text ───────────────
        this.resultText = this.add.text(W / 2, H / 2 + 290, '', {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(5)

        // ─── Update gauges every 100ms ─
        this.time.addEvent({
            delay: 100,
            callback: this.updateGauges,
            callbackScope: this,
            loop: true
        })
    }

    createGauge(x, y, index) {
        const gauge = {
            x, y,
            value: Phaser.Math.Between(10, 30),   // start LOW
            speed: Phaser.Math.FloatBetween(0.8, 2.0),  // only goes UP
            bar: null,
            bg: null,
            valueText: null,
            label: null,
            exploded: false
        }

        // Label
        gauge.label = this.add.text(x, y - 175, `Valve ${index + 1}`, {
            fontSize: '18px',
            fill: '#ffaa00'
        }).setOrigin(0.5).setDepth(3)

        // Background bar
        gauge.bg = this.add.rectangle(x, y, 80, 300, 0x333333).setDepth(3)
        gauge.bg.setStrokeStyle(2, 0x666666)

        // Green zone (safe zone 0-60)
        this.add.rectangle(x, y + 60, 80, 120, 0x00ff00, 0.15).setDepth(3)
        this.add.text(x, y + 115, 'SAFE', {
            fontSize: '14px',
            fill: '#00ff00'
        }).setOrigin(0.5).setDepth(4)

        // Red zone (danger 60-100)
        this.add.rectangle(x, y - 90, 80, 60, 0xff0000, 0.15).setDepth(3)
        this.add.text(x, y - 115, 'DANGER', {
            fontSize: '14px',
            fill: '#ff0000'
        }).setOrigin(0.5).setDepth(4)

        // Value bar
        gauge.bar = this.add.rectangle(x, y + 140, 70, 5, 0x00ff88).setDepth(4)

        // Value text
        gauge.valueText = this.add.text(x, y + 165, '0%', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(4)

        // Click to release pressure (drops value back down)
        gauge.bg.setInteractive()
        gauge.bg.on('pointerdown', () => {
            if (!gauge.exploded) {
                gauge.value = Math.max(0, gauge.value - 40)  // release pressure
                this.cameras.main.flash(100, 0, 255, 100)
            }
        })
        gauge.bg.on('pointerover', () => {
            if (!gauge.exploded) {
                gauge.bg.setStrokeStyle(3, 0xffff00)
            }
        })
        gauge.bg.on('pointerout', () => {
            gauge.bg.setStrokeStyle(2, 0x666666)
        })

        return gauge
    }

    updateGauges() {
        if (this.failed) return

        this.gauges.forEach(gauge => {
            if (gauge.exploded) return

            // Pressure ONLY goes up
            gauge.value += gauge.speed
            gauge.value = Math.min(gauge.value, 100)

            // Update bar height
            const barHeight = (gauge.value / 100) * 280
            gauge.bar.setSize(70, Math.max(barHeight, 2))
            gauge.bar.setY(gauge.y + 140 - barHeight / 2)

            // Color based on pressure
            if (gauge.value < 60) {
                gauge.bar.setFillStyle(0x00ff88)
                gauge.valueText.setFill('#00ff88')
            } else if (gauge.value < 85) {
                gauge.bar.setFillStyle(0xffaa00)
                gauge.valueText.setFill('#ffaa00')
            } else {
                gauge.bar.setFillStyle(0xff4444)
                gauge.valueText.setFill('#ff4444')
                this.cameras.main.shake(50, 0.003)
            }

            gauge.valueText.setText(`${Math.round(gauge.value)}%`)

            // Explode if hits 100!
            if (gauge.value >= 100) {
                this.explodeGauge(gauge)
            }
        })
    }

    explodeGauge(gauge) {
        gauge.exploded = true
        gauge.bar.setFillStyle(0xff0000)
        gauge.bg.setFillStyle(0xff0000)
        gauge.bg.setAlpha(0.5)
        gauge.label.setText('💥 BOOM!')
        gauge.label.setFill('#ff0000')
        this.cameras.main.shake(500, 0.02)

        // Check if all exploded
        const allExploded = this.gauges.every(g => g.exploded)
        if (allExploded) {
            this.endGame(false)
        }
    }

    tickTimer() {
        if (this.failed) return
        this.timeLeft--
        this.timerText.setText(`Time: ${this.timeLeft}`)

        if (this.timeLeft <= 10) {
            this.timerText.setFill('#ff4444')
        }

        // Speed increases over time!
        this.gauges.forEach(gauge => {
            gauge.speed += 0.1
        })

        if (this.timeLeft <= 0) {
            this.endGame(true)
        }
    }

    endGame(success) {
        this.failed = true

        if (success) {
            const survived = this.gauges.filter(g => !g.exploded).length
            this.resultText.setText(`✅ Survived! ${survived}/4 valves intact!`)
            this.resultText.setFill('#00ff88')
            GameState.earnMoney(80)
            GameState.addSkill('repair', 8)
            GameState.addReputation(5)
        } else {
            this.resultText.setText('💥 All valves exploded! No reward.')
            this.resultText.setFill('#ff4444')
        }

        this.time.delayedCall(2000, () => {
            this.scene.stop('PressureValveGame')
            this.scene.resume('WorkshopScene')
        })
    }
}