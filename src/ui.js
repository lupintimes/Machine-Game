export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskVisible = false
        this.taskItems = []
        this.invVisible = false
        this.invSlots = []
        this._escHandler = null
        this.hubBtnLabel = null
        this.invBtnLabel = null
        this.taskBtnLabel = null
        this._newTaskShown = false
        this._lastTaskCheck = 0
    }

    create() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Top Bar Background (70px tall) ────────────
        this.bar = this.scene.add.rectangle(W / 2, 35, W, 70, 0x000000, 1)
            .setDepth(50).setScrollFactor(0).setStrokeStyle(2, 0x444444)

        // Stats text:
        this.statsText = this.scene.add.text(30, 25, '', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '20px',
            fill: '#ffffff'
        }).setDepth(51).setScrollFactor(0)

        // Level text:
        this.levelText = this.scene.add.text(W - 220, 15, '', {
            fontFamily: "'Orbitron', monospace",
            fontSize: '20px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(51).setScrollFactor(0)

        // ─── Crisis Bar (left) + Days text (right), centered ─
        const crisisW = 400
        const groupW = 620
        const groupStartX = (W - groupW) / 2
        const crisisY = 35
        const barX = groupStartX

        this.crisisBarBg = this.scene.add.rectangle(barX + crisisW / 2, crisisY, crisisW, 28, 0x222222, 0.6)
            .setStrokeStyle(1, 0x444444)
            .setDepth(51).setScrollFactor(0)

        this.crisisBar = this.scene.add.rectangle(barX, crisisY, 0, 26, 0xff4444)
            .setOrigin(0, 0.5).setDepth(52).setScrollFactor(0)

        this.crisisLabel = this.scene.add.text(barX + crisisW / 2, crisisY, '', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(53).setScrollFactor(0)

        this.dayText = this.scene.add.text(barX + crisisW + 25, crisisY, '', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '20px',
            fill: '#ffdd44',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0)

        // ─── Time Icon (single, cycles on tap) ─────────
        const timeKeys = ['time-morning', 'time-noon', 'time-evening', 'time-night']
        const timeNames = ['Morning', 'Afternoon', 'Evening', 'Night']
        const initIdx = GameState.timeIndex || 0
        const timeIconX = W - 80-100
        const timeIconY = 35
        const timeIconW = 300

        this.timeIcon = this.scene.add.image(timeIconX, timeIconY, timeKeys[initIdx])
            .setDepth(51)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        const timeIconScale = timeIconW / this.timeIcon.width
        this.timeIcon.setScale(timeIconScale)
        this.timeIcon._baseScale = timeIconScale

        this.timeIcon.on('pointerdown', () => {
            const currentIdx = GameState.timeIndex || 0
            const nextIdx = (currentIdx + 1) % 4
            this.changeTime(nextIdx)
        })

        this.timeIcon.on('pointerover', () => {
            this.timeIcon.setScale(this.timeIcon._baseScale * 1.1)
        })

        this.timeIcon.on('pointerout', () => {
            this.timeIcon.setScale(this.timeIcon._baseScale)
        })

        

        // ─── Navigation Icons (Top Right, Vertical) ────
        const btnX = W - 50 - 80
        const btnGap = 15
        const iconScale = 0.2
        let iconY = 80 + 80

        const makeIcon = (x, y, iconKey, onClick) => {
            const icon = this.scene.add.image(x, y, iconKey)
                .setScale(iconScale)
                .setDepth(51)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true })
            icon.on('pointerdown', onClick)
            return icon
        }

        if (this.scene.scene.key !== 'HubScene') {
            this.hubIcon = makeIcon(btnX, iconY, 'hub-icon', () => {
                this.scene.cameras.main.fade(300, 0, 0, 0)
                this.scene.time.delayedCall(300, () => {
                    this.scene.scene.start('HubScene')
                })
            })
            iconY += (this.hubIcon.displayHeight + btnGap)
        }

        this.invIcon = makeIcon(btnX, iconY, 'inventory-icon', () => this.toggleInventory())
        iconY += (this.invIcon.displayHeight + btnGap)

        this.taskIcon = makeIcon(btnX, iconY, 'tasks-icon', () => this.toggleTaskPanel())

        // ─── ESC handler ───────────────────────────────
        this._escHandler = () => {
            if (this.invVisible) {
                this.hideInventory()
            } else if (this.taskVisible) {
                this.hideTaskPanel()
            }
        }
        this.scene.input.keyboard.on('keydown-ESC', this._escHandler)

        this.updateStats()
    }

    // ─── Direct Time Change via UI ─────────────────────
    changeTime(newIndex) {
        if (newIndex === GameState.timeIndex) return

        if (newIndex === 0) {
            const gameOver = GameState.skipToMorning()
            if (gameOver) {
                this.scene.scene.start('CutsceneScene', { key: 'gameOver' })
                return
            }
        } else if (newIndex === 1 && GameState.timeIndex < 1) {
            GameState.skipToAfternoon()
        } else if (newIndex === 2 && GameState.timeIndex < 2) {
            GameState.skipToEvening()
        } else if (newIndex === 3 && GameState.timeIndex < 3) {
            GameState.skipToNight()
        } else {
            return
        }

        this.updateStats()
        this.showTimeTransition()
    }

    // ─── Time Transition ───────────────────────────────
    showTimeTransition() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        this.updateSceneBackground()

        const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x36454F, 0.87)
            .setScrollFactor(0).setDepth(300).setInteractive()

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
                this.scene.time.delayedCall(800, () => {
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

    // ─── Update Scene Background After Time Change ──────
    updateSceneBackground() {
        const scene = this.scene
        const time = GameState.timeOfDay
        const H = scene.cameras.main.height

        const bgMaps = {
            'WorkshopScene': {
                'morning': 'workshop-morning',
                'afternoon': 'workshop-noon',
                'evening': 'workshop-evening',
                'night': 'workshop-night'
            },
            'ParkScene': {
                'morning': 'park-morning',
                'afternoon': 'park-noon',
                'evening': 'park-evening',
                'night': 'park-night'
            },
            'JunkyardScene': {
                'morning': 'junkyard-morning',
                'afternoon': 'junkyard-noon',
                'evening': 'junkyard-evening',
                'night': 'junkyard-night'
            },
            'HubScene': {
                'morning': 'hub-morning',
                'afternoon': 'hub-noon',
                'evening': 'hub-evening',
                'night': 'hub-night'
            }
        }

        const sceneKey = scene.scene.key
        const map = bgMaps[sceneKey]
        if (!map || !scene.bg) return

        const bgKey = map[time]
        if (!bgKey) return
        if (!scene.textures.exists(bgKey)) return
        if (scene.bg.texture.key === bgKey) return

        scene.tweens.add({
            targets: scene.bg,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                scene.bg.setTexture(bgKey)
                scene.bg.setOrigin(0, 0)
                const scaleY = H / scene.bg.height
                scene.bg.setScale(scaleY)
                scene.tweens.add({ targets: scene.bg, alpha: 1, duration: 400 })
            }
        })
    }

    // ─── Stats ─────────────────────────────────────────
    updateStats() {
        const W = this.scene.cameras.main.width
        const isNarrow = W < 500

        this.statsText.setText(isNarrow
            ? `⭐${GameState.reputation} 💰${GameState.money} ⚗️${GameState.elixir}`
            : `⭐${GameState.reputation}  💰${GameState.money}  ⚗️${GameState.elixir}  🔧${GameState.skills.repair}  🔬${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)

        const daysLeft = GameState.getDaysLeft()
        this.dayText.setText(`⏳ ${daysLeft} days remaining`)
        this.dayText.setFill('#ffdd44')

        const tIndex = GameState.timeIndex || 0
        const timeNames = ['Morning', 'Afternoon', 'Evening', 'Night']

        // ─── Update time icon ──────────────────────────
        if (this.timeIcon) {
            const timeKeys = ['time-morning', 'time-noon', 'time-evening', 'time-night']
            this.timeIcon.setTexture(timeKeys[tIndex])

            const timeIconW = 300
            const newScale = timeIconW / this.timeIcon.width
            this.timeIcon.setScale(newScale)
            this.timeIcon._baseScale = newScale

            this.scene.tweens.add({
                targets: this.timeIcon,
                scaleX: newScale * 1.2,
                scaleY: newScale * 1.2,
                duration: 150,
                yoyo: true,
                ease: 'Back.easeOut'
            })
        }

        // ─── Update day pill text ──────────────────────
        if (this.dayPillText && this.dayPillTab) {
            const newTimeName = timeNames[tIndex] || 'Time'
            this.dayPillText.setText(`Day ${GameState.day} - ${newTimeName}`)
            this.dayPillTab.setSize(this.dayPillText.width + 20, 20)
            this.scene.tweens.add({
                targets: [this.dayPillTab, this.dayPillText],
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeInOut'
            })
        }

        // ─── Crisis bar update ─────────────────────────
        const crisisW = 400
        const progress = Math.min(1, (GameState.day) / GameState.maxDays)
        const barWidth = Math.max(0, crisisW * progress)
        this.crisisBar.setSize(barWidth, 26)

        if (progress < 0.4) {
            this.crisisBar.setFillStyle(0x00ff88)
        } else if (progress < 0.7) {
            this.crisisBar.setFillStyle(0xffaa00)
        } else {
            this.crisisBar.setFillStyle(0xff4444)
        }

        this.crisisLabel.setText(`Day ${GameState.day}/${GameState.maxDays}`)

        this.checkNewTasks()
    }

    // ─── Check New Tasks ───────────────────────────────
    checkNewTasks() {
        const now = Date.now()
        if (now - this._lastTaskCheck < 2000) return
        this._lastTaskCheck = now

        const currentTasks = this.getCurrentTasks()
        if (!currentTasks || currentTasks.length === 0) return

        // Build a signature of the current incomplete tasks
        const currentIncomplete = currentTasks.filter(t => !t.done).map(t => t.text)
        const currentSig = currentIncomplete.join('|||')

        // On first run, just store the baseline — don't notify
        if (!this._prevTaskSig && this._prevTaskSig !== '') {
            this._prevTaskSig = currentSig
            return
        }

        // Detect newly appeared tasks
        if (currentSig !== this._prevTaskSig) {
            const prevTexts = (this._prevTaskSig || '').split('|||').filter(Boolean)
            const newQuests = currentIncomplete.filter(t => !prevTexts.includes(t))
            this._prevTaskSig = currentSig

            if (newQuests.length > 0) {
                this.showNewTaskNotification(newQuests)
            }
        }
    }

    // ─── New Task Notification ─────────────────────────
    showNewTaskNotification(quests = []) {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // Layout constants
        const panelW = Math.min(520, W - 80)
        const questLineH = 32
        const headerH = 52
        const footerH = 16
        const panelH = headerH + (quests.length * questLineH) + footerH + 20
        const panelX = W / 2
        const startY = H + panelH
        const endY = H - panelH / 2 - 30

        const allItems = []

        // ─── Outer glow (shadow rectangle) ─────────────
        const glow = this.scene.add.rectangle(panelX, startY, panelW + 12, panelH + 12, 0x00ff88, 0.08)
            .setScrollFactor(0).setDepth(498)
        allItems.push(glow)

        // ─── Panel background ──────────────────────────
        const bg = this.scene.add.rectangle(panelX, startY, panelW, panelH, 0x0d1117, 0.96)
            .setStrokeStyle(2, 0x00ff88, 0.7)
            .setScrollFactor(0).setDepth(499)
        allItems.push(bg)

        // ─── Accent bar at top ─────────────────────────
        const accent = this.scene.add.rectangle(panelX, startY - panelH / 2 + 3, panelW, 6, 0x00ff88, 0.9)
            .setScrollFactor(0).setDepth(500)
        allItems.push(accent)

        // ─── Header: icon + title ──────────────────────
        const iconText = this.scene.add.text(panelX - panelW / 2 + 24, startY - panelH / 2 + 24, '📋', {
            fontSize: '28px'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501)
        allItems.push(iconText)

        const titleLabel = quests.length === 1 ? 'New Quest!' : `${quests.length} New Quests!`
        const title = this.scene.add.text(panelX - panelW / 2 + 62, startY - panelH / 2 + 24, titleLabel, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '20px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501)
        allItems.push(title)

        // ─── Divider line ──────────────────────────────
        const divider = this.scene.add.rectangle(panelX, startY - panelH / 2 + headerH, panelW - 40, 1, 0x00ff88, 0.25)
            .setScrollFactor(0).setDepth(500)
        allItems.push(divider)

        // ─── Quest items ───────────────────────────────
        const questItems = []
        quests.forEach((quest, i) => {
            const qY = startY - panelH / 2 + headerH + 18 + (i * questLineH)

            const bullet = this.scene.add.text(panelX - panelW / 2 + 30, qY, '▸', {
                fontSize: '18px',
                fill: '#ffaa00'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501).setAlpha(0)
            allItems.push(bullet)
            questItems.push(bullet)

            const questText = this.scene.add.text(panelX - panelW / 2 + 54, qY, quest, {
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '16px',
                fill: '#e0e0e0',
                wordWrap: { width: panelW - 90 }
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501).setAlpha(0)
            allItems.push(questText)
            questItems.push(questText)
        })

        // ─── Footer hint ──────────────────────────────
        const hint = this.scene.add.text(panelX, startY + panelH / 2 - 14, 'TAP to dismiss', {
            fontSize: '11px',
            fill: '#555555',
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501)
        allItems.push(hint)

        // ─── Tap to dismiss ────────────────────────────
        const hitArea = this.scene.add.rectangle(panelX, startY, panelW, panelH, 0x000000, 0)
            .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true })
        allItems.push(hitArea)

        let dismissed = false
        const dismissNotification = () => {
            if (dismissed) return
            dismissed = true
            this.scene.tweens.add({
                targets: allItems,
                y: '+=120',
                alpha: 0,
                duration: 350,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    allItems.forEach(item => {
                        if (item && item.active) item.destroy()
                    })
                }
            })
        }
        hitArea.on('pointerdown', dismissNotification)

        // ─── Slide-in animation ────────────────────────
        this.scene.tweens.add({
            targets: allItems,
            y: `-=${startY - endY}`,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Staggered fade-in for quest items
                questItems.forEach((item, idx) => {
                    this.scene.time.delayedCall(idx * 120, () => {
                        if (!item || !item.active) return
                        this.scene.tweens.add({
                            targets: item,
                            alpha: 1,
                            x: item.x,
                            duration: 300,
                            ease: 'Quad.easeOut'
                        })
                    })
                })

                // Pulse the icon
                this.scene.tweens.add({
                    targets: iconText,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 250,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut'
                })

                // Subtle glow pulse
                this.scene.tweens.add({
                    targets: glow,
                    alpha: 0.2,
                    duration: 800,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Sine.easeInOut'
                })
            }
        })

        // ─── Auto-dismiss after 5 seconds ──────────────
        this.scene.time.delayedCall(5000, dismissNotification)
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

        const panelW = Math.min(900, W - 40)
        const panelH = Math.min(650, H - 60)

        this.invOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200).setInteractive()
            .on('pointerdown', () => this.hideInventory())

        this.invPanel = this.scene.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a1a)
            .setStrokeStyle(3, 0x00ff88)
            .setScrollFactor(0).setDepth(201).setInteractive()

        this.invTitle = this.scene.add.text(W / 2, H / 2 - (panelH / 2) + 30, '🎒 Inventory', {
            fontSize: '30px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        this.invClose = this.scene.add.text(W / 2 + (panelW / 2) - 30, H / 2 - (panelH / 2) + 30, '✖', {
            fontSize: '28px',
            fill: '#ff4444'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })

        this.invClose.on('pointerover', () => this.invClose.setFill('#ff0000'))
        this.invClose.on('pointerout', () => this.invClose.setFill('#ff4444'))
        this.invClose.on('pointerdown', () => this.hideInventory())

        this.invPanel.setAlpha(0)
        this.scene.tweens.add({ targets: this.invPanel, alpha: 1, duration: 150 })

        this.invSlots = []

        const maxSlotSize = 100
        const cols = Math.min(6, Math.floor((panelW - 40) / maxSlotSize))
        const slotSize = Math.min(maxSlotSize, (panelW - 40) / cols)
        const rows = 4
        const startX = W / 2 - (cols * slotSize) / 2 + slotSize / 2
        const startY = H / 2 - 170

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * slotSize
                const y = startY + row * slotSize
                const index = row * cols + col
                const item = GameState.inventory[index]

                const slot = this.scene.add.rectangle(x, y, slotSize - 8, slotSize - 8, 0x222222)
                    .setStrokeStyle(1, 0x444444)
                    .setScrollFactor(0).setDepth(202)

                let icon = null
                let qty = null

                if (item) {
                    slot.setInteractive({ useHandCursor: true })
                    icon = this.scene.add.text(x, y - 10, item.icon, {
                        fontSize: '30px'
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)
                    qty = this.scene.add.text(x + 35, y + 30, `x${item.quantity}`, {
                        fontSize: '14px',
                        fill: '#ffaa00'
                    }).setOrigin(1, 1).setScrollFactor(0).setDepth(203)

                    slot.on('pointerover', () => {
                        slot.setFillStyle(0x333333)
                        this.showInvTooltip(x, y, item)
                    })
                    slot.on('pointerout', () => {
                        slot.setFillStyle(0x222222)
                        this.hideInvTooltip()
                    })
                } else {
                    slot.setFillStyle(0x1a1a1a)
                    slot.setAlpha(0.3)
                }
                this.invSlots.push({ slot, icon, qty })
            }
        }

        if (GameState.inventory.length > cols * rows) {
            this.invOverflow = this.scene.add.text(W / 2, startY + rows * slotSize + 10,
                `+ ${GameState.inventory.length - cols * rows} more items...`, {
                fontSize: '14px', fill: '#ffaa00'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
        }

        const armorY = H / 2 + (panelH / 2) - 50
        this.invArmor = this.scene.add.text(W / 2, armorY,
            `🤖 Armor: ${GameState.armor.parts.length}/3 parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}`, {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        if (GameState.inventory.length === 0) {
            this.invEmpty = this.scene.add.text(W / 2, H / 2, 'No items yet!\nComplete tasks to earn items.', {
                fontSize: '22px',
                fill: '#555555',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
        }
    }

    showInvTooltip(x, y, item) {
        const tooltipW = 220, tooltipH = 80
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height
        let tx = x, ty = y - 70

        if (ty - tooltipH / 2 < 10) ty = y + 60
        if (ty + tooltipH / 2 > H - 10) ty = H - tooltipH / 2 - 10
        if (tx - tooltipW / 2 < 10) tx = tooltipW / 2 + 10
        if (tx + tooltipW / 2 > W - 10) tx = W - tooltipW / 2 - 10

        if (!this.invTooltipBg) {
            this.invTooltipBg = this.scene.add.rectangle(0, 0, tooltipW, tooltipH, 0x000000, 0.95)
                .setStrokeStyle(1, 0x00ff88).setScrollFactor(0).setDepth(210)
            this.invTooltipName = this.scene.add.text(0, 0, '', {
                fontSize: '16px', fill: '#00ff88', fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(211)
            this.invTooltipDesc = this.scene.add.text(0, 0, '', {
                fontSize: '13px', fill: '#aaaaaa', wordWrap: { width: 200 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(211)
        }

        this.invTooltipBg.setPosition(tx, ty).setAlpha(1)
        this.invTooltipName.setPosition(tx, ty - 20).setText(item.name).setAlpha(1)
        this.invTooltipDesc.setPosition(tx, ty + 10).setText(item.description).setAlpha(1)
    }

    hideInvTooltip() {
        if (this.invTooltipBg) { this.invTooltipBg.destroy(); this.invTooltipBg = null }
        if (this.invTooltipName) { this.invTooltipName.destroy(); this.invTooltipName = null }
        if (this.invTooltipDesc) { this.invTooltipDesc.destroy(); this.invTooltipDesc = null }
    }

    hideInventory() {
        this.invVisible = false
        if (this.invOverlay) this.invOverlay.destroy()
        if (this.invPanel) this.invPanel.destroy()
        if (this.invTitle) this.invTitle.destroy()
        if (this.invClose) this.invClose.destroy()
        if (this.invArmor) this.invArmor.destroy()
        if (this.invEmpty) this.invEmpty.destroy()
        if (this.invOverflow) this.invOverflow.destroy()
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

        const panelW = Math.min(700, W - 40)
        const contentHeight = tasks.length * 38 + 200
        const panelH = Math.min(contentHeight, H - 60)

        this.taskOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
            .setDepth(60).setScrollFactor(0).setInteractive()
            .on('pointerdown', () => this.hideTaskPanel())

        this.taskPanel = this.scene.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a1a)
            .setStrokeStyle(2, 0xffaa00)
            .setDepth(61).setScrollFactor(0).setInteractive()

        this.taskTitle = this.scene.add.text(W / 2, H / 2 - (panelH / 2) + 30, '📋 Current Tasks', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskPanel.setAlpha(0)
        this.scene.tweens.add({ targets: this.taskPanel, alpha: 1, duration: 150 })

        this.taskItems = []
        const itemSpacing = Math.min(38, (panelH - 180) / Math.max(1, tasks.length))

        tasks.forEach((task, i) => {
            const check = task.done ? '✅' : '⬜'
            const color = task.done ? '#00ff88' : '#ffffff'
            const textX = W / 2 - (panelW / 2) + 30
            const text = this.scene.add.text(
                textX,
                H / 2 - (panelH / 2) + 80 + (i * itemSpacing),
                `${check} ${task.text}`, {
                fontSize: '17px',
                fill: color,
                wordWrap: { width: panelW - 60 }
            }).setDepth(62).setScrollFactor(0)
            this.taskItems.push(text)
        })

        this.armorText = this.scene.add.text(W / 2, H / 2 + (panelH / 2) - 60, this.getArmorStatus(), {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskClose = this.scene.add.text(W / 2, H / 2 + (panelH / 2) - 30, '[ Close ]', {
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
            if (!GameState.getFlag('electricalUnlocked')) {
                return [
                    { text: 'Gain 5 repair skill', done: GameState.skills.repair >= 5 },
                    { text: 'Unlock Electrical Bench', done: GameState.getFlag('electricalUnlocked') }
                ]
            }
            if (!GameState.getFlag('metTrader')) {
                return [
                    { text: 'Gain 10 repair skill', done: GameState.skills.repair >= 10 },
                    { text: 'Meet the Trader at Junkyard', done: GameState.getFlag('metTrader') }
                ]
            }
            return [
                { text: 'Buy the Armor Core from Trader', done: GameState.getFlag('boughtCore') }
            ]
        }

        if (GameState.level === 2) {
            if (!GameState.getFlag('metKing')) {
                return [{ text: 'Talk to the King at the Palace', done: GameState.getFlag('metKing') }]
            }
            if (!GameState.getFlag('metLuvaza')) {
                return [{ text: 'Meet Luvaza at Town Center', done: GameState.getFlag('metLuvaza') }]
            }
            if (!GameState.getFlag('rebuiltBuildings')) {
                return [{ text: 'Repair all town buildings', done: GameState.getFlag('rebuiltBuildings') }]
            }
            if (!GameState.getFlag('metParkCleaner')) {
                return [{ text: 'Meet Park Cleaner at the Park', done: GameState.getFlag('metParkCleaner') }]
            }
            if (GameState.skills.research < 30) {
                return [{ text: 'Research attack data (30 pts)', done: GameState.skills.research >= 30 }]
            }
            if (!GameState.getFlag('researchClueFound') ||
                !GameState.getFlag('luvazaClueFound') ||
                !GameState.getFlag('parkClueFound') ||
                !GameState.getFlag('traderClueFound')) {
                return [
                    { text: '🔍 Find research clue', done: GameState.getFlag('researchClueFound') },
                    { text: '🔍 Find Luvaza\'s clue', done: GameState.getFlag('luvazaClueFound') },
                    { text: '🔍 Find Park Cleaner\'s clue', done: GameState.getFlag('parkClueFound') },
                    { text: '🔍 Find Trader\'s clue', done: GameState.getFlag('traderClueFound') }
                ]
            }
            if (!GameState.getFlag('learnedTruth')) {
                return [{ text: '🎯 Discover the Truth', done: GameState.getFlag('learnedTruth') }]
            }
            return [{ text: '👑 Tell the King what you found', done: GameState.getFlag('toldKing') }]
        }

        if (GameState.level === 3) {
            if (!GameState.getFlag('coreInstalled')) {
                return [{ text: '⚡ Install the power core', done: GameState.getFlag('coreInstalled') }]
            }
            if (!GameState.getFlag('armorLimbsInstalled')) {
                return [{ text: '🦾 Assemble hands & legs', done: GameState.getFlag('armorLimbsInstalled') }]
            }
            if (!GameState.getFlag('armorHeadFixed')) {
                return [{ text: '🤖 Repair head unit', done: GameState.getFlag('armorHeadFixed') }]
            }
            if (!GameState.getFlag('armorRevealSeen')) {
                return [{ text: '🛡️ Wait for Trader to finish armor', done: GameState.getFlag('armorRevealSeen') }]
            }
            if (!GameState.getFlag('armorTested')) {
                return [{ text: '✅ Test the completed armor', done: GameState.getFlag('armorTested') }]
            }
            if ((GameState.flags.parkCleanerFriendship || 0) < 3) {
                return [{ text: `Build friendship with Park Cleaner (${GameState.flags.parkCleanerFriendship || 0}/3)`, done: false }]
            }
            if (!GameState.getFlag('reasonForAttackKnown')) {
                return [{ text: 'Learn the reason for the attack', done: GameState.getFlag('reasonForAttackKnown') }]
            }
            if (!GameState.getFlag('traderCalledArmor')) {
                return [{ text: '📡 Wait for Trader\'s call', done: GameState.getFlag('traderCalledArmor') }]
            }
            return [{ text: '💔 Something is about to happen...', done: GameState.getFlag('gfDead') }]
        }

        return [{ text: 'No tasks yet', done: false }]
    }

    getArmorStatus() {
        const coreInstalled = GameState.getFlag('coreInstalled')
        const limbsDone = GameState.getFlag('armorLimbsInstalled')
        const headDone = GameState.getFlag('armorHeadFixed')
        const traderDone = GameState.getFlag('armorRevealSeen')

        const doneParts = [coreInstalled, limbsDone, headDone, traderDone].filter(Boolean).length
        let status = `🤖 Armor: ${doneParts}/4 steps`

        if (traderDone) {
            status += '  |  ✅ COMPLETE'
        } else if (headDone) {
            status += '  |  🔧 Trader finishing...'
        } else if (limbsDone) {
            status += '  |  Next: Fix head unit'
        } else if (coreInstalled) {
            status += '  |  Next: Assemble limbs'
        } else {
            status += '  |  Next: Install core'
        }

        return status
    }

    destroy() {
        if (this.bar) this.bar.destroy()
        if (this.statsText) this.statsText.destroy()
        if (this.dayText) this.dayText.destroy()
        if (this.levelText) this.levelText.destroy()
        if (this.crisisBarBg) this.crisisBarBg.destroy()
        if (this.crisisBar) this.crisisBar.destroy()
        if (this.crisisLabel) this.crisisLabel.destroy()

        if (this.hubIcon) this.hubIcon.destroy()
        if (this.invIcon) this.invIcon.destroy()
        if (this.taskIcon) this.taskIcon.destroy()

        if (this.timeIcon) this.timeIcon.destroy()
        if (this.dayPillTab) this.dayPillTab.destroy()
        if (this.dayPillText) this.dayPillText.destroy()

        this.hideInventory()
        this.hideTaskPanel()

        if (this._escHandler) {
            this.scene.input.keyboard.off('keydown-ESC', this._escHandler)
            this._escHandler = null
        }
    }
}