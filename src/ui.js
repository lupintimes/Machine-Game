export default class UI {
    constructor(scene) {
        this.scene = scene
        this.taskVisible = false
        this.taskItems = []
        this.invVisible = false
        this.invSlots = []
        this.sleepItems = []
        this.sleepVisible = false // FIX #10: Prevent double-opening sleep menu
    }

    create() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Top Bar Background ────────────────────────
        this.bar = this.scene.add.rectangle(W / 2, 20, W, 40, 0x000000, 0.8)
            .setDepth(50).setScrollFactor(0)

        // ─── Stats Text (left side) ────────────────────
        // FIX #5: Condensed spacing to prevent overlap with center text
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
        // [FIX] Move levelText to left to make room for time pill
        this.levelText = this.scene.add.text(W - 220, 8, '', {
            fontSize: '18px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(51).setScrollFactor(0)

        // ─── Time Pill Indicator ───────────────────────
        this.timePillContainer = this.scene.add.container(W - 100, 20).setDepth(51).setScrollFactor(0);

        this.pillGraphics = this.scene.add.graphics();
        this.timePillContainer.add(this.pillGraphics);

        // Morning (0) - x: -80 to -40
        this.pillGraphics.fillStyle(0xdcdedc);
        this.pillGraphics.beginPath();
        this.pillGraphics.arc(-65, 0, 15, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(270), false);
        this.pillGraphics.lineTo(-40, -15);
        this.pillGraphics.lineTo(-40, 15);
        this.pillGraphics.closePath();
        this.pillGraphics.fillPath();
        
        this.pillGraphics.fillStyle(0xaaaaaa);
        this.pillGraphics.beginPath();
        this.pillGraphics.arc(-60, 15, 10, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0), false);
        this.pillGraphics.fillPath();

        // Afternoon (1) - x: -40 to 0
        this.pillGraphics.fillStyle(0x77ccff);
        this.pillGraphics.fillRect(-40, -15, 40, 30);
        this.pillGraphics.fillStyle(0xffaa00);
        this.pillGraphics.fillCircle(-20, 2, 8);
        this.pillGraphics.fillStyle(0xffffff);
        this.pillGraphics.fillCircle(-25, 8, 6);
        this.pillGraphics.fillCircle(-15, 8, 5);
        this.pillGraphics.fillCircle(-20, 10, 4);

        // Evening (2) - x: 0 to 40
        this.pillGraphics.fillStyle(0x555566);
        this.pillGraphics.fillRect(0, -15, 40, 30);
        this.pillGraphics.fillStyle(0xdddddd);
        this.pillGraphics.fillCircle(20, 0, 6);
        this.pillGraphics.fillStyle(0x555566); // match background to cut out crescent
        this.pillGraphics.fillCircle(23, -2, 5);

        // Night (3) - x: 40 to 80
        this.pillGraphics.fillStyle(0x1a1a24);
        this.pillGraphics.beginPath();
        this.pillGraphics.lineTo(40, -15);
        this.pillGraphics.lineTo(65, -15);
        this.pillGraphics.arc(65, 0, 15, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90), false);
        this.pillGraphics.lineTo(40, 15);
        this.pillGraphics.closePath();
        this.pillGraphics.fillPath();
        this.pillGraphics.fillStyle(0xffffff);
        this.pillGraphics.fillRect(48, -5, 2, 2);
        this.pillGraphics.fillRect(63, -8, 1, 1);
        this.pillGraphics.fillRect(52, 5, 2, 2);
        this.pillGraphics.fillRect(68, 2, 1, 1);

        // Dark dimmers overlay for unselected times
        this.timeDimmer = [];
        for (let i = 0; i < 4; i++) {
            let dim;
            if (i === 0) {
                dim = this.scene.add.graphics();
                dim.fillStyle(0x000000, 0.6);
                dim.beginPath();
                dim.arc(-65, 0, 15, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(270), false);
                dim.lineTo(-40, -15);
                dim.lineTo(-40, 15);
                dim.closePath();
                dim.fillPath();
            } else if (i === 3) {
                dim = this.scene.add.graphics();
                dim.fillStyle(0x000000, 0.6);
                dim.beginPath();
                dim.lineTo(40, -15);
                dim.lineTo(65, -15);
                dim.arc(65, 0, 15, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90), false);
                dim.lineTo(40, 15);
                dim.closePath();
                dim.fillPath();
            } else {
                dim = this.scene.add.rectangle(-40 + (i - 1) * 40 + 20, 0, 40, 30, 0x000000, 0.6);
            }
            this.timePillContainer.add(dim);
            this.timeDimmer.push(dim);
        }

        // Pill outline border
        const border = this.scene.add.graphics();
        border.lineStyle(2, 0xffffff, 1);
        border.strokeRoundedRect(-80, -15, 160, 30, 15);
        this.timePillContainer.add(border);

        // Day tab indicator underneath
        this.dayPillTab = this.scene.add.rectangle(-60, 25, 45, 20, 0x5a3a9a);
        this.dayPillText = this.scene.add.text(-60, 25, `Day ${GameState.day}`, { fontSize: '11px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        this.timePillContainer.add(this.dayPillTab);
        this.timePillContainer.add(this.dayPillText);

        // Sliding bottom highlight
        this.timeSlider = this.scene.add.graphics();
        this.timeSlider.fillStyle(0xffffff, 1);
        this.timeSlider.fillRect(-15, 11, 30, 4); 
        this.timeSlider.x = -60 + (GameState.timeIndex || 0) * 40;
        this.timePillContainer.add(this.timeSlider);

        // ─── Crisis Bar ────────────────────────────────
        this.crisisBarBg = this.scene.add.rectangle(W / 2, 50, W - 40, 16, 0x222222)
            .setDepth(50).setScrollFactor(0)

        this.crisisBar = this.scene.add.rectangle(20, 50, 0, 12, 0xff4444)
            .setOrigin(0, 0.5).setDepth(51).setScrollFactor(0)

        // FIX #8: Renamed from CRISIS to TIMELINE for better UX semantics
        this.crisisLabel = this.scene.add.text(W / 2, 50, '', {
            fontSize: '11px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(52).setScrollFactor(0)

        // ─── Bottom Buttons ─────────────────────────────
        // FIX #6: Dynamic button spacing to prevent overlap on narrow screens
        const btnY = H - 30
        const btnW = 130
        const btnCount = this.scene.scene.key !== 'HubScene' ? 4 : 3
        const gap = Math.max(10, (W - btnCount * btnW) / (btnCount + 1))
        const getBtnX = (index) => gap + btnW / 2 + index * (btnW + gap)

        let btnIndex = 0;

        // ─── Hub Button ────────────────────────────────
        if (this.scene.scene.key !== 'HubScene') {
            const hubX = getBtnX(btnIndex);
            // [FIX] Harmonized navigation button to cohesive base and hover
            this.hubBtn = this.scene.add.rectangle(hubX, btnY, btnW, 40, 0x1a1a2e)
                .setDepth(50).setScrollFactor(0)
                .setStrokeStyle(1, 0x00ff88)
                .setInteractive({ useHandCursor: true })

            this.scene.add.text(hubX, btnY, '🗺️ Hub', {
                fontSize: '16px',
                fill: '#ffffff'
            }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

            // [FIX] Unified hover style
            this.hubBtn.on('pointerover', () => this.hubBtn.setFillStyle(0x2a2a44))
            this.hubBtn.on('pointerout', () => this.hubBtn.setFillStyle(0x1a1a2e))
            this.hubBtn.on('pointerdown', () => {
                this.scene.cameras.main.fade(300, 0, 0, 0)
                this.scene.time.delayedCall(300, () => {
                    this.scene.scene.start('HubScene')
                })
            })
            btnIndex++;
        }

        // ─── Inventory Button ──────────────────────────
        const invX = getBtnX(btnIndex);
        // [FIX] Harmonized navigation button to cohesive base and hover
        this.invBtn = this.scene.add.rectangle(invX, btnY, btnW, 40, 0x1a1a2e)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0xffffff)
            .setInteractive({ useHandCursor: true })

        this.scene.add.text(invX, btnY, '🎒 Inventory', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        // [FIX] Unified hover style
        this.invBtn.on('pointerover', () => this.invBtn.setFillStyle(0x2a2a44))
        this.invBtn.on('pointerout', () => this.invBtn.setFillStyle(0x1a1a2e))
        this.invBtn.on('pointerdown', () => this.toggleInventory())
        btnIndex++;

        // ─── Sleep Button ──────────────────────────────
        const sleepX = getBtnX(btnIndex);
        // [FIX] Harmonized navigation button to cohesive base and hover
        this.sleepBtn = this.scene.add.rectangle(sleepX, btnY, btnW, 40, 0x1a1a2e)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0x4444aa)
            .setInteractive({ useHandCursor: true })

        this.scene.add.text(sleepX, btnY, '😴 Sleep', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        // [FIX] Unified hover style
        this.sleepBtn.on('pointerover', () => this.sleepBtn.setFillStyle(0x2a2a44))
        this.sleepBtn.on('pointerout', () => this.sleepBtn.setFillStyle(0x1a1a2e))
        this.sleepBtn.on('pointerdown', () => this.openSleepMenu())
        btnIndex++;

        // ─── Task Button ───────────────────────────────
        const taskX = getBtnX(btnIndex);
        // [FIX] Harmonized navigation button to cohesive base and hover
        this.taskBtn = this.scene.add.rectangle(taskX, btnY, btnW, 40, 0x1a1a2e)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0xffaa00)
            .setInteractive({ useHandCursor: true })

        this.scene.add.text(taskX, btnY, '📋 Tasks', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        // [FIX] Unified hover style
        this.taskBtn.on('pointerover', () => this.taskBtn.setFillStyle(0x2a2a44))
        this.taskBtn.on('pointerout', () => this.taskBtn.setFillStyle(0x1a1a2e))
        this.taskBtn.on('pointerdown', () => this.toggleTaskPanel())

        // FIX #18: Escape key binding to close panels
        this.scene.input.keyboard.on('keydown-ESC', () => {
            if (this.sleepVisible) {
                this.sleepItems.forEach(i => { if (i) i.destroy() })
                this.sleepItems = []
                this.sleepVisible = false
            } else if (this.invVisible) {
                this.hideInventory()
            } else if (this.taskVisible) {
                this.hideTaskPanel()
            }
        })

        this.updateStats()
    }

    // ─── Sleep Menu ────────────────────────────────────
    openSleepMenu() {
        // FIX #10: Prevent double-opening
        if (this.sleepVisible) return
        this.sleepVisible = true

        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // FIX #2: Responsive panel sizes
        const panelW = Math.min(500, W - 40)
        const panelH = Math.min(430, H - 60)

        this.sleepItems = []

        // FIX #1 & #7: Overlay is interactive and closes on click-outside
        this.sleepOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200).setInteractive()

        this.sleepPanel = this.scene.add.rectangle(W / 2, H / 2, panelW, panelH, 0x0a0a1a)
            .setStrokeStyle(3, 0x4444aa).setScrollFactor(0).setDepth(201).setInteractive() // Eats clicks so they don't close panel

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
            this.sleepVisible = false // FIX #10
        }

        // Clicking overlay background closes menu
        this.sleepOverlay.on('pointerdown', closeAll)

        // FIX #12: Fade-in animation
        this.sleepPanel.setAlpha(0)
        this.scene.tweens.add({ targets: this.sleepPanel, alpha: 1, duration: 150 })

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

        // FIX #13: Overlay blocks input during transition
        const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9)
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
        // FIX #5: Condensed spacing between stats icons
        this.statsText.setText(
            `⭐${GameState.reputation}  💰${GameState.money}  ⚗️${GameState.elixir}  🔧${GameState.skills.repair}  🔬${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)

        // [FIX] Update Day text and animate Time Indicator
        const daysLeft = GameState.getDaysLeft()
        this.dayText.setText(`⏳ ${daysLeft} days remaining`)
        this.dayText.setFill('#ffffff')

        // Animate visual pill indicators
        const tIndex = GameState.timeIndex || 0;
        const targetX = -60 + tIndex * 40;
        
        if (this.timeSlider) {
            this.scene.tweens.add({
                targets: this.timeSlider,
                x: targetX,
                duration: 400,
                ease: 'Back.easeOut'
            });
        }

        if (this.timeDimmer) {
            this.timeDimmer.forEach((dim, i) => {
                this.scene.tweens.add({
                    targets: dim,
                    alpha: i === tIndex ? 0 : 0.6,
                    duration: 400
                });
            });
        }
        
        if (this.dayPillText) {
            this.dayPillText.setText(`Day ${GameState.day}`);
        }

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

        // FIX #8: Label renamed from CRISIS to TIMELINE
        this.crisisLabel.setText(`TIMELINE: Day ${GameState.day} of ${GameState.maxDays}`)
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

        // FIX #2: Responsive panel sizing
        const panelW = Math.min(900, W - 40)
        const panelH = Math.min(650, H - 60)

        // FIX #1 & #7: Overlay interactive + closes on click outside
        this.invOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200).setInteractive()
            .on('pointerdown', () => this.hideInventory())

        this.invPanel = this.scene.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a2e)
            .setStrokeStyle(3, 0x00ff88)
            .setScrollFactor(0).setDepth(201).setInteractive() // Eats clicks

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

        // FIX #12: Panel fade-in
        this.invPanel.setAlpha(0)
        this.scene.tweens.add({ targets: this.invPanel, alpha: 1, duration: 150 })

        this.invSlots = []

        // FIX #14: Dynamic grid that scales with panel width
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

                const slot = this.scene.add.rectangle(x, y, slotSize - 8, slotSize - 8, 0x222233)
                    .setStrokeStyle(1, 0x444466)
                    .setScrollFactor(0).setDepth(202)

                let icon = null
                let qty = null

                if (item) {
                    // FIX #9: Only make filled slots interactive
                    slot.setInteractive({ useHandCursor: true })

                    icon = this.scene.add.text(x, y - 10, item.icon, {
                        fontSize: '30px'
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)

                    qty = this.scene.add.text(x + 35, y + 30, `x${item.quantity}`, {
                        fontSize: '14px',
                        fill: '#ffaa00'
                    }).setOrigin(1, 1).setScrollFactor(0).setDepth(203)

                    slot.on('pointerover', () => {
                        slot.setFillStyle(0x333355)
                        this.showInvTooltip(x, y, item)
                    })
                    slot.on('pointerout', () => {
                        slot.setFillStyle(0x222233)
                        this.hideInvTooltip()
                    })
                } else {
                    // FIX #9: Empty slots have no hover effect or interactivity
                    slot.setFillStyle(0x1a1a2e)
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
        this.hideInvTooltip() // Prevent duplicates

        // FIX #3 & // [FIX] Improved Tooltip Positioning and bounding box logic
        const tooltipW = 220, tooltipH = 80;
        const W = this.scene.cameras.main.width;
        const H = this.scene.cameras.main.height;
        let tx = x, ty = y - 70;

        if (ty - tooltipH / 2 < 10) ty = y + 60; // Flip below if too high
        if (ty + tooltipH / 2 > H - 10) ty = H - tooltipH / 2 - 10; // Prevent bottom cutoff
        if (tx - tooltipW / 2 < 10) tx = tooltipW / 2 + 10;
        if (tx + tooltipW / 2 > W - 10) tx = W - tooltipW / 2 - 10;

        this.invTooltipBg = this.scene.add.rectangle(tx, ty, tooltipW, tooltipH, 0x000000, 0.95)
            .setStrokeStyle(1, 0x00ff88)
            .setScrollFactor(0).setDepth(210)

        this.invTooltipName = this.scene.add.text(tx, ty - 20, item.name, {
            fontSize: '16px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(211)

        this.invTooltipDesc = this.scene.add.text(tx, ty + 10, item.description, {
            fontSize: '13px',
            fill: '#aaaaaa',
            wordWrap: { width: 200 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(211)
    }

    hideInvTooltip() {
        if (this.invTooltipBg) this.invTooltipBg.destroy()
        if (this.invTooltipName) this.invTooltipName.destroy()
        if (this.invTooltipDesc) this.invTooltipDesc.destroy()
        this.invTooltipBg = null
        this.invTooltipName = null
        this.invTooltipDesc = null
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

        // FIX #2 & #15: Responsive panel with dynamic height
        const panelW = Math.min(700, W - 40)
        const contentHeight = tasks.length * 38 + 200
        const panelH = Math.min(contentHeight, H - 60)

        // FIX #1 & #7: Overlay interactive + closes on click-out
        this.taskOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
            .setDepth(60).setScrollFactor(0).setInteractive()
            .on('pointerdown', () => this.hideTaskPanel())

        this.taskPanel = this.scene.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a2e)
            .setStrokeStyle(2, 0xffaa00)
            .setDepth(61).setScrollFactor(0).setInteractive() // Eats clicks

        this.taskTitle = this.scene.add.text(W / 2, H / 2 - (panelH / 2) + 30, `📋 Level ${GameState.level} Tasks`, {
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        // FIX #12: Fade-in
        this.taskPanel.setAlpha(0)
        this.scene.tweens.add({ targets: this.taskPanel, alpha: 1, duration: 150 })

        this.taskItems = []

        // FIX #15: Dynamic spacing for tasks
        const itemSpacing = Math.min(38, (panelH - 180) / Math.max(1, tasks.length))

        tasks.forEach((task, i) => {
            const check = task.done ? '✅' : '⬜'
            const color = task.done ? '#00ff88' : task.text.includes('───') ? '#555555' : '#ffffff'
            const text = this.scene.add.text(W / 2 - 300, H / 2 - (panelH / 2) + 80 + (i * itemSpacing), `${task.text.includes('───') ? task.text : check + ' ' + task.text}`, {
                fontSize: '17px',
                fill: color
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
                { text: `Friendship (${GameState.flags.parkCleanerFriendship || 0}/3)`, done: (GameState.flags.parkCleanerFriendship || 0) >= 3 },
                { text: 'Learn reason for attack', done: GameState.getFlag('reasonForAttackKnown') },
                { text: '─── The Tragedy ───', done: false },
                { text: '📡 Trader: Armor ready', done: GameState.getFlag('traderCalledArmor') },
                { text: '💔 That evening...', done: GameState.getFlag('gfDead') }
            ]
        }
        return [{ text: 'No tasks yet', done: false }]
    }

    getArmorStatus() {
        return `🤖 Armor: ${GameState.armor.parts.length}/3 parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}`
    }

    // FIX #4: Proper cleanup on scene transition
    destroy() {
        // Top bar
        if (this.bar) this.bar.destroy()
        if (this.statsText) this.statsText.destroy()
        if (this.dayText) this.dayText.destroy()
        if (this.levelText) this.levelText.destroy()
        if (this.crisisBarBg) this.crisisBarBg.destroy()
        if (this.crisisBar) this.crisisBar.destroy()
        if (this.crisisLabel) this.crisisLabel.destroy()

        // Buttons
        if (this.sleepBtn) this.sleepBtn.destroy()
        if (this.hubBtn) this.hubBtn.destroy()
        if (this.invBtn) this.invBtn.destroy()
        if (this.taskBtn) this.taskBtn.destroy()

        // Open panels
        this.hideInventory()
        this.hideTaskPanel()
        this.sleepItems.forEach(i => { if (i) i.destroy() })
        this.sleepItems = []

        // Remove ESC listener
        this.scene.input.keyboard.off('keydown-ESC')
    }
}