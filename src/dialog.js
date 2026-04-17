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

        // ─── Dialog Box ────────────────
        this.box = this.scene.add.rectangle(W / 2, H - 80, W - 100, 140, 0x000000, 0.85)
        this.box.setStrokeStyle(2, 0xffffff)
        this.box.setDepth(100)
        this.box.setScrollFactor(0)

        // ─── Name ──────────────────────
        this.nameText = this.scene.add.text(80, H - 150, '', {
            fontSize: '20px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setDepth(101).setScrollFactor(0)

        // ─── Dialog Text ───────────────
        this.dialogText = this.scene.add.text(80, H - 115, '', {
            fontSize: '22px',
            fill: '#ffffff',
            wordWrap: { width: W - 160 }
        }).setDepth(101).setScrollFactor(0)

        // ─── Buttons Container ─────────
        const btnY = H - 25
        const btnStyle = { fontSize: '14px', fill: '#888888' }

        // Back button
        this.backBtn = this.scene.add.text(80, btnY, '◀ Back', btnStyle)
            .setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.backBtn.on('pointerover', () => this.backBtn.setFill('#ffffff'))
        this.backBtn.on('pointerout', () => this.backBtn.setFill('#888888'))
        this.backBtn.on('pointerdown', () => this.prev())

        // Next button
        this.nextBtn = this.scene.add.text(W / 2, btnY, 'Next ▶', btnStyle)
            .setOrigin(0.5, 0).setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.nextBtn.on('pointerover', () => this.nextBtn.setFill('#ffffff'))
        this.nextBtn.on('pointerout', () => this.nextBtn.setFill('#888888'))
        this.nextBtn.on('pointerdown', () => this.next())

        // Skip button
        this.skipBtn = this.scene.add.text(W - 200, btnY, 'Skip ⏭', btnStyle)
            .setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.skipBtn.on('pointerover', () => this.skipBtn.setFill('#ff4444'))
        this.skipBtn.on('pointerout', () => this.skipBtn.setFill('#888888'))
        this.skipBtn.on('pointerdown', () => this.skip())

        // History button
        this.historyBtn = this.scene.add.text(W - 100, btnY, '📜 Log', btnStyle)
            .setDepth(102).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })

        this.historyBtn.on('pointerover', () => this.historyBtn.setFill('#ffaa00'))
        this.historyBtn.on('pointerout', () => this.historyBtn.setFill('#888888'))
        this.historyBtn.on('pointerdown', () => this.showHistory())

        // ─── Page counter ──────────────
        this.pageText = this.scene.add.text(W / 2, H - 150, '', {
            fontSize: '13px',
            fill: '#555555'
        }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0)

        // ─── Space hint ────────────────
        this.hintText = this.scene.add.text(W / 2, H - 45, '[SPACE]', {
            fontSize: '12px',
            fill: '#444444'
        }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0)
    }

    showLine() {
        let line = this.dialogQueue[this.currentIndex]
        this.nameText.setText(line.name)
        this.dialogText.setText(line.text)
        this.pageText.setText(`${this.currentIndex + 1} / ${this.dialogQueue.length}`)

        // Show/hide back button
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

        // Overlay
        this.histOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(200)

        // Panel
        this.histPanel = this.scene.add.rectangle(W / 2, H / 2, 700, 600, 0x111122)
            .setStrokeStyle(2, 0xffaa00)
            .setScrollFactor(0).setDepth(201)

        // Title
        this.histTitle = this.scene.add.text(W / 2, H / 2 - 270, '📜 Dialog History', {
            fontSize: '24px',
            fill: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        // ─── History entries ───────────
        this.histItems = []

        // Show last 12 entries
        const startIndex = Math.max(0, this.history.length - 12)
        const recentHistory = this.history.slice(startIndex)

        recentHistory.forEach((line, i) => {
            const nameColor = line.name === 'You' ? '#00ff88' :
                              line.name === 'Luvaza' ? '#ff69b4' :
                              line.name === 'King' ? '#ffdd00' :
                              line.name === 'Trader' ? '#ff8800' :
                              line.name === 'Park Cleaner' ? '#44ff44' :
                              '#aaaaaa'

            const nameText = this.scene.add.text(W / 2 - 310, H / 2 - 220 + (i * 38),
                `${line.name || '...'}:`, {
                fontSize: '14px',
                fill: nameColor,
                fontStyle: 'bold'
            }).setScrollFactor(0).setDepth(202)

            const lineText = this.scene.add.text(W / 2 - 200, H / 2 - 220 + (i * 38),
                line.text, {
                fontSize: '14px',
                fill: '#cccccc',
                wordWrap: { width: 480 }
            }).setScrollFactor(0).setDepth(202)

            this.histItems.push(nameText, lineText)
        })

        // Scroll hint
        if (this.history.length > 12) {
            const scrollHint = this.scene.add.text(W / 2, H / 2 + 250,
                `Showing last 12 of ${this.history.length} entries`, {
                fontSize: '13px',
                fill: '#555555'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            this.histItems.push(scrollHint)
        }

        // Close
        this.histClose = this.scene.add.text(W / 2, H / 2 + 280, '[ Close ]', {
            fontSize: '16px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })
        this.histClose.on('pointerdown', () => this.hideHistory())
    }

    hideHistory() {
        this.historyVisible = false
        if (this.histOverlay) this.histOverlay.destroy()
        if (this.histPanel) this.histPanel.destroy()
        if (this.histTitle) this.histTitle.destroy()
        if (this.histClose) this.histClose.destroy()
        if (this.histItems) {
            this.histItems.forEach(i => i.destroy())
            this.histItems = []
        }
    }

    close() {
        this.isActive = false

        if (this.box) this.box.destroy()
        if (this.nameText) this.nameText.destroy()
        if (this.dialogText) this.dialogText.destroy()
        if (this.hintText) this.hintText.destroy()
        if (this.backBtn) this.backBtn.destroy()
        if (this.nextBtn) this.nextBtn.destroy()
        if (this.skipBtn) this.skipBtn.destroy()
        if (this.historyBtn) this.historyBtn.destroy()
        if (this.pageText) this.pageText.destroy()

        this.box = null
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