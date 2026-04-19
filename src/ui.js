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
        this.timeSegments = [] // Holds individual animated time containers
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
        this.levelText = this.scene.add.text(W - 220, 8, '', {
            fontSize: '18px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(51).setScrollFactor(0)

        // ─── Time Pill Indicator ───────────────────────
        this.timePillContainer = this.scene.add.container(W - 100, 20).setDepth(51).setScrollFactor(0);

        // [DYNAMIC] Background fill for the pill
        this.pillBg = this.scene.add.rectangle(0, 0, 160, 30, 0x000000, 0.4);
        this.timePillContainer.add(this.pillBg);

        // [DYNAMIC] Glowing Active Slider
        this.timeSlider = this.scene.add.graphics();
        this.timeSlider.fillStyle(0xffffff, 0.3);
        this.timeSlider.fillRoundedRect(-18, -16, 36, 32, 14);
        this.timeSlider.x = -60 + (GameState.timeIndex || 0) * 40;
        this.timePillContainer.add(this.timeSlider);

        // [DYNAMIC] Create Independent Segments for Animation
        this.timeSegments = [];

        // Morning (0) - Center at -60
        const mornGfx = this.scene.add.graphics();
        mornGfx.fillStyle(0xffe4b5);
        mornGfx.beginPath();
        mornGfx.arc(-5, 0, 15, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(270), false);
        mornGfx.lineTo(20, -15); mornGfx.lineTo(20, 15); mornGfx.closePath(); mornGfx.fillPath();
        mornGfx.fillStyle(0xff8c00); mornGfx.fillCircle(0, 12, 8);
        mornGfx.fillStyle(0xffd700, 0.4); mornGfx.fillCircle(0, 12, 12);
        mornGfx.fillStyle(0xaaaaaa);
        mornGfx.beginPath(); mornGfx.arc(0, 14, 8, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0), false); mornGfx.fillPath();
        const mornCont = this.scene.add.container(-60, 0); mornCont.add(mornGfx);
        this.timePillContainer.add(mornCont); this.timeSegments.push(mornCont);

        // Afternoon (1) - Center at -20
        const aftGfx = this.scene.add.graphics();
        aftGfx.fillStyle(0x77ccff); aftGfx.fillRect(-20, -15, 40, 30);
        aftGfx.fillStyle(0xffaa00); aftGfx.fillCircle(0, 2, 8);
        aftGfx.fillStyle(0xffffff); aftGfx.fillCircle(-5, 8, 6); aftGfx.fillCircle(5, 8, 5); aftGfx.fillCircle(0, 10, 4);
        const aftCont = this.scene.add.container(-20, 0); aftCont.add(aftGfx);
        this.timePillContainer.add(aftCont); this.timeSegments.push(aftCont);

        // Evening (2) - Center at 20
        const eveGfx = this.scene.add.graphics();
        eveGfx.fillStyle(0x555566); eveGfx.fillRect(-20, -15, 40, 30);
        eveGfx.fillStyle(0xdddddd); eveGfx.fillCircle(0, 0, 6);
        eveGfx.fillStyle(0x555566); eveGfx.fillCircle(3, -2, 5);
        const eveCont = this.scene.add.container(20, 0); eveCont.add(eveGfx);
        this.timePillContainer.add(eveCont); this.timeSegments.push(eveCont);

        // Night (3) - Center at 60
        const nightGfx = this.scene.add.graphics();
        nightGfx.fillStyle(0x1a1a24);
        nightGfx.beginPath(); nightGfx.lineTo(-20, -15); nightGfx.lineTo(5, -15);
        nightGfx.arc(5, 0, 15, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90), false);
        nightGfx.lineTo(-20, 15); nightGfx.closePath(); nightGfx.fillPath();
        nightGfx.fillStyle(0xffffff); nightGfx.fillRect(-12, -5, 2, 2); nightGfx.fillRect(3, -8, 1, 1);
        nightGfx.fillRect(-8, 5, 2, 2); nightGfx.fillRect(8, 2, 1, 1);
        const nightCont = this.scene.add.container(60, 0); nightCont.add(nightGfx);
        this.timePillContainer.add(nightCont); this.timeSegments.push(nightCont);

        // [DYNAMIC] Set initial scales and alphas immediately
        const initIdx = GameState.timeIndex || 0;
        this.timeSegments.forEach((seg, i) => {
            seg.setScale(i === initIdx ? 1.15 : 0.85);
            seg.setAlpha(i === initIdx ? 1 : 0.4);
        });

        // Add hit pads for interactivity
        const segments = [-60, -20, 20, 60]
        segments.forEach((sx, i) => {
            const hitPad = this.scene.add.rectangle(sx, 0, 40, 30, 0x000000, 0)
                .setInteractive({ useHandCursor: true })
            hitPad.on('pointerdown', () => this.changeTime(i))
            this.timePillContainer.add(hitPad)
        })

        // Pill outline border
        const border = this.scene.add.graphics();
        border.lineStyle(2, 0xffffff, 1);
        border.strokeRoundedRect(-80, -15, 160, 30, 15);
        this.timePillContainer.add(border);

        // [DYNAMIC] Day tab indicator underneath (Now includes specific time name)
        const timeNames = ['Morning', 'Afternoon', 'Evening', 'Night'];
        const initTimeName = timeNames[initIdx] || 'Morning';
        this.dayPillTab = this.scene.add.rectangle(-60, 25, 90, 20, 0x5a3a9a);
        this.dayPillText = this.scene.add.text(-60, 25, `Day ${GameState.day} - ${initTimeName}`, {
            fontSize: '11px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.timePillContainer.add(this.dayPillTab);
        this.timePillContainer.add(this.dayPillText);
        // Fit background to text width
        this.dayPillTab.setSize(this.dayPillText.width + 20, 20);

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

        // ─── Bottom Buttons ─────────────────────────────
        const btnY = H - 30
        const btnW = 130
        const btnCount = this.scene.scene.key !== 'HubScene' ? 3 : 2
        const gap = Math.max(10, (W - btnCount * btnW) / (btnCount + 1))
        const getBtnX = (index) => gap + btnW / 2 + index * (btnW + gap)

        let btnIndex = 0;

        // ─── Hub Button ────────────────────────────────
        if (this.scene.scene.key !== 'HubScene') {
            const hubX = getBtnX(btnIndex);
            this.hubBtn = this.scene.add.rectangle(hubX, btnY, btnW, 40, 0x1a1a2e)
                .setDepth(50).setScrollFactor(0)
                .setStrokeStyle(1, 0x00ff88)
                .setInteractive({ useHandCursor: true })

            this.hubBtnLabel = this.scene.add.text(hubX, btnY, '🗺️ Hub', {
                fontSize: '16px',
                fill: '#ffffff'
            }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

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
        this.invBtn = this.scene.add.rectangle(invX, btnY, btnW, 40, 0x1a1a2e)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0xffffff)
            .setInteractive({ useHandCursor: true })

        this.invBtnLabel = this.scene.add.text(invX, btnY, '🎒 Inventory', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        this.invBtn.on('pointerover', () => this.invBtn.setFillStyle(0x2a2a44))
        this.invBtn.on('pointerout', () => this.invBtn.setFillStyle(0x1a1a2e))
        this.invBtn.on('pointerdown', () => this.toggleInventory())
        btnIndex++;

        // ─── Task Button ───────────────────────────────
        const taskX = getBtnX(btnIndex);
        this.taskBtn = this.scene.add.rectangle(taskX, btnY, btnW, 40, 0x1a1a2e)
            .setDepth(50).setScrollFactor(0)
            .setStrokeStyle(1, 0xffaa00)
            .setInteractive({ useHandCursor: true })

        this.taskBtnLabel = this.scene.add.text(taskX, btnY, '📋 Tasks', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0)

        this.taskBtn.on('pointerover', () => this.taskBtn.setFillStyle(0x2a2a44))
        this.taskBtn.on('pointerout', () => this.taskBtn.setFillStyle(0x1a1a2e))
        this.taskBtn.on('pointerdown', () => this.toggleTaskPanel())

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

    // ─── Direct Time Change via UI Pill Indicator ──────
    changeTime(newIndex) {
        if (newIndex === GameState.timeIndex) return

        if (newIndex === 0) {
            // Advancing to the next morning
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
            // Cannot go backwards without sleeping to Morning
            return
        }

        this.updateStats()
        this.showTimeTransition()
    }

    // ─── Time Transition ───────────────────────────────
    showTimeTransition() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

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
        const W = this.scene.cameras.main.width
        const isNarrow = W < 500

        this.statsText.setText(isNarrow
            ? `⭐${GameState.reputation} 💰${GameState.money} ⚗️${GameState.elixir}`
            : `⭐${GameState.reputation}  💰${GameState.money}  ⚗️${GameState.elixir}  🔧${GameState.skills.repair}  🔬${GameState.skills.research}`
        )
        this.levelText.setText(`Lv.${GameState.level}`)

        const daysLeft = GameState.getDaysLeft()
        this.dayText.setText(`⏳ ${daysLeft} days remaining`)
        this.dayText.setFill('#ffffff')

        // [DYNAMIC] Animate Time Segments & Slider
        const tIndex = GameState.timeIndex || 0;
        const targetX = -60 + tIndex * 40;
        const timeNames = ['Morning', 'Afternoon', 'Evening', 'Night'];

        // Glowing slider animation
        if (this.timeSlider) {
            this.scene.tweens.add({
                targets: this.timeSlider,
                x: targetX,
                duration: 600,
                ease: 'Back.easeOut'
            });
        }

        // Segment bounce and dim animation
        if (this.timeSegments && this.timeSegments.length > 0) {
            this.timeSegments.forEach((seg, i) => {
                const isActive = i === tIndex;
                this.scene.tweens.add({
                    targets: seg,
                    scaleX: isActive ? 1.2 : 0.85,
                    scaleY: isActive ? 1.2 : 0.85,
                    alpha: isActive ? 1 : 0.4,
                    duration: 500,
                    ease: isActive ? 'Elastic.easeOut' : 'Quad.easeInOut'
                });
            });
        }

        // [DYNAMIC] Update pill tab text to explicitly state the time
        if (this.dayPillText && this.dayPillTab) {
            const newTimeName = timeNames[tIndex] || 'Time';
            this.dayPillText.setText(`Day ${GameState.day} - ${newTimeName}`);
            this.dayPillTab.setSize(this.dayPillText.width + 20, 20);

            // Bounce tab on update for extra visual feedback
            this.scene.tweens.add({
                targets: [this.dayPillTab, this.dayPillText],
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeInOut'
            });
        }

        const progress = Math.min(1, (GameState.day) / GameState.maxDays)
        const barWidth = Math.max(0, (W - 40) * progress)
        this.crisisBar.setSize(barWidth, 12)

        if (progress < 0.4) {
            this.crisisBar.setFillStyle(0x00ff88)
        } else if (progress < 0.7) {
            this.crisisBar.setFillStyle(0xffaa00)
        } else {
            this.crisisBar.setFillStyle(0xff4444)
        }

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

        const panelW = Math.min(900, W - 40)
        const panelH = Math.min(650, H - 60)

        this.invOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200).setInteractive()
            .on('pointerdown', () => this.hideInventory())

        this.invPanel = this.scene.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a2e)
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

                const slot = this.scene.add.rectangle(x, y, slotSize - 8, slotSize - 8, 0x222233)
                    .setStrokeStyle(1, 0x444466)
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
                        slot.setFillStyle(0x333355)
                        this.showInvTooltip(x, y, item)
                    })
                    slot.on('pointerout', () => {
                        slot.setFillStyle(0x222233)
                        this.hideInvTooltip()
                    })
                } else {
                    slot.setFillStyle(0x1a1a2e)
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
                fill: '#555566',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
        }
    }

    showInvTooltip(x, y, item) {
        const tooltipW = 220, tooltipH = 80;
        const W = this.scene.cameras.main.width;
        const H = this.scene.cameras.main.height;
        let tx = x, ty = y - 70;

        if (ty - tooltipH / 2 < 10) ty = y + 60;
        if (ty + tooltipH / 2 > H - 10) ty = H - tooltipH / 2 - 10;
        if (tx - tooltipW / 2 < 10) tx = tooltipW / 2 + 10;
        if (tx + tooltipW / 2 > W - 10) tx = W - tooltipW / 2 - 10;

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
        if (this.invTooltipBg) this.invTooltipBg.setAlpha(0)
        if (this.invTooltipName) this.invTooltipName.setAlpha(0)
        if (this.invTooltipDesc) this.invTooltipDesc.setAlpha(0)
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

        this.taskPanel = this.scene.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a1a2e)
            .setStrokeStyle(2, 0xffaa00)
            .setDepth(61).setScrollFactor(0).setInteractive()

        this.taskTitle = this.scene.add.text(W / 2, H / 2 - (panelH / 2) + 30, `📋 Level ${GameState.level} Tasks`, {
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(62).setScrollFactor(0)

        this.taskPanel.setAlpha(0)
        this.scene.tweens.add({ targets: this.taskPanel, alpha: 1, duration: 150 })

        this.taskItems = []
        const itemSpacing = Math.min(38, (panelH - 180) / Math.max(1, tasks.length))

        tasks.forEach((task, i) => {
            const check = task.done ? '✅' : '⬜'
            const color = task.done ? '#00ff88' : task.text.includes('───') ? '#555555' : '#ffffff'
            const textX = W / 2 - (panelW / 2) + 30
            const text = this.scene.add.text(textX, H / 2 - (panelH / 2) + 80 + (i * itemSpacing),
                `${task.text.includes('───') ? task.text : check + ' ' + task.text}`, {
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

    destroy() {
        if (this.bar) this.bar.destroy()
        if (this.statsText) this.statsText.destroy()
        if (this.dayText) this.dayText.destroy()
        if (this.levelText) this.levelText.destroy()
        if (this.crisisBarBg) this.crisisBarBg.destroy()
        if (this.crisisBar) this.crisisBar.destroy()
        if (this.crisisLabel) this.crisisLabel.destroy()

        if (this.hubBtn) this.hubBtn.destroy()
        if (this.invBtn) this.invBtn.destroy()
        if (this.taskBtn) this.taskBtn.destroy()

        this.hideInventory()
        this.hideTaskPanel()

        if (this._escHandler) {
            this.scene.input.keyboard.off('keydown-ESC', this._escHandler)
            this._escHandler = null
        }

        if (this.hubBtnLabel) this.hubBtnLabel.destroy()
        if (this.invBtnLabel) this.invBtnLabel.destroy()
        if (this.taskBtnLabel) this.taskBtnLabel.destroy()

        if (this.timePillContainer) {
            this.timePillContainer.destroy(true)
            this.timePillContainer = null
        }
        this.timeSegments = []
    }
}