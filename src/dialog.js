export default class DialogBox {
    constructor(scene) {
        this.scene = scene
        this.isActive = false
        this.dialogQueue = []
        this.currentIndex = 0
        this.onComplete = null
        this.history = []
    }

    show(lines, onComplete = null) {
        this.dialogQueue = lines
        this.currentIndex = 0
        this.isActive = true
        this.onComplete = onComplete
        this.history = [...this.history, ...lines]
        this.createBox()
        this.showLine()
    }

    createBox() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ═══════════════════════════════════════════════
        // ─── MASTER CONTROLS ───────────────────────────
        // ═══════════════════════════════════════════════
        const OFFSET    = 50     // Move entire box up (0 = bottom)
        const BOX_WIDTH = 1920    // Total dialog width
        const BOX_HEIGHT = 200    // Total dialog height
        const FADE_WIDTH = 200    // Gradient fade on each side
        const OPACITY   = 0.85   // Center opacity
        const FONT_FAMILY = 'Courier, monospace'
        // ═══════════════════════════════════════════════

        const boxY = H - BOX_HEIGHT / 2 - OFFSET
        const boxX = W / 2

        // ─── Gradient Dialog Box ───────────────────────
        this.boxGraphics = this.scene.add.graphics()
            .setDepth(100).setScrollFactor(0)

        // ─── Left Fade (transparent → solid) ───────────
        this.boxGraphics.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            0, OPACITY, 0, OPACITY
        )
        this.boxGraphics.fillRect(
            boxX - BOX_WIDTH / 2,
            boxY - BOX_HEIGHT / 2,
            FADE_WIDTH,
            BOX_HEIGHT
        )

        // ─── Center Solid ──────────────────────────────
        this.boxGraphics.fillStyle(0x000000, OPACITY)
        this.boxGraphics.fillRect(
            boxX - BOX_WIDTH / 2 + FADE_WIDTH,
            boxY - BOX_HEIGHT / 2,
            BOX_WIDTH - FADE_WIDTH * 2,
            BOX_HEIGHT
        )

        // ─── Right Fade (solid → transparent) ──────────
        this.boxGraphics.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            OPACITY, 0, OPACITY, 0
        )
        this.boxGraphics.fillRect(
            boxX + BOX_WIDTH / 2 - FADE_WIDTH,
            boxY - BOX_HEIGHT / 2,
            FADE_WIDTH,
            BOX_HEIGHT
        )

        // ─── Top Decorative Line ───────────────────────
        this.topLine = this.scene.add.rectangle(
            boxX,
            boxY - BOX_HEIGHT / 2 + 1,
            BOX_WIDTH - FADE_WIDTH * 2 - 40,
            1,
            0xffffff, 0.1
        ).setDepth(101).setScrollFactor(0)

        // ─── Bottom Decorative Line ────────────────────
        this.bottomLine = this.scene.add.rectangle(
            boxX,
            boxY + BOX_HEIGHT / 2 - 1,
            BOX_WIDTH - FADE_WIDTH * 2 - 40,
            1,
            0xffffff, 0.1
        ).setDepth(101).setScrollFactor(0)

        // ─── Name Text ─────────────────────────────────
        this.nameText = this.scene.add.text(
            boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30,
            boxY - BOX_HEIGHT / 2 + 12, '', {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setDepth(102).setScrollFactor(0)

        // ─── Dialog Text ───────────────────────────────
        this.dialogText = this.scene.add.text(
            boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30,
            boxY - 15, '', {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            fill: '#ffffff',
            wordWrap: { width: BOX_WIDTH - FADE_WIDTH * 2 - 80 }
        }).setDepth(102).setScrollFactor(0)

        // ─── Page Counter ──────────────────────────────
        this.pageText = this.scene.add.text(
            boxX + BOX_WIDTH / 2 - FADE_WIDTH - 30,
            boxY - BOX_HEIGHT / 2 + 12, '', {
            fontFamily: FONT_FAMILY,
            fontSize: '13px',
            fill: '#555555'
        }).setOrigin(1, 0).setDepth(102).setScrollFactor(0)

        // ─── Buttons ───────────────────────────────────
        const btnY = boxY + BOX_HEIGHT / 2 - 22
        const btnStyle = {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            fill: '#888888'
        }
        const contentLeft = boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30
        const contentRight = boxX + BOX_WIDTH / 2 - FADE_WIDTH - 30

        // ─── Back Button ───────────────────────────────
        this.backBtn = this.scene.add.text(contentLeft, btnY, '◀ Back', btnStyle)
            .setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.backBtn.on('pointerover', () => this.backBtn.setFill('#ffffff'))
        this.backBtn.on('pointerout',  () => this.backBtn.setFill('#888888'))
        this.backBtn.on('pointerdown', () => this.prev())

        // ─── Next Button ───────────────────────────────
        this.nextBtn = this.scene.add.text(boxX, btnY, 'Next ▶', btnStyle)
            .setOrigin(0.5, 0).setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.nextBtn.on('pointerover', () => this.nextBtn.setFill('#ffffff'))
        this.nextBtn.on('pointerout',  () => this.nextBtn.setFill('#888888'))
        this.nextBtn.on('pointerdown', () => this.next())

        // ─── Skip Button ───────────────────────────────
        this.skipBtn = this.scene.add.text(contentRight - 80, btnY, 'Skip ⏭', btnStyle)
            .setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.skipBtn.on('pointerover', () => this.skipBtn.setFill('#ff4444'))
        this.skipBtn.on('pointerout',  () => this.skipBtn.setFill('#888888'))
        this.skipBtn.on('pointerdown', () => this.skip())

        // ─── History Button ────────────────────────────
        this.historyBtn = this.scene.add.text(contentRight, btnY-30, '📜 Log', btnStyle)
            .setOrigin(1, 0).setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.historyBtn.on('pointerover', () => this.historyBtn.setFill('#ffaa00'))
        this.historyBtn.on('pointerout',  () => this.historyBtn.setFill('#888888'))
        this.historyBtn.on('pointerdown', () => this.showHistory())

        // ─── Space Hint ────────────────────────────────
        this.hintText = this.scene.add.text(boxX, btnY, '[SPACE]', {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            fill: '#333333'
        }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0)

        // ─── Entrance Animation ────────────────────────
        const allElements = [
            this.boxGraphics, this.topLine, this.bottomLine,
            this.nameText, this.dialogText, this.pageText,
            this.backBtn, this.nextBtn, this.skipBtn,
            this.historyBtn, this.hintText
        ]
        allElements.forEach(el => el.setAlpha(0))

        this.scene.tweens.add({
            targets: allElements,
            alpha: 1,
            duration: 200,
            ease: 'Sine.easeOut'
        })
    }

    showLine() {
        const line = this.dialogQueue[this.currentIndex]

        // ─── Name color based on character ─────────────
        const nameColors = {
            'You':          '#00ff88',
            'Luvaza':       '#ff69b4',
            'King':         '#ffdd00',
            'Trader':       '#ff8800',
            'Park Cleaner': '#44ff44',
            'Luvaza (recording)': '#ff69b4'
        }
        const nameColor = nameColors[line.name] || '#aaaaaa'
        this.nameText.setFill(nameColor)
        this.nameText.setText(line.name || '')
        this.dialogText.setText(line.text)
        this.pageText.setText(`${this.currentIndex + 1} / ${this.dialogQueue.length}`)

        if (this.currentIndex === 0) {
            this.backBtn.setAlpha(0.3)
        } else {
            this.backBtn.setAlpha(1)
        }
    }

    next() {
        this.currentIndex++
        if (this.currentIndex >= this.dialogQueue.length) {
            this.close()
            return false
        }
        this.showLine()
        return true
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--
            this.showLine()
        }
    }

    skip() {
        this.close()
    }

    // ─── History Panel ─────────────────────────────────
    showHistory() {
        if (this.historyVisible) {
            this.hideHistory()
            return
        }

        this.historyVisible = true

        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── History Overlay ───────────────────────────
        this.histOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(200)
            .setInteractive()

        // ─── History Panel (gradient style) ────────────
        this.histGraphics = this.scene.add.graphics()
            .setDepth(201).setScrollFactor(0)

        const panelW = 1920
        const panelH = 1080
        const panelFade = 100

        // Left fade
        this.histGraphics.fillGradientStyle(
            0x111122, 0x111122, 0x111122, 0x111122,
            0, 0.95, 0, 0.95
        )
        this.histGraphics.fillRect(
            W / 2 - panelW / 2, H / 2 - panelH / 2,
            panelFade, panelH
        )

        // Center
        this.histGraphics.fillStyle(0x111122, 0.95)
        this.histGraphics.fillRect(
            W / 2 - panelW / 2 + panelFade, H / 2 - panelH / 2,
            panelW - panelFade * 2, panelH
        )

        // Right fade
        this.histGraphics.fillGradientStyle(
            0x111122, 0x111122, 0x111122, 0x111122,
            0.95, 0, 0.95, 0
        )
        this.histGraphics.fillRect(
            W / 2 + panelW / 2 - panelFade, H / 2 - panelH / 2,
            panelFade, panelH
        )

        // ─── Decorative lines ──────────────────────────
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

        // ─── Title ─────────────────────────────────────
        this.histTitle = this.scene.add.text(W / 2, H / 2 - 270, '📜 Dialog History', {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        // ─── History entries ───────────────────────────
        this.histItems = []

        const startIndex = Math.max(0, this.history.length - 12)
        const recentHistory = this.history.slice(startIndex)

        const nameColors = {
            'You':          '#00ff88',
            'Luvaza':       '#ff69b4',
            'King':         '#ffdd00',
            'Trader':       '#ff8800',
            'Park Cleaner': '#44ff44',
            'Luvaza (recording)': '#ff69b4'
        }

        recentHistory.forEach((line, i) => {
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
                line.text, {
                fontFamily: 'Courier, monospace',
                fontSize: '14px',
                fill: '#cccccc',
                wordWrap: { width: 480 }
            }).setScrollFactor(0).setDepth(202)

            this.histItems.push(nameText, lineText)
        })

        if (this.history.length > 12) {
            const scrollHint = this.scene.add.text(W / 2, H / 2 + 250,
                `Showing last 12 of ${this.history.length} entries`, {
                fontFamily: 'Courier, monospace',
                fontSize: '13px',
                fill: '#555555'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            this.histItems.push(scrollHint)
        }

        // ─── Close button ──────────────────────────────
        this.histClose = this.scene.add.text(W / 2, H / 2 + 280, '[ Close ]', {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })

        this.histClose.on('pointerover', () => this.histClose.setFill('#ffffff'))
        this.histClose.on('pointerout',  () => this.histClose.setFill('#888888'))
        this.histClose.on('pointerdown', () => this.hideHistory())

        // ─── Click overlay to close ────────────────────
        this.histOverlay.on('pointerdown', () => this.hideHistory())
    }

    hideHistory() {
        this.historyVisible = false
        if (this.histOverlay)    this.histOverlay.destroy()
        if (this.histGraphics)   this.histGraphics.destroy()
        if (this.histTopLine)    this.histTopLine.destroy()
        if (this.histBottomLine) this.histBottomLine.destroy()
        if (this.histTitle)      this.histTitle.destroy()
        if (this.histClose)      this.histClose.destroy()
        if (this.histItems) {
            this.histItems.forEach(i => i.destroy())
            this.histItems = []
        }
    }

    close() {
        this.isActive = false

        // ─── Exit animation ────────────────────────────
        const allElements = [
            this.boxGraphics, this.topLine, this.bottomLine,
            this.nameText, this.dialogText, this.pageText,
            this.backBtn, this.nextBtn, this.skipBtn,
            this.historyBtn, this.hintText
        ].filter(el => el !== null && el !== undefined)

        this.scene.tweens.add({
            targets: allElements,
            alpha: 0,
            duration: 150,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.destroyElements()
            }
        })
    }

    destroyElements() {
        if (this.boxGraphics) this.boxGraphics.destroy()
        if (this.topLine)     this.topLine.destroy()
        if (this.bottomLine)  this.bottomLine.destroy()
        if (this.nameText)    this.nameText.destroy()
        if (this.dialogText)  this.dialogText.destroy()
        if (this.hintText)    this.hintText.destroy()
        if (this.backBtn)     this.backBtn.destroy()
        if (this.nextBtn)     this.nextBtn.destroy()
        if (this.skipBtn)     this.skipBtn.destroy()
        if (this.historyBtn)  this.historyBtn.destroy()
        if (this.pageText)    this.pageText.destroy()

        this.boxGraphics = null
        this.topLine = null
        this.bottomLine = null
        this.nameText = null
        this.dialogText = null
        this.hintText = null
        this.backBtn = null
        this.nextBtn = null
        this.skipBtn = null
        this.historyBtn = null
        this.pageText = null

        this.hideHistory()

        if (this.onComplete) {
            this.onComplete()
            this.onComplete = null
        }
    }
}