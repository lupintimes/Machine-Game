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
        this.box = this.scene.add.rectangle(400, 520, 750, 120, 0x000000, 0.85)
        this.box.setStrokeStyle(2, 0xffffff)
        this.box.setDepth(100)

        this.nameText = this.scene.add.text(50, 475, '', {
            fontSize: '14px',
            fill: '#00ff88',
            fontStyle: 'bold'
        })
        this.nameText.setDepth(101)

        this.dialogText = this.scene.add.text(50, 500, '', {
            fontSize: '16px',
            fill: '#ffffff',
            wordWrap: { width: 700 }
        })
        this.dialogText.setDepth(101)

        this.hintText = this.scene.add.text(650, 555, '[SPACE]', {
            fontSize: '12px',
            fill: '#888888'
        })
        this.hintText.setDepth(101)
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