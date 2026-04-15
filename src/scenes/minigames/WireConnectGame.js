export default class WireConnectGame extends Phaser.Scene {
    constructor() {
        super('WireConnectGame')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.timeLeft = 30
        this.score = 0
        this.failed = false

        // ─── Background overlay ────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(0)
        this.add.rectangle(W / 2, H / 2, 900, 700, 0x111122).setDepth(1)
            .setStrokeStyle(3, 0x00ff88)

        // ─── Title ─────────────────────
        this.add.text(W / 2, H / 2 - 310, '⚡ Wire Connect', {
            fontSize: '36px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2)

        this.add.text(W / 2, H / 2 - 260, 'Click nodes in the correct order!', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setDepth(2)

        // ─── Timer ─────────────────────
        this.timerText = this.add.text(W / 2, H / 2 - 220, 'Time: 30', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(2)

        this.time.addEvent({
            delay: 1000,
            callback: this.tickTimer,
            callbackScope: this,
            loop: true
        })

        // ─── Score ─────────────────────
        this.scoreText = this.add.text(W / 2, H / 2 - 180, 'Connections: 0', {
            fontSize: '22px',
            fill: '#ffaa00'
        }).setOrigin(0.5).setDepth(2)

        // ─── Generate nodes ────────────
        this.nodes = []
        this.currentTarget = 0
        this.generateNodes(W, H)

        // ─── Lines graphics ────────────
        this.lineGraphics = this.add.graphics().setDepth(3)

        // ─── Result text ───────────────
        this.resultText = this.add.text(W / 2, H / 2 + 280, '', {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(5)
    }

    generateNodes(W, H) {
        const count = 6
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]
        const positions = [
            { x: W / 2 - 320, y: H / 2 - 80 },
            { x: W / 2 - 150, y: H / 2 + 80 },
            { x: W / 2,       y: H / 2 - 120 },
            { x: W / 2 + 150, y: H / 2 + 60 },
            { x: W / 2 + 280, y: H / 2 - 80 },
            { x: W / 2 - 50,  y: H / 2 + 150 }
        ]

        positions.forEach((pos, i) => {
            // Node circle
            const circle = this.add.circle(pos.x, pos.y, 35, colors[i]).setDepth(4)
            circle.setStrokeStyle(4, 0xffffff)

            // Node number
            const label = this.add.text(pos.x, pos.y, `${i + 1}`, {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(5)

            // Make interactive
            circle.setInteractive()
            circle.on('pointerover', () => {
                if (i === this.currentTarget) {
                    circle.setScale(1.2)
                }
            })
            circle.on('pointerout', () => {
                circle.setScale(1)
            })
            circle.on('pointerdown', () => {
                this.onNodeClick(i, circle, pos, colors[i])
            })

            this.nodes.push({ circle, label, pos, color: colors[i], connected: false })
        })
    }

    onNodeClick(index, circle, pos, color) {
        if (this.failed) return

        if (index === this.currentTarget) {
            // Correct!
            circle.setStrokeStyle(6, 0x00ff88)
            circle.setAlpha(0.5)

            // Draw line to previous node
            if (this.currentTarget > 0) {
                const prev = this.nodes[this.currentTarget - 1].pos
                this.lineGraphics.lineStyle(4, color, 1)
                this.lineGraphics.beginPath()
                this.lineGraphics.moveTo(prev.x, prev.y)
                this.lineGraphics.lineTo(pos.x, pos.y)
                this.lineGraphics.strokePath()
            }

            this.currentTarget++
            this.score++
            this.scoreText.setText(`Connections: ${this.score}`)

            // All connected!
            if (this.currentTarget >= this.nodes.length) {
                this.endGame(true)
            }
        } else {
            // Wrong!
            this.cameras.main.shake(300, 0.01)
            circle.setFillStyle(0xff0000)
            this.resultText.setText('❌ Wrong node! Start over.')
            this.resultText.setFill('#ff4444')

            // Reset
            this.time.delayedCall(800, () => {
                this.resetNodes()
                this.resultText.setText('')
            })
        }
    }

    resetNodes() {
        this.currentTarget = 0
        this.score = 0
        this.scoreText.setText('Connections: 0')
        this.lineGraphics.clear()

        this.nodes.forEach((node, i) => {
            node.circle.setStrokeStyle(4, 0xffffff)
            node.circle.setAlpha(1)
            node.circle.setFillStyle(node.color)
        })
    }

    tickTimer() {
        if (this.failed) return
        this.timeLeft--
        this.timerText.setText(`Time: ${this.timeLeft}`)

        if (this.timeLeft <= 10) {
            this.timerText.setFill('#ff4444')
        }

        if (this.timeLeft <= 0) {
            this.endGame(false)
        }
    }

    endGame(success) {
        this.failed = true

        if (success) {
            this.resultText.setText('✅ Circuit Complete!')
            this.resultText.setFill('#00ff88')

            // Give rewards
            GameState.earnMoney(50)
            GameState.addSkill('repair', 5)
            GameState.addReputation(3)
        } else {
            this.resultText.setText('❌ Time is up! No reward.')
            this.resultText.setFill('#ff4444')
        }

        // Close after 2 seconds
        this.time.delayedCall(2000, () => {
            this.scene.stop('WireConnectGame')
            this.scene.resume('WorkshopScene')
        })
    }
}