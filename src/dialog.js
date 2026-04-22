export default class DialogBox {
    constructor(scene) {
        this.scene = scene
        this.isActive = false
        this.isClosed = false
        this.dialogQueue = []
        this.currentIndex = 0
        this.onComplete = null
        this.history = []
        this.historyVisible = false
        this.spaceKey = null

        // ─── Elements ──────────────────────────────────
        this.boxGraphics = null
        this.topLine = null
        this.bottomLine = null
        this.nameText = null
        this.dialogText = null
        this.pageText = null
        this.backBtn = null
        this.nextBtn = null
        this.skipBtn = null
        this.historyBtn = null
        this.hintText = null

        // ─── Portrait ──────────────────────────────────
        this.portrait = null
        this.lastPortraitKey = null

        // ─── Default portraits (no expression) ─────────
        this.defaultPortrait = {
            'King':               'dialog-king-neutral',
            'You':                'dialog-player-neutral',
            'Luvaza':             'dialog-luvaza',
            'Trader':             'dialog-trader',
            'Park Cleaner':       'dialog-parkcleaner',
            'Luvaza (recording)': 'dialog-luvaza'
        }

        // ─── Expression portraits ──────────────────────
        this.expressionMap = {
            'King': {
                'neutral':    'dialog-king-neutral',
                'serious':    'dialog-king-serious',
                'angry':      'dialog-king-angry',
                'surprised':  'dialog-king-surprised',
                'suspicious': 'dialog-king-suspicious'
            },
            'You': {
                'neutral':    'dialog-player-neutral',
                'serious':    'dialog-player-serious',
                'angry':      'dialog-player-angry',
                'surprised':  'dialog-player-surprised',
                'determined': 'dialog-player-determined',
                'sad':        'dialog-player-sad'
            }
        }

        // ─── Characters that appear on left side ───────
        this.leftSideCharacters = ['You']
    }

    // ═══════════════════════════════════════════════════
    // ─── PORTRAIT ──────────────────────────────────────
    // ═══════════════════════════════════════════════════

    showPortrait(name, expression) {
        // ─── Get the right image key ───────────────────
        let imageKey = null

        if (expression && this.expressionMap[name] && this.expressionMap[name][expression]) {
            imageKey = this.expressionMap[name][expression]
        } else if (this.defaultPortrait[name]) {
            imageKey = this.defaultPortrait[name]
        }

        if (!imageKey) return

        // ─── Same portrait, skip ───────────────────────
        if (this.lastPortraitKey === imageKey && this.portrait) return

        this.hidePortrait()
        this.lastPortraitKey = imageKey

        if (!this.scene.textures.exists(imageKey)) return

        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Player = LEFT, others = RIGHT ─────────────
        const isLeftSide = this.leftSideCharacters.includes(name)
        const posX = isLeftSide ? 371 : W - 371
        const posY = H - 403

        this.portrait = this.scene.add.image(posX, posY, imageKey)
            .setScale(0.75)
            .setDepth(99)
            .setScrollFactor(0)
            .setAlpha(0)

        // ─── Flip player to face right ─────────────────
        if (isLeftSide) {
            this.portrait.setFlipX(true)
        }

        this.scene.tweens.add({
            targets: this.portrait,
            alpha: 1,
            y: posY - 10,
            duration: 200,
            ease: 'Sine.easeOut'
        })
    }

    hidePortrait() {
        if (this.portrait) {
            this.portrait.destroy()
            this.portrait = null
        }
        this.lastPortraitKey = null
    }

    // ═══════════════════════════════════════════════════
    // ─── SHOW ──────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    show(lines, onComplete = null) {
        if (!lines || lines.length === 0) {
            if (onComplete) onComplete()
            return
        }

        this.dialogQueue = lines
        this.currentIndex = 0
        this.isActive = true
        this.isClosed = false
        this.onComplete = onComplete
        this.history = [...this.history, ...lines]
        this.createBox()
        this.showLine()

        this.spaceKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        )
        this.spaceKey.on('down', () => {
            if (this.isActive && !this.isClosed && !this.historyVisible) {
                this.next()
            }
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── CREATE BOX ────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createBox() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        const OFFSET = 50
        const BOX_WIDTH = 1920
        const BOX_HEIGHT = 200
        const FADE_WIDTH = 200
        const OPACITY = 0.85
        const FONT_FAMILY = "'Share Tech Mono', monospace"

        const boxY = H - BOX_HEIGHT / 2 - OFFSET
        const boxX = W / 2

        // ─── Graphics ──────────────────────────────────
        this.boxGraphics = this.scene.add.graphics()
            .setDepth(100).setScrollFactor(0)

        this.boxGraphics.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            0, OPACITY, 0, OPACITY
        )
        this.boxGraphics.fillRect(
            boxX - BOX_WIDTH / 2, boxY - BOX_HEIGHT / 2,
            FADE_WIDTH, BOX_HEIGHT
        )

        this.boxGraphics.fillStyle(0x000000, OPACITY)
        this.boxGraphics.fillRect(
            boxX - BOX_WIDTH / 2 + FADE_WIDTH, boxY - BOX_HEIGHT / 2,
            BOX_WIDTH - FADE_WIDTH * 2, BOX_HEIGHT
        )

        this.boxGraphics.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            OPACITY, 0, OPACITY, 0
        )
        this.boxGraphics.fillRect(
            boxX + BOX_WIDTH / 2 - FADE_WIDTH, boxY - BOX_HEIGHT / 2,
            FADE_WIDTH, BOX_HEIGHT
        )

        // ─── Lines ─────────────────────────────────────
        this.topLine = this.scene.add.rectangle(
            boxX, boxY - BOX_HEIGHT / 2 + 1,
            BOX_WIDTH - FADE_WIDTH * 2 - 40, 1,
            0xffffff, 0.1
        ).setDepth(101).setScrollFactor(0)

        this.bottomLine = this.scene.add.rectangle(
            boxX, boxY + BOX_HEIGHT / 2 - 1,
            BOX_WIDTH - FADE_WIDTH * 2 - 40, 1,
            0xffffff, 0.1
        ).setDepth(101).setScrollFactor(0)

        // ─── Name text ─────────────────────────────────
        this.nameText = this.scene.add.text(
            boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30,
            boxY - BOX_HEIGHT / 2 + 12, '', {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setDepth(102).setScrollFactor(0)

        // ─── Dialog text ───────────────────────────────
        this.dialogText = this.scene.add.text(
            boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30,
            boxY - 15, '', {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            fill: '#ffffff',
            wordWrap: { width: BOX_WIDTH - FADE_WIDTH * 2 - 80 }
        }).setDepth(102).setScrollFactor(0)

        // ─── Page counter ──────────────────────────────
        this.pageText = this.scene.add.text(
            boxX + BOX_WIDTH / 2 - FADE_WIDTH - 30,
            boxY - BOX_HEIGHT / 2 + 12, '', {
            fontFamily: FONT_FAMILY,
            fontSize: '13px',
            fill: '#555555'
        }).setOrigin(1, 0).setDepth(102).setScrollFactor(0)

        // ─── Buttons ───────────────────────────────────
        const btnY = boxY + BOX_HEIGHT / 2 - 22
        const btnStyle = { fontFamily: FONT_FAMILY, fontSize: '14px', fill: '#888888' }
        const contentLeft = boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30
        const contentRight = boxX + BOX_WIDTH / 2 - FADE_WIDTH - 30

        // Back
        this.backBtn = this.scene.add.text(contentLeft, btnY, '◀ Back', btnStyle)
            .setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
        this.backBtn.on('pointerover', () => { if (this.backBtn) this.backBtn.setFill('#ffffff') })
        this.backBtn.on('pointerout', () => { if (this.backBtn) this.backBtn.setFill('#888888') })
        this.backBtn.on('pointerdown', () => { if (!this.isClosed) this.prev() })

        // Next
        this.nextBtn = this.scene.add.text(boxX, btnY, 'Next ▶', btnStyle)
            .setOrigin(0.5, 0).setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
        this.nextBtn.on('pointerover', () => { if (this.nextBtn) this.nextBtn.setFill('#555555') })
        this.nextBtn.on('pointerout', () => { if (this.nextBtn) this.nextBtn.setFill('#888888') })
        this.nextBtn.on('pointerdown', () => { if (!this.isClosed) this.next() })

        // Skip
        this.skipBtn = this.scene.add.text(contentRight - 80, btnY, 'Skip ⏭', btnStyle)
            .setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
        this.skipBtn.on('pointerover', () => { if (this.skipBtn) this.skipBtn.setFill('#ff4444') })
        this.skipBtn.on('pointerout', () => { if (this.skipBtn) this.skipBtn.setFill('#888888') })
        this.skipBtn.on('pointerdown', () => { if (!this.isClosed) this.skip() })

        // History
        this.historyBtn = this.scene.add.text(contentRight, btnY - 30, '📜 Log', btnStyle)
            .setOrigin(1, 0).setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
        this.historyBtn.on('pointerover', () => { if (this.historyBtn) this.historyBtn.setFill('#ffaa00') })
        this.historyBtn.on('pointerout', () => { if (this.historyBtn) this.historyBtn.setFill('#888888') })
        this.historyBtn.on('pointerdown', () => { if (!this.isClosed) this.showHistory() })

        // Hint
        this.hintText = this.scene.add.text(boxX, btnY, '[SPACE]', {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            fill: '#333333'
        }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0)

        // ─── Entrance animation ────────────────────────
        this.getAllElements().forEach(el => el.setAlpha(0))

        this.scene.tweens.add({
            targets: this.getAllElements(),
            alpha: 1,
            duration: 200,
            ease: 'Sine.easeOut'
        })
    }

    getAllElements() {
        return [
            this.boxGraphics, this.topLine, this.bottomLine,
            this.nameText, this.dialogText, this.pageText,
            this.backBtn, this.nextBtn, this.skipBtn,
            this.historyBtn, this.hintText
        ].filter(el => el !== null && el !== undefined)
    }

    // ═══════════════════════════════════════════════════
    // ─── SHOW LINE ─────────────────────────────────────
    // ═══════════════════════════════════════════════════

    showLine() {
        if (this.isClosed) return
        if (!this.dialogText || !this.nameText || !this.pageText || !this.backBtn) return
        if (this.currentIndex < 0 || this.currentIndex >= this.dialogQueue.length) return

        const line = this.dialogQueue[this.currentIndex]
        if (!line) return

        const nameColors = {
            'You':                '#00ff88',
            'Luvaza':             '#ff69b4',
            'King':               '#ffdd00',
            'Trader':             '#ff8800',
            'Park Cleaner':       '#44ff44',
            'Luvaza (recording)': '#ff69b4'
        }

        const nameColor = nameColors[line.name] || '#aaaaaa'

        if (this.nameText) this.nameText.setFill(nameColor)
        if (this.nameText) this.nameText.setText(line.name || '')
        if (this.dialogText) this.dialogText.setText(line.text || '')
        if (this.pageText) this.pageText.setText(
            `${this.currentIndex + 1} / ${this.dialogQueue.length}`
        )

        if (this.currentIndex === this.dialogQueue.length - 1) {
            if (this.nextBtn) this.nextBtn.setText('Close ✓')
            if (this.nextBtn) this.nextBtn.setFill('#44ff88')
        } else {
            if (this.nextBtn) this.nextBtn.setText('Next ▶')
            if (this.nextBtn) this.nextBtn.setFill('#888888')
        }

        if (this.backBtn) this.backBtn.setAlpha(this.currentIndex === 0 ? 0.3 : 1)

        // ─── Show portrait with expression ─────────────
        this.showPortrait(line.name, line.expression)
    }

    // ═══════════════════════════════════════════════════
    // ─── NAVIGATION ────────────────────────────────────
    // ═══════════════════════════════════════════════════

    next() {
        if (this.isClosed) return false
        if (!this.isActive) return false

        this.currentIndex++

        if (this.currentIndex >= this.dialogQueue.length) {
            this.close()
            return false
        }

        this.showLine()
        return true
    }

    prev() {
        if (this.isClosed) return
        if (this.currentIndex > 0) {
            this.currentIndex--
            this.showLine()
        }
    }

    skip() {
        if (this.isClosed) return
        this.close()
    }

    // ═══════════════════════════════════════════════════
    // ─── HISTORY ───────────────────────────────────────
    // ═══════════════════════════════════════════════════

    showHistory() {
        if (this.historyVisible) {
            this.hideHistory()
            return
        }

        this.historyVisible = true

        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        this.histOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(200).setInteractive()

        this.histGraphics = this.scene.add.graphics()
            .setDepth(201).setScrollFactor(0)

        const panelW = 1920
        const panelH = 1080
        const panelFade = 100

        this.histGraphics.fillGradientStyle(
            0x111122, 0x111122, 0x111122, 0x111122,
            0, 0.95, 0, 0.95
        )
        this.histGraphics.fillRect(W / 2 - panelW / 2, H / 2 - panelH / 2, panelFade, panelH)

        this.histGraphics.fillStyle(0x111122, 0.95)
        this.histGraphics.fillRect(
            W / 2 - panelW / 2 + panelFade, H / 2 - panelH / 2,
            panelW - panelFade * 2, panelH
        )

        this.histGraphics.fillGradientStyle(
            0x111122, 0x111122, 0x111122, 0x111122,
            0.95, 0, 0.95, 0
        )
        this.histGraphics.fillRect(
            W / 2 + panelW / 2 - panelFade, H / 2 - panelH / 2,
            panelFade, panelH
        )

        this.histTopLine = this.scene.add.rectangle(
            W / 2, H / 2 - panelH / 2 + 1,
            panelW - panelFade * 2 - 40, 1,
            0xffaa00, 0.2
        ).setScrollFactor(0).setDepth(202)

        this.histBottomLine = this.scene.add.rectangle(
            W / 2, H / 2 + panelH / 2 - 1,
            panelW - panelFade * 2 - 40, 1,
            0xffaa00, 0.2
        ).setScrollFactor(0).setDepth(202)

        this.histTitle = this.scene.add.text(W / 2, H / 2 - 270, '📜 Dialog History', {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        this.histItems = []

        const startIndex = Math.max(0, this.history.length - 12)
        const recentHistory = this.history.slice(startIndex)

        const nameColors = {
            'You':                '#00ff88',
            'Luvaza':             '#ff69b4',
            'King':               '#ffdd00',
            'Trader':             '#ff8800',
            'Park Cleaner':       '#44ff44',
            'Luvaza (recording)': '#ff69b4'
        }

        recentHistory.forEach((line, i) => {
            if (!line) return
            const nameColor = nameColors[line.name] || '#aaaaaa'

            const nameText = this.scene.add.text(
                W / 2 - 310, H / 2 - 220 + (i * 38),
                `${line.name || '...'}:`, {
                fontFamily: 'Courier, monospace',
                fontSize: '14px',
                fill: nameColor,
                fontStyle: 'bold'
            }).setScrollFactor(0).setDepth(202)

            const lineText = this.scene.add.text(
                W / 2 - 200, H / 2 - 220 + (i * 38),
                line.text || '', {
                fontFamily: 'Courier, monospace',
                fontSize: '14px',
                fill: '#cccccc',
                wordWrap: { width: 480 }
            }).setScrollFactor(0).setDepth(202)

            this.histItems.push(nameText, lineText)
        })

        if (this.history.length > 12) {
            const scrollHint = this.scene.add.text(
                W / 2, H / 2 + 250,
                `Showing last 12 of ${this.history.length} entries`, {
                fontFamily: 'Courier, monospace',
                fontSize: '13px',
                fill: '#555555'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            this.histItems.push(scrollHint)
        }

        this.histClose = this.scene.add.text(W / 2, H / 2 + 280, '[ Close ]', {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })

        this.histClose.on('pointerover', () => {
            if (this.histClose) this.histClose.setFill('#ffffff')
        })
        this.histClose.on('pointerout', () => {
            if (this.histClose) this.histClose.setFill('#888888')
        })
        this.histClose.on('pointerdown', () => this.hideHistory())
        this.histOverlay.on('pointerdown', () => this.hideHistory())
    }

    hideHistory() {
        this.historyVisible = false
        if (this.histOverlay) { this.histOverlay.destroy(); this.histOverlay = null }
        if (this.histGraphics) { this.histGraphics.destroy(); this.histGraphics = null }
        if (this.histTopLine) { this.histTopLine.destroy(); this.histTopLine = null }
        if (this.histBottomLine) { this.histBottomLine.destroy(); this.histBottomLine = null }
        if (this.histTitle) { this.histTitle.destroy(); this.histTitle = null }
        if (this.histClose) { this.histClose.destroy(); this.histClose = null }
        if (this.histItems) {
            this.histItems.forEach(i => { if (i) i.destroy() })
            this.histItems = []
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── CLOSE ─────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    close() {
        if (this.isClosed) return

        this.isActive = false
        this.isClosed = true

        if (this.spaceKey) {
            this.spaceKey.removeAllListeners()
            this.spaceKey = null
        }

        if (this.historyVisible) {
            this.hideHistory()
        }

        this.hidePortrait()

        const elements = this.getAllElements()

        if (elements.length === 0) {
            this.fireOnComplete()
            return
        }

        this.scene.tweens.add({
            targets: elements,
            alpha: 0,
            duration: 150,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.destroyElements()
            }
        })
    }

    fireOnComplete() {
        if (this.onComplete) {
            const cb = this.onComplete
            this.onComplete = null
            cb()
        }
    }

    destroyElements() {
        const toDestroy = [
            'boxGraphics', 'topLine', 'bottomLine',
            'nameText', 'dialogText', 'hintText',
            'backBtn', 'nextBtn', 'skipBtn',
            'historyBtn', 'pageText'
        ]

        toDestroy.forEach(key => {
            if (this[key]) {
                this[key].destroy()
                this[key] = null
            }
        })

        this.hidePortrait()
        this.fireOnComplete()
    }
}