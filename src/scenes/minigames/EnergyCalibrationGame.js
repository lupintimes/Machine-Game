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

        const panelX = W / 2;
        const panelY = H / 2 - 22;

        const bgOffsetX = 0
        const bgOffsetY = -22

        const bg = this.add.image(W / 2 + bgOffsetX, H / 2 + bgOffsetY, 'energystabliser')
            .setDepth(0)

        const bgScale = 1
        bg.setScale(bgScale)


        const mechanismCenterX = W / 2 + 0
        const mechanismCenterY = H / 2 - 40


        // ─── Orb (Center glowing ball) ───────
        this.orb = this.add.circle(mechanismCenterX, mechanismCenterY, 60, 0xff00ff).setDepth(3)
        this.orb.setStrokeStyle(4, 0xffffff).setAlpha(0)

        // ─── Outer ring (Static target) ─────
        this.outerRing = this.add.circle(mechanismCenterX, mechanismCenterY, 150, 0x000000, 0).setDepth(3)
        this.outerRing.setStrokeStyle(6, 0xff00ff)

        // ─── Pulse ring (Moves in/out) ──────
        this.pulseRing = this.add.circle(mechanismCenterX, mechanismCenterY, 250, 0x000000, 0).setDepth(3)
        this.pulseRing.setStrokeStyle(4, 0xffffff)
        this.pulseRadius = 250
        this.pulseSpeed = 3
        this.pulseDirection = -1



        // ─── Round Text ──────────────────────
        this.roundText = this.add.text(mechanismCenterX, mechanismCenterY - 215, `Round: 1 / ${this.totalRounds}`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4)

        this.hitsText = this.add.text(mechanismCenterX + 55, mechanismCenterY + 230, '0', {
            fontSize: '28px',
            fill: '#22d04f',
            fontStyle: 'bold'

        }).setOrigin(0.5).setDepth(4).setFontFamily('Arial')

        // ─── Result Text ────────────────────
        this.resultText = this.add.text(mechanismCenterX, mechanismCenterY + 250, '', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4)

        this.missIndicators = [];

        const startX = W / 2 - 60; // adjust positioning
        const y = mechanismCenterY + 200;

        for (let i = 0; i < this.maxMisses; i++) {
            const dot = this.add.circle(startX + i * 40, y, 10, 0xff4444)
                .setDepth(4)
                .setAlpha(0.3); // faded initially

            this.missIndicators.push(dot);
        }

        // ─── Space key ─────────────────────
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Close Button ──────────────────
        const closeBtn = this.add.text(1270, 150, '✖', {
            fontSize: '32px', fill: '#ff4444', backgroundColor: '#000000', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('WorkshopScene');
        });
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
        const diff = Math.abs(this.pulseRadius - 150)

        if (diff <= 25) {
            this.hits++
            this.hitsText.setText(`${this.hits}`)
            this.resultText.setText('🎯 Perfect!')
            this.resultText.setFill('#00ff88')
            this.cameras.main.flash(200, 0, 255, 0)
        } else {
            this.misses++
            this.resultText.setText('❌ Miss!')
            this.resultText.setFill('#ff4444')
            this.cameras.main.shake(200, 0.01)

            // Make missed dots visible to "cross out" the PNG's red dots
            this.missIndicators.forEach((dot, i) => {
                if (i < this.misses) {
                    dot.setFillStyle(0x222222, 0.9) // Dark gray overlay
                }
            })

            if (this.misses >= this.maxMisses) {
                this.endGame(false)
                return
            }
        }


        this.roundText.setText(`Round: ${this.round + 1} / ${this.totalRounds}`)

        this.round++

        if (this.round >= this.totalRounds) {
            this.endGame(true)
            return
        }

        this.waiting = true
        this.time.delayedCall(800, () => {
            this.waiting = false
            this.resultText.setText('')
        })
    }

    endGame(success) {
        this.waiting = true

        if (success && this.hits >= 3) {
            this.resultText.setText(`✅ Success! +${this.hits} Elixir`)
            this.resultText.setFill('#00ff88')
            GameState.addElixir(this.hits)
            GameState.addSkill('research', 5)
            GameState.addReputation(2)
        } else {
            this.resultText.setText('❌ Calibration failed!')
            this.resultText.setFill('#ff4444')
        }

        this.time.delayedCall(2500, () => {
            this.scene.stop('EnergyCalibrationGame')
            this.scene.resume('WorkshopScene')
        })
    }
}