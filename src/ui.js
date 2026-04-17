export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskVisible = false
        this.taskItems = []
        this.invVisible = false
        this.invSlots = []
        this.sleepItems = []
    }

    create() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Top Bar Background ────────────────────────
        this.bar = this.scene.add.rectangle(W / 2, 20, W, 40, 0x000000, 0.8)
            .setDepth(50).setScrollFactor(0)

        // ─── Stats Text (left side) ────────────────────
        this.statsText = this.scene.add.text(20, 8, '', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setDepth(51).setScrollFactor(0)

        // ─── Day/Time (center) ─────────────────────────
        this.dayText = this.scene.add.text(W / 2, 8, '', {
            fontSize: '16px',
            fill: '#ffdd44',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(51).setScrollFactor(0)

        // ─── Level Text (right side) ───────────────────
        this.levelText = this.scene.add.text(W - 120, 8, '', {
            fontSize: '18px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setDepth(51).setScrollFactor(0)

        // ─── Crisis Bar ────────────────────────────────
        this.crisisBarBg = this.scene.add.rectangle(W / 2, 50, W - 40, 16, 0x222222)
            .setDepth(50).setScrollFactor(0)

        this.crisisBar = this.scene.add.rectangle(20, 50, 0, 12, 0xff4444)
            .setOrigin(0, 0.5).setDepth(51).setScrollFactor(0)

        this.crisisLabel = this.scene.add.text(W / 2, 50, '', {
            fontSize: '11px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(52).setScrollFactor(0)

        // ─── Sleep Button ──────────────────────────────
        this.sleepBtn = this.scene.add.rectangle(W / 2 + 80, H - 30, 130, 40, 0x333355)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0x4444aa)
            .setInteractive({ useHandCursor: true })

        this.scene.add.text(W / 2 + 80, H - 30, '😴 Sleep', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        this.sleepBtn.on('pointerover', () => this.sleepBtn.setFillStyle(0x444477))
        this.sleepBtn.on('pointerout', () => this.sleepBtn.setFillStyle(0x333355))
        this.sleepBtn.on('pointerdown', () => this.openSleepMenu())

        // ─── Hub Button ────────────────────────────────
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

        // ─── Inventory Button ──────────────────────────
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

        // ─── Task Button ───────────────────────────────
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

    // ─── Sleep Menu ────────────────────────────────────
    openSleepMenu() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        this.sleepItems = []

        this.sleepOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200)

        this.sleepPanel = this.scene.add.rectangle(W / 2, H / 2, 500, 430, 0x0a0a1a)
            .setStrokeStyle(3, 0x4444aa).setScrollFactor(0).setDepth(201)

        const title = this.scene.add.text(W / 2, H / 2 - 180,
            `${GameState.getTimeIcon()} Day ${GameState.day} - ${GameState.timeOfDay}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        const daysLeft = this.scene.add.text(W / 2, H / 2 - 140,
            `⏳ ${GameState.getDaysLeft()} days remaining`, {
            fontSize: '18px',
            fill: GameState.getDaysLeft() <= 2 ? '#ff4444' : '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        this.sleepItems.push(this.sleepOverlay, this.sleepPanel, title, daysLeft)

        const closeAll = () => {
            this.sleepItems.forEach(i => { if (i) i.destroy() })
            this.sleepItems = []
        }

        // ─── Skip to Afternoon ─────────
        this.createSleepBtn(W / 2, H / 2 - 60, '☀️ Skip to Afternoon', () => {
            closeAll()
            GameState.skipToAfternoon()
            this.updateStats()
            this.showTimeTransition()
        })

        // ─── Skip to Evening ───────────
        this.createSleepBtn(W / 2, H / 2 + 20, '🌆 Skip to Evening', () => {
            closeAll()
            GameState.skipToEvening()
            this.updateStats()
            this.showTimeTransition()
        })

        // ─── Sleep until Morning ───────
        this.createSleepBtn(W / 2, H / 2 + 100, '😴 Sleep until Morning', () => {
            closeAll()
            const gameOver = GameState.skipToMorning()
            if (gameOver) {
                this.scene.scene.start('CutsceneScene', { key: 'gameOver' })
            } else {
                this.updateStats()
                this.showTimeTransition()
            }
        })

        // ─── Cancel ────────────────────
        this.createSleepBtn(W / 2, H / 2 + 180, '🔙 Cancel', () => {
            closeAll()
        }, true)
    }

    createSleepBtn(x, y, text, onClick, isCancel = false) {
        const btn = this.scene.add.rectangle(x, y, 380, 55, isCancel ? 0x222233 : 0x222244)
            .setStrokeStyle(2, isCancel ? 0x444444 : 0x4444aa)
            .setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })

        const label = this.scene.add.text(x, y, text, {
            fontSize: '18px',
            fill: isCancel ? '#aaaaaa' : '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(203)

        btn.on('pointerover', () => btn.setFillStyle(isCancel ? 0x333333 : 0x333366))
        btn.on('pointerout', () => btn.setFillStyle(isCancel ? 0x222233 : 0x222244))
        btn.on('pointerdown', onClick)

        this.sleepItems.push(btn, label)
    }

    // ─── Time Transition ───────────────────────────────
    showTimeTransition() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(300)

        const text = this.scene.add.text(W / 2, H / 2 - 20,
            `${GameState.getTimeIcon()} Day ${GameState.day} - ${GameState.timeOfDay}`, {
            fontSize: '42px',
            fill: GameState.getTimeColor(),
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0)

        const daysText = this.scene.add.text(W / 2, H / 2 + 50,
            `⏳ ${GameState.getDaysLeft()} days remaining`, {
            fontSize: '24px',
            fill: GameState.getDaysLeft() <= 2 ? '#ff4444' : '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0)

        this.scene.tweens.add({
            targets: [text, daysText],
            alpha: 1,
            duration: 800,
            onComplete: () => {
                this.scene.time.delayedCall(1500, () => {
                    this.scene.tweens.add({
                        targets: [overlay, text, daysText],
                        alpha: 0,
                        duration: 600,
                        onComplete: () => {
                            overlay.destroy()
                            text.destroy()
                            daysText.destroy()
                        }
                    })
                })
            }
        })
    }

    // ─── Stats ─────────────────────────────────────────
    updateStats() {
        this.statsText.setText(
            `⭐ ${GameState.reputation}   💰 ${GameState.money}   ⚗️ ${GameState.elixir}   🔧 ${GameState.skills.repair}   🔬 ${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)

        const icon = GameState.getTimeIcon()
        const daysLeft = GameState.getDaysLeft()
        this.dayText.setText(`${icon} Day ${GameState.day}/7 - ${GameState.timeOfDay} | ⏳ ${daysLeft} days left`)
        this.dayText.setFill(GameState.getTimeColor())

        const W = this.scene.cameras.main.width
        const progress = (GameState.day - 1) / GameState.maxDays
        const barWidth = Math.max(0, (W - 40) * progress)
        this.crisisBar.setSize(barWidth, 12)

        if (progress < 0.4) {
            this.crisisBar.setFillStyle(0x00ff88)
        } else if (progress < 0.7) {
            this.crisisBar.setFillStyle(0xffaa00)
        } else {
            this.crisisBar.setFillStyle(0xff4444)
        }

        this.crisisLabel.setText(`CRISIS: Day ${GameState.day} of ${GameState.maxDays}`)
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

        this.invOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200)

        this.invPanel = this.scene.add.rectangle(W / 2, H / 2, 900, 650, 0x1a1a2e)
            .setStrokeStyle(3, 0x00ff88)
            .setScrollFactor(0).setDepth(201)

        this.invTitle = this.scene.add.text(W / 2, H / 2 - 290, '🎒 Inventory', {
            fontSize: '30px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        this.invClose = this.scene.add.text(W / 2 + 420, H / 2 - 290, '✖', {
            fontSize: '28px',
            fill: '#ff4444'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })

        this.invClose.on('pointerover', () => this.invClose.setFill('#ff0000'))
        this.invClose.on('pointerout', () => this.invClose.setFill('#ff4444'))
        this.invClose.on('pointerdown', () => this.hideInventory())

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

        this.invArmor = this.scene.add.text(W / 2, H / 2 + 250,
            `🤖 Armor: ${GameState.armor.parts.length}/3 parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}`, {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

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

        this.taskPanel = this.scene.add.rectangle(W / 2, H / 2, 700, 600, 0x1a1a2e)
            .setStrokeStyle(2, 0xffaa00)
            .setDepth(61).setScrollFactor(0)

        this.taskTitle = this.scene.add.text(W / 2, H / 2 - 270, `📋 Level ${GameState.level} Tasks`, {
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskItems = []
        tasks.forEach((task, i) => {
            const check = task.done ? '✅' : '⬜'
            const color = task.done ? '#00ff88' : task.text.includes('───') ? '#555555' : '#ffffff'
            const text = this.scene.add.text(W / 2 - 300, H / 2 - 220 + (i * 38), `${task.text.includes('───') ? task.text : check + ' ' + task.text}`, {
                fontSize: '17px',
                fill: color
            }).setDepth(62).setScrollFactor(0)
            this.taskItems.push(text)
        })

        this.armorText = this.scene.add.text(W / 2, H / 2 + 260, this.getArmorStatus(), {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskClose = this.scene.add.text(W / 2, H / 2 + 300, '[ Close ]', {
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
                { text: 'Talk to the King', done: GameState.getFlag('metKing') },
                { text: 'Meet Luvaza at Town Center', done: GameState.getFlag('metLuvaza') },
                { text: 'Repair all town buildings', done: GameState.getFlag('rebuiltBuildings') },
                { text: 'Meet Park Cleaner', done: GameState.getFlag('metParkCleaner') },
                { text: 'Research attack (30 pts)', done: GameState.skills.research >= 30 },
                { text: '─── Clues ───', done: false },
                { text: '🔍 Research findings', done: GameState.getFlag('researchClueFound') },
                { text: '🔍 Luvaza\'s secret', done: GameState.getFlag('luvazaClueFound') },
                { text: '🔍 Park Cleaner slip', done: GameState.getFlag('parkClueFound') },
                { text: '🔍 Trader\'s warning', done: GameState.getFlag('traderClueFound') },
                { text: '─── Final ───', done: false },
                { text: '🎯 Discover the Truth', done: GameState.getFlag('learnedTruth') },
                { text: '👑 Tell the King', done: GameState.getFlag('toldKing') }
            ]
        }
        if (GameState.level === 3) {
            return [
                { text: 'Install servo motors', done: GameState.armor.parts.includes('servo') },
                { text: 'Install armor plating', done: GameState.armor.parts.includes('plating') },
                { text: '🤖 Armor complete', done: GameState.getFlag('armorComplete') },
                { text: '─── Park Cleaner ───', done: false },
                { text: `Friendship (${GameState.parkCleanerFriendship || 0}/3)`, done: (GameState.parkCleanerFriendship || 0) >= 3 },
                { text: 'Learn reason for attack', done: GameState.getFlag('reasonForAttackKnown') },
                { text: '─── The Betrayal ───', done: false },
                { text: '📡 Receive Luvaza\'s call', done: GameState.getFlag('gfCalledComms') },
                { text: '💔 Rush to the Palace', done: GameState.getFlag('gfDead') }
            ]
        }
        return [{ text: 'No tasks yet', done: false }]
    }

    getArmorStatus() {
        return `🤖 Armor: ${GameState.armor.parts.length}/3 parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}`
    }
}