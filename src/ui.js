export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskPanel = null
        this.taskVisible = false
    }

    // ─── Stats Bar (Top) ───────────────────────────────
    createStatsBar() {
        // Background bar
        this.statsBg = this.scene.add.rectangle(400, 15, 800, 30, 0x000000, 0.7)
        this.statsBg.setDepth(200)
        this.statsBg.setScrollFactor(0)

        // Stats text
        this.statsText = this.scene.add.text(10, 5, '', {
            fontSize: '13px',
            fill: '#ffffff'
        })
        this.statsText.setDepth(201)
        this.statsText.setScrollFactor(0)

        // Level badge (right side)
        this.levelText = this.scene.add.text(720, 5, '', {
            fontSize: '13px',
            fill: '#00ff88',
            fontStyle: 'bold'
        })
        this.levelText.setDepth(201)
        this.levelText.setScrollFactor(0)

        this.updateStats()
    }

    updateStats() {
        this.statsText.setText(
            `⭐ ${GameState.reputation}   💰 ${GameState.money}   ⚗️ ${GameState.elixir}   🔧 ${GameState.skills.repair}   🔬 ${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)
    }

    // ─── Hub Button (Bottom Left) ──────────────────────
    // Only shown when NOT in HubScene
    createHubButton() {
        const currentScene = this.scene.scene.key
        if (currentScene === 'HubScene') return  // skip in hub

        const btn = this.scene.add.rectangle(60, 575, 100, 30, 0x333355)
        btn.setStrokeStyle(1, 0x00ff88)
        btn.setDepth(200)
        btn.setScrollFactor(0)
        btn.setInteractive({ useHandCursor: true })

        const btnText = this.scene.add.text(60, 575, '🗺️ Hub', {
            fontSize: '13px',
            fill: '#ffffff'
        }).setOrigin(0.5)
        btnText.setDepth(201)
        btnText.setScrollFactor(0)

        btn.on('pointerover', () => btn.setFillStyle(0x444477))
        btn.on('pointerout', () => btn.setFillStyle(0x333355))
        btn.on('pointerdown', () => {
            this.scene.cameras.main.fade(300, 0, 0, 0)
            this.scene.time.delayedCall(300, () => {
                this.scene.scene.start('HubScene')
            })
        })
    }

    // ─── Task Button (Bottom Right) ────────────────────
    createTaskButton() {
        const btn = this.scene.add.rectangle(740, 575, 100, 30, 0x333355)
        btn.setStrokeStyle(1, 0xffaa00)
        btn.setDepth(200)
        btn.setScrollFactor(0)
        btn.setInteractive({ useHandCursor: true })

        const btnText = this.scene.add.text(740, 575, '📋 Tasks', {
            fontSize: '13px',
            fill: '#ffffff'
        }).setOrigin(0.5)
        btnText.setDepth(201)
        btnText.setScrollFactor(0)

        btn.on('pointerover', () => btn.setFillStyle(0x444477))
        btn.on('pointerout', () => btn.setFillStyle(0x333355))
        btn.on('pointerdown', () => this.toggleTaskPanel())
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

        // Overlay
        this.taskOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.6)
        this.taskOverlay.setDepth(300)
        this.taskOverlay.setScrollFactor(0)

        // Panel
        this.taskPanel = this.scene.add.rectangle(400, 300, 400, 350, 0x1a1a2e, 0.95)
        this.taskPanel.setStrokeStyle(2, 0xffaa00)
        this.taskPanel.setDepth(301)
        this.taskPanel.setScrollFactor(0)

        // Title
        this.taskTitle = this.scene.add.text(400, 150, `📋 Level ${GameState.level} Tasks`, {
            fontSize: '18px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5)
        this.taskTitle.setDepth(302)
        this.taskTitle.setScrollFactor(0)

        // Task list
        this.taskItems = []
        tasks.forEach((task, i) => {
            const check = task.done ? '✅' : '⬜'
            const color = task.done ? '#00ff88' : '#ffffff'
            const text = this.scene.add.text(250, 200 + (i * 40), `${check} ${task.text}`, {
                fontSize: '14px',
                fill: color
            })
            text.setDepth(302)
            text.setScrollFactor(0)
            this.taskItems.push(text)
        })

        // Armor status
        this.armorText = this.scene.add.text(400, 390, this.getArmorStatus(), {
            fontSize: '13px',
            fill: '#888888'
        }).setOrigin(0.5)
        this.armorText.setDepth(302)
        this.armorText.setScrollFactor(0)

        // Close
        this.taskClose = this.scene.add.text(400, 430, '[ Close ]', {
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5)
        this.taskClose.setDepth(302)
        this.taskClose.setScrollFactor(0)
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
        if (this.taskItems) {
            this.taskItems.forEach(t => t.destroy())
            this.taskItems = []
        }
    }

    // ─── Tasks Per Level ───────────────────────────────
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
                { text: 'Research the attack (30 pts)', done: GameState.skills.research >= 30 },
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

    // ─── Armor Status ──────────────────────────────────
    getArmorStatus() {
        const parts = GameState.armor.parts
        const total = 3
        return `🤖 Armor: ${parts.length}/${total} parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}`
    }

    // ─── Create All ────────────────────────────────────
    createAll() {
        this.createStatsBar()
        this.createHubButton()
        this.createTaskButton()
    }
}