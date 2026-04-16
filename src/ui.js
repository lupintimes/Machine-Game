import Inventory from './inventory.js'

export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskVisible = false
        this.taskItems = []
        this.invVisible = false
        this.invSlots = []
    }

    create() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Top Bar ───────────────────
        this.bar = this.scene.add.rectangle(W / 2, 20, W, 40, 0x000000, 0.8)
            .setDepth(50).setScrollFactor(0)

        // ─── Stats Text ────────────────
        this.statsText = this.scene.add.text(20, 8, '', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setDepth(51).setScrollFactor(0)

        // ─── Level Text ────────────────
        this.levelText = this.scene.add.text(W - 120, 8, '', {
            fontSize: '18px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setDepth(51).setScrollFactor(0)

        // ─── Hub Button ────────────────
        if (this.scene.scene.key !== 'HubScene') {
            this.hubBtn = this.scene.add.rectangle(80, H - 30, 130, 40, 0x333355)
                .setDepth(50).setScrollFactor(0)
                .setStrokeStyle(1, 0x00ff88)
                .setInteractive({ useHandCursor: true })

            this.scene.add.text(80, H - 30, '🗺️ Hub', {
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

        // ─── Inventory Button ──────────
        this.invBtn = this.scene.add.rectangle(W / 2 - 80, H - 30, 130, 40, 0x333355)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0xffffff)
            .setInteractive({ useHandCursor: true })

        this.scene.add.text(W / 2 - 80, H - 30, '🎒 Inventory', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        this.invBtn.on('pointerover', () => this.invBtn.setFillStyle(0x444477))
        this.invBtn.on('pointerout', () => this.invBtn.setFillStyle(0x333355))
        this.invBtn.on('pointerdown', () => this.toggleInventory())

        // ─── Task Button ───────────────
        this.taskBtn = this.scene.add.rectangle(W - 80, H - 30, 130, 40, 0x333355)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0xffaa00)
            .setInteractive({ useHandCursor: true })

        this.scene.add.text(W - 80, H - 30, '📋 Tasks', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        this.taskBtn.on('pointerover', () => this.taskBtn.setFillStyle(0x444477))
        this.taskBtn.on('pointerout', () => this.taskBtn.setFillStyle(0x333355))
        this.taskBtn.on('pointerdown', () => this.toggleTaskPanel())

        this.updateStats()
    }

    // ─── Stats ─────────────────────────────────────────
    updateStats() {
        this.statsText.setText(
            `⭐ ${GameState.reputation}   💰 ${GameState.money}   ⚗️ ${GameState.elixir}   🔧 ${GameState.skills.repair}   🔬 ${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)
    }

    // ─── Inventory ─────────────────────────────────────
    toggleInventory() {
        if (this.invVisible) {
            this.hideInventory()
        } else {
            this.showInventory()
        }
    }

    showInventory() {
        this.invVisible = true
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // Overlay
        this.invOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200)

        // Panel
        this.invPanel = this.scene.add.rectangle(W / 2, H / 2, 900, 650, 0x1a1a2e)
            .setStrokeStyle(3, 0x00ff88)
            .setScrollFactor(0).setDepth(201)

        // Title
        this.invTitle = this.scene.add.text(W / 2, H / 2 - 290, '🎒 Inventory', {
            fontSize: '30px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        // Close button
        this.invClose = this.scene.add.text(W / 2 + 420, H / 2 - 290, '✖', {
            fontSize: '28px',
            fill: '#ff4444'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })

        this.invClose.on('pointerover', () => this.invClose.setFill('#ff0000'))
        this.invClose.on('pointerout', () => this.invClose.setFill('#ff4444'))
        this.invClose.on('pointerdown', () => this.hideInventory())

        // ─── Grid slots ────────────────
        this.invSlots = []
        const cols = 6
        const rows = 4
        const slotSize = 100
        const startX = W / 2 - (cols * slotSize) / 2 + slotSize / 2
        const startY = H / 2 - 170

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * slotSize
                const y = startY + row * slotSize
                const index = row * cols + col
                const item = GameState.inventory[index]

                // Slot
                const slot = this.scene.add.rectangle(x, y, slotSize - 8, slotSize - 8, 0x222233)
                    .setStrokeStyle(1, 0x444466)
                    .setScrollFactor(0).setDepth(202)
                    .setInteractive({ useHandCursor: !!item })

                let icon = null
                let qty = null

                if (item) {
                    icon = this.scene.add.text(x, y - 10, item.icon, {
                        fontSize: '30px'
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)

                    qty = this.scene.add.text(x + 35, y + 30, `x${item.quantity}`, {
                        fontSize: '14px',
                        fill: '#ffaa00'
                    }).setOrigin(1, 1).setScrollFactor(0).setDepth(203)

                    // Hover
                    slot.on('pointerover', () => {
                        slot.setFillStyle(0x333355)
                        this.showInvTooltip(x, y - 70, item)
                    })
                    slot.on('pointerout', () => {
                        slot.setFillStyle(0x222233)
                        this.hideInvTooltip()
                    })
                } else {
                    slot.on('pointerover', () => slot.setFillStyle(0x2a2a44))
                    slot.on('pointerout', () => slot.setFillStyle(0x222233))
                }

                this.invSlots.push({ slot, icon, qty })
            }
        }

        // ─── Armor status ──────────────
        this.invArmor = this.scene.add.text(W / 2, H / 2 + 250,
            `🤖 Armor: ${GameState.armor.parts.length}/3 parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}`, {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        // Empty hint
        if (GameState.inventory.length === 0) {
            this.invEmpty = this.scene.add.text(W / 2, H / 2, 'No items yet!\nComplete tasks to earn items.', {
                fontSize: '22px',
                fill: '#555566',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
        }
    }

    showInvTooltip(x, y, item) {
        this.invTooltipBg = this.scene.add.rectangle(x, y, 220, 80, 0x000000, 0.95)
            .setStrokeStyle(1, 0x00ff88)
            .setScrollFactor(0).setDepth(210)

        this.invTooltipName = this.scene.add.text(x, y - 20, item.name, {
            fontSize: '16px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(211)

        this.invTooltipDesc = this.scene.add.text(x, y + 10, item.description, {
            fontSize: '13px',
            fill: '#aaaaaa',
            wordWrap: { width: 200 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(211)
    }

    hideInvTooltip() {
        if (this.invTooltipBg) this.invTooltipBg.destroy()
        if (this.invTooltipName) this.invTooltipName.destroy()
        if (this.invTooltipDesc) this.invTooltipDesc.destroy()
    }

    hideInventory() {
        this.invVisible = false
        if (this.invOverlay) this.invOverlay.destroy()
        if (this.invPanel) this.invPanel.destroy()
        if (this.invTitle) this.invTitle.destroy()
        if (this.invClose) this.invClose.destroy()
        if (this.invArmor) this.invArmor.destroy()
        if (this.invEmpty) this.invEmpty.destroy()
        this.hideInvTooltip()
        this.invSlots.forEach(s => {
            if (s.slot) s.slot.destroy()
            if (s.icon) s.icon.destroy()
            if (s.qty) s.qty.destroy()
        })
        this.invSlots = []
    }

    // ─── Tasks ─────────────────────────────────────────
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

        this.taskOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
            .setDepth(60).setScrollFactor(0)

        this.taskPanel = this.scene.add.rectangle(W / 2, H / 2, 600, 450, 0x1a1a2e)
            .setStrokeStyle(2, 0xffaa00)
            .setDepth(61).setScrollFactor(0)

        this.taskTitle = this.scene.add.text(W / 2, H / 2 - 180, `📋 Level ${GameState.level} Tasks`, {
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

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

        this.armorText = this.scene.add.text(W / 2, H / 2 + 140, this.getArmorStatus(), {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskClose = this.scene.add.text(W / 2, H / 2 + 190, '[ Close ]', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
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
                { text: 'Gain 5 repair skill (unlock Electrical)', done: GameState.skills.repair >= 5 },
                { text: 'Gain 10 repair skill (unlock Trader)', done: GameState.skills.repair >= 10 },
                { text: 'Meet the Trader', done: GameState.getFlag('metTrader') },
                { text: 'Buy the Armor Core', done: GameState.getFlag('boughtCore') }
            ]
        }
        if (GameState.level === 2) {
            return [
                // ─── Main tasks ────────────────
                { text: 'Visit the Palace', done: GameState.getFlag('metKing') },
                { text: 'Visit Town Center', done: GameState.getFlag('metLuvaza') },
                { text: 'Repair all buildings', done: GameState.getFlag('rebuiltBuildings') },
                { text: 'Visit the Park', done: GameState.getFlag('metParkCleaner') },
                { text: 'Research attack data (30)', done: GameState.skills.research >= 30 },

                // ─── Clues ─────────────────────
                { text: '🔍 Clue: Research complete', done: GameState.getFlag('researchClueFound') },
                { text: '🔍 Clue: Luvaza\'s secret', done: GameState.getFlag('luvazaClueFound') },
                { text: '🔍 Clue: Park Cleaner slip', done: GameState.getFlag('parkClueFound') },
                { text: '🔍 Clue: Trader\'s warning', done: GameState.getFlag('traderClueFound') },

                // ─── Final ─────────────────────
                { text: '🎯 Discover the Truth', done: GameState.getFlag('learnedTruth') },
                { text: '👑 Tell the King', done: GameState.getFlag('toldKing') }
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