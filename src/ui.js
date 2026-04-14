export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskVisible = false
        this.taskItems = []
    }

    create() {
        // ─── Top Bar Background ────────────────────────
        this.bar = this.scene.add.rectangle(400, 15, 800, 30, 0x000000, 0.8)
        this.bar.setDepth(50).setScrollFactor(0)

        // ─── Stats Text ────────────────────────────────
        this.statsText = this.scene.add.text(10, 5, '', {
            fontSize: '13px',
            fill: '#ffffff'
        }).setDepth(51).setScrollFactor(0)

        // ─── Level Text ────────────────────────────────
        this.levelText = this.scene.add.text(730, 5, '', {
            fontSize: '13px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setDepth(51).setScrollFactor(0)

        // ─── Task Button ───────────────────────────────
        this.taskBtn = this.scene.add.rectangle(740, 575, 100, 30, 0x333355)
        this.taskBtn.setDepth(50).setScrollFactor(0)
        this.taskBtn.setStrokeStyle(1, 0xffaa00)
        this.taskBtn.setInteractive({ useHandCursor: true })

        this.taskBtnText = this.scene.add.text(740, 575, '📋 Tasks', {
            fontSize: '13px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        this.taskBtn.on('pointerover', () => this.taskBtn.setFillStyle(0x444477))
        this.taskBtn.on('pointerout', () => this.taskBtn.setFillStyle(0x333355))
        this.taskBtn.on('pointerdown', () => this.toggleTaskPanel())

        // ─── Hub Button (hidden in HubScene) ───────────
        if (this.scene.scene.key !== 'HubScene') {
            this.hubBtn = this.scene.add.rectangle(60, 575, 100, 30, 0x333355)
            this.hubBtn.setDepth(50).setScrollFactor(0)
            this.hubBtn.setStrokeStyle(1, 0x00ff88)
            this.hubBtn.setInteractive({ useHandCursor: true })

            this.hubBtnText = this.scene.add.text(60, 575, '🗺️ Hub', {
                fontSize: '13px',
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
        this.taskVisible = true
        const tasks = this.getCurrentTasks()

        this.taskOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.6)
        this.taskOverlay.setDepth(60).setScrollFactor(0)

        this.taskPanel = this.scene.add.rectangle(400, 300, 400, 350, 0x1a1a2e)
        this.taskPanel.setStrokeStyle(2, 0xffaa00)
        this.taskPanel.setDepth(61).setScrollFactor(0)

        this.taskTitle = this.scene.add.text(400, 150, `📋 Level ${GameState.level} Tasks`, {
            fontSize: '18px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskItems = []
        tasks.forEach((task, i) => {
            const check = task.done ? '✅' : '⬜'
            const color = task.done ? '#00ff88' : '#ffffff'
            const text = this.scene.add.text(250, 200 + (i * 40), `${check} ${task.text}`, {
                fontSize: '14px',
                fill: color
            }).setDepth(62).setScrollFactor(0)
            this.taskItems.push(text)
        })

        this.armorText = this.scene.add.text(400, 390, this.getArmorStatus(), {
            fontSize: '13px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskClose = this.scene.add.text(400, 430, '[ Close ]', {
            fontSize: '14px',
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