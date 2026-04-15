export default class DialogBox {
    constructor(scene) {
        this.scene = scene
        this.isActive = false
        this.dialogQueue = []
        this.currentIndex = 0
        this.onComplete = null
    }

    show(lines, onComplete = null) {
        this.dialogQueue = lines
        this.currentIndex = 0
        this.isActive = true
        this.onComplete = onComplete
        this.createBox()
        this.showLine()
    }

    createBox() {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // Dialog box at bottom
        this.box = this.scene.add.rectangle(W / 2, H - 80, W - 100, 140, 0x000000, 0.85)
        this.box.setStrokeStyle(2, 0xffffff)
        this.box.setDepth(100)
        this.box.setScrollFactor(0)

        // Name label
        this.nameText = this.scene.add.text(80, H - 150, '', {
            fontSize: '20px',
            fill: '#00ff88',
            fontStyle: 'bold'
        })
        this.nameText.setDepth(101)
        this.nameText.setScrollFactor(0)

        // Dialog text
        this.dialogText = this.scene.add.text(80, H - 115, '', {
            fontSize: '22px',
            fill: '#ffffff',
            wordWrap: { width: W - 160 }
        })
        this.dialogText.setDepth(101)
        this.dialogText.setScrollFactor(0)

        // Continue hint
        this.hintText = this.scene.add.text(W - 150, H - 40, '[SPACE]', {
            fontSize: '16px',
            fill: '#888888'
        })
        this.hintText.setDepth(101)
        this.hintText.setScrollFactor(0)
    }

    showLine() {
        let line = this.dialogQueue[this.currentIndex]
        this.nameText.setText(line.name)
        this.dialogText.setText(line.text)
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

    close() {
        this.isActive = false
        this.box.destroy()
        this.nameText.destroy()
        this.dialogText.destroy()
        this.hintText.destroy()

        if (this.onComplete) {
            this.onComplete()
            this.onComplete = null
        }
    }
}