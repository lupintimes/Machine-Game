export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene')
    }

    preload() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Background ────────────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a12)

        // ─── Title ─────────────────────────────────────
        this.add.text(W / 2, H / 2 - 100, '🤖 MACHINE GAME', {
            fontFamily: "'Orbitron', monospace",
            fontSize: '48px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5)

        // ─── Loading text ──────────────────────────────
        this.loadingText = this.add.text(W / 2, H / 2 + 20, 'Loading...', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5)

        // ─── Progress bar ──────────────────────────────
        // ⚠️ Define barY BEFORE using it
        const barW = 600
        const barH = 30
        const barX = W / 2 - barW / 2
        const barY = H / 2 + 70   // ← MUST be defined here

        this.add.rectangle(W / 2, barY + barH / 2, barW + 4, barH + 4, 0x333333)
        this.progressBar = this.add.rectangle(
            barX + 2, barY + 2, 0, barH, 0x00ff88
        ).setOrigin(0, 0)

        // ─── Percentage text (uses barY - now defined) ─
        this.percentText = this.add.text(W / 2, barY + barH + 20, '0%', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5)

        // ─── File name text ────────────────────────────
        this.fileText = this.add.text(W / 2, barY + barH + 50, '', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '14px',
            fill: '#555555'
        }).setOrigin(0.5)

        // ─── Progress events ───────────────────────────
        this.load.on('progress', (value) => {
            this.progressBar.width = barW * value
            this.percentText.setText(`${Math.round(value * 100)}%`)
            this.loadingText.setText(value < 1 ? 'Loading...' : 'Ready!')
        })

        this.load.on('fileprogress', (file) => {
            this.fileText.setText(file.key)
        })

        this.load.on('complete', () => {
            this.fileText.setText('All assets loaded!')
            this.percentText.setText('100%')
            this.loadingText.setText('Ready!')
        })

        // ═══════════════════════════════════════════════
        // ─── LOAD ALL GAME ASSETS ──────────────────────
        // ═══════════════════════════════════════════════

        // ─── Workshop ──────────────────────────────────
        this.load.image('workshop-morning', 'assets/images/workshop/workshop-morning.png')
        this.load.image('workshop-noon', 'assets/images/workshop/workshop-noon.png')
        this.load.image('workshop-evening', 'assets/images/workshop/workshop-evening.png')
        this.load.image('workshop-night', 'assets/images/workshop/workshop-night.png')

        // ─── Junkyard ──────────────────────────────────
        this.load.image('junkyard-morning', 'assets/images/junkyard/junkyard-morning.png')
        this.load.image('junkyard-noon', 'assets/images/junkyard/junkyard-noon.png')
        this.load.image('junkyard-evening', 'assets/images/junkyard/junkyard-evening.png')
        this.load.image('junkyard-night', 'assets/images/junkyard/junkyard-night.png')

        // ─── Palace ────────────────────────────────────
        this.load.image('palace-bg', 'assets/images/palace-bg.png')

        // ─── Town Center ───────────────────────────────
        this.load.image('towncenter-bg', 'assets/images/towncenter-bg.png')

        // ─── Park ──────────────────────────────────────
        this.load.image('park-bg', 'assets/images/park-bg.png')

        // ─── UI Icons ──────────────────────────────────
        this.load.image('inventory-panel', 'assets/images/ui/inventory-panel.png')
        
        this.load.image('lock-icon', 'assets/images/icons/lock.png')
        this.load.image('inventory-icon', 'assets/images/icons/inventory.png')
        this.load.image('tasks-icon', 'assets/images/icons/tasks.png')
        this.load.image('hub-icon', 'assets/images/icons/hub.png')

        this.load.image('time-morning', 'assets/images/ui/morning.png')
        this.load.image('time-noon', 'assets/images/ui/noon.png')
        this.load.image('time-evening', 'assets/images/ui/evening.png')
        this.load.image('time-night', 'assets/images/ui/night.png')

        this.load.image('choice-panel-bg', 'assets/images/ui/choice-panel-bg.png')
        this.load.image('choice-btn-green', 'assets/images/ui/choice-btn-green.png')
        this.load.image('choice-btn-teal', 'assets/images/ui/choice-btn-teal.png')
        this.load.image('choice-btn-purple', 'assets/images/ui/choice-btn-purple.png')
        this.load.image('choice-btn-dark', 'assets/images/ui/choice-btn-dark.png')
        // ─── Hub ───────────────────────────────────────
        this.load.image('hub-bg', 'assets/images/hub-bg.png')

        // ─── Workshop (single) ─────────────────────────
        this.load.image('workshop-bg', 'assets/images/workshop-bg.png')

        // ─── Secret Base ───────────────────────────────
        this.load.image('secretbase-bg', 'assets/images/secretbase-bg.png')
        this.load.image('armor-still', 'assets/images/armor-still.png')


        // ─── Luvaza ────────────────────────────────────
        this.load.image('dialog-luvaza-neutral', 'assets/images/dialog/Luvaza/Neutral.png')
        this.load.image('dialog-luvaza-happy', 'assets/images/dialog/Luvaza/Happy.png')
        this.load.image('dialog-luvaza-sad', 'assets/images/dialog/Luvaza/Sad.png')
        this.load.image('dialog-luvaza-worried', 'assets/images/dialog/Luvaza/Worried.png')
        this.load.image('dialog-luvaza-surprised', 'assets/images/dialog/Luvaza/Surprised.png')
        this.load.image('dialog-luvaza-serious', 'assets/images/dialog/Luvaza/Serious.png')

        // ─── Trader ────────────────────────────────────
        this.load.image('dialog-trader-neutral', 'assets/images/dialog/Trader/Neutral.png')
        this.load.image('dialog-trader-suspicious', 'assets/images/dialog/Trader/Suspicious.png')
        this.load.image('dialog-trader-serious', 'assets/images/dialog/Trader/Serious.png')
        this.load.image('dialog-trader-surprised', 'assets/images/dialog/Trader/Surprised.png')
        this.load.image('dialog-trader-smug', 'assets/images/dialog/Trader/Smug.png')

        // ─── Park Cleaner ──────────────────────────────
        this.load.image('dialog-parkcleaner-neutral', 'assets/images/dialog/ParkCleaner/Neutral.png')
        this.load.image('dialog-parkcleaner-worried', 'assets/images/dialog/ParkCleaner/Worried.png')
        this.load.image('dialog-parkcleaner-serious', 'assets/images/dialog/ParkCleaner/Serious.png')
        this.load.image('dialog-parkcleaner-surprised', 'assets/images/dialog/ParkCleaner/Surprised.png')

        // ─── King Expressions ──────────────────────────
        this.load.image('dialog-king-neutral', 'assets/images/dialog/king/Neutral.png')
        this.load.image('dialog-king-serious', 'assets/images/dialog/king/Serious.png')
        this.load.image('dialog-king-angry', 'assets/images/dialog/king/Angry.png')
        this.load.image('dialog-king-surprised', 'assets/images/dialog/king/Surprised.png')
        this.load.image('dialog-king-suspicious', 'assets/images/dialog/king/Suspicious.png')

        // ─── Player Expressions ────────────────────────
        this.load.image('dialog-player-neutral', 'assets/images/dialog/Player/Neutral.png')
        this.load.image('dialog-player-serious', 'assets/images/dialog/Player/Serious.png')
        this.load.image('dialog-player-angry', 'assets/images/dialog/Player/Angry.png')
        this.load.image('dialog-player-surprised', 'assets/images/dialog/Player/Surprised.png')
        this.load.image('dialog-player-determined', 'assets/images/dialog/Player/Smirk.png')
        this.load.image('dialog-player-sad', 'assets/images/dialog/Player/Sad.png')


        // ─── Add any other assets here ─────────────────
        // this.load.image('player', 'assets/images/player.png')
        // this.load.audio('bgm', 'assets/audio/bgm.mp3')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Show "Click to Start" ─────────────────────
        const startBtn = this.add.text(W / 2, H / 2 + 180, '[ Click to Start ]', {
            fontFamily: 'Courier, monospace',
            fontSize: '28px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })

        // ─── Pulse animation ───────────────────────────
        this.tweens.add({
            targets: startBtn,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        })

        startBtn.on('pointerover', () => startBtn.setFill('#ffffff'))
        startBtn.on('pointerout', () => startBtn.setFill('#00ff88'))
        startBtn.on('pointerdown', () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('HubScene')
            })
        })

        // ─── Also allow SPACE to start ─────────────────
        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('HubScene')
            })
        })
    }
}