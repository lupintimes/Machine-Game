export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskVisible = false
        this.taskItems = []
    }

    create() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Top Bar Background ────────────────────────
        this.bar = this.scene.add.rectangle(W / 2, 20, W, 40, 0x000000, 0.8)
        this.bar.setDepth(50).setScrollFactor(0)

        // ─── Stats Text ────────────────────────────────
        this.statsText = this.scene.add.text(20, 8, '', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setDepth(51).setScrollFactor(0)

        // ─── Level Text ────────────────────────────────
        this.levelText = this.scene.add.text(W - 120, 8, '', {
            fontSize: '18px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setDepth(51).setScrollFactor(0)

        // ─── Task Button ───────────────────────────────
        this.taskBtn = this.scene.add.rectangle(W - 80, H - 30, 130, 40, 0x333355)
        this.taskBtn.setDepth(50).setScrollFactor(0)
        this.taskBtn.setStrokeStyle(1, 0xffaa00)
        this.taskBtn.setInteractive({ useHandCursor: true })

        this.taskBtnText = this.scene.add.text(W - 80, H - 30, '📋 Tasks', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        this.taskBtn.on('pointerover', () => this.taskBtn.setFillStyle(0x444477))
        this.taskBtn.on('pointerout', () => this.taskBtn.setFillStyle(0x333355))
        this.taskBtn.on('pointerdown', () => this.toggleTaskPanel())

        // ─── Hub Button (hidden in HubScene) ───────────
        if (this.scene.scene.key !== 'HubScene') {
            this.hubBtn = this.scene.add.rectangle(80, H - 30, 130, 40, 0x333355)
            this.hubBtn.setDepth(50).setScrollFactor(0)
            this.hubBtn.setStrokeStyle(1, 0x00ff88)
            this.hubBtn.setInteractive({ useHandCursor: true })

            this.hubBtnText = this.scene.add.text(80, H - 30, '🗺️ Hub', {
                fontSize: '16px',
                fill: '#ffffff'
            }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

            this.hubBtn.on('pointerover', () => this.hubBtn.setFillStyle(0x444477))
            this.hubBtn.on('pointerout', () => this.hubBtn.setFillStyle(0x333355))
            this.hubBtn.on('pointerdown', () => {
                this.scene.cameras.main.fade(300, 0, 0, 0)
                this.scene.time.delayedCall(300, () => {
                    this.scene.scene.start('HubScene')
                })
            })
        }

        this.updateStats()
    }

    // ─── Update Stats ──────────────────────────────────
    updateStats() {
        this.statsText.setText(
            `⭐ ${GameState.reputation}   💰 ${GameState.money}   ⚗️ ${GameState.elixir}   🔧 ${GameState.skills.repair}   🔬 ${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)
    }

    // ─── Task Panel ────────────────────────────────────
    toggleTaskPanel() {
        if (this.taskVisible) {
            this.hideTaskPanel()
        } else {
            this.showTaskPanel()
        }
    }

    showTaskPanel() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        this.taskVisible = true
        const tasks = this.getCurrentTasks()

        // Overlay
        this.taskOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
        this.taskOverlay.setDepth(60).setScrollFactor(0)

        // Panel
        this.taskPanel = this.scene.add.rectangle(W / 2, H / 2, 600, 450, 0x1a1a2e)
        this.taskPanel.setStrokeStyle(2, 0xffaa00)
        this.taskPanel.setDepth(61).setScrollFactor(0)

        // Title
        this.taskTitle = this.scene.add.text(W / 2, H / 2 - 180, `📋 Level ${GameState.level} Tasks`, {
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        // Task list
        this.taskItems = []
        tasks.forEach((task, i) => {
            const check = task.done ? '✅' : '⬜'
            const color = task.done ? '#00ff88' : '#ffffff'
            const text = this.scene.add.text(W / 2 - 250, H / 2 - 110 + (i * 55), `${check} ${task.text}`, {
                fontSize: '20px',
                fill: color
            }).setDepth(62).setScrollFactor(0)
            this.taskItems.push(text)
        })

        // Armor status
        this.armorText = this.scene.add.text(W / 2, H / 2 + 140, this.getArmorStatus(), {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        // Close button
        this.taskClose = this.scene.add.text(W / 2, H / 2 + 190, '[ Close ]', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)
        this.taskClose.setInteractive({ useHandCursor: true })
        this.taskClose.on('pointerdown', () => this.hideTaskPanel())
    }

    hideTaskPanel() {
        this.taskVisible = false
        if (this.taskOverlay) this.taskOverlay.destroy()
        if (this.taskPanel) this.taskPanel.destroy()
        if (this.taskTitle) this.taskTitle.destroy()
        if (this.taskClose) this.taskClose.destroy()
        if (this.armorText) this.armorText.destroy()
        this.taskItems.forEach(t => t.destroy())
        this.taskItems = []
    }

    getCurrentTasks() {
        if (GameState.level === 1) {
            return [
                { text: 'Earn 500 coins', done: GameState.money >= 500 },
                { text: 'Reach 10 repair skill', done: GameState.skills.repair >= 10 },
                { text: 'Meet the Trader', done: GameState.getFlag('metTrader') },
                { text: 'Buy the Armor Core', done: GameState.getFlag('boughtCore') }
            ]
        }
        if (GameState.level === 2) {
            return [
                { text: 'Research the attack', done: GameState.skills.research >= 30 },
                { text: 'Discover the truth', done: GameState.getFlag('learnedTruth') },
                { text: 'Tell the King', done: GameState.getFlag('toldKing') }
            ]
        }
        if (GameState.level === 3) {
            return [
                { text: 'Install armor core', done: GameState.armor.parts.includes('core') },
                { text: 'Attach servo motors', done: GameState.armor.parts.includes('servo') },
                { text: 'Reinforce plating', done: GameState.armor.parts.includes('plating') },
                { text: 'Befriend Park Cleaner', done: GameState.getFlag('metParkCleaner') }
            ]
        }
        return [{ text: 'No tasks yet', done: false }]
    }

    getArmorStatus() {
        return `🤖 Armor: ${GameState.armor.parts.length}/3 parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}`
    }
}