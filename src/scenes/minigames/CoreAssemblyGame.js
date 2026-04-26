export default class CoreAssemblyGame extends Phaser.Scene {
    constructor() {
        super('CoreAssemblyGame')
    }

    preload() {
        this.load.image('core-bg', 'assets/images/minigame/core_bg.webp')
        this.load.image('core-ready-bg', 'assets/images/minigame/core_ready_bg.webp')

        this.load.image('core', 'assets/images/minigame/core.webp')
        this.load.image('core-ready', 'assets/images/minigame/core_ready.webp')

        this.load.image('blue', 'assets/images/minigame/blue.webp')
        this.load.image('blue-ready', 'assets/images/minigame/blue_ready.webp')

        this.load.image('red', 'assets/images/minigame/red.webp')
        this.load.image('red-ready', 'assets/images/minigame/red_ready.webp')

        this.load.image('yellow', 'assets/images/minigame/yellow.webp')
        this.load.image('yellow-ready', 'assets/images/minigame/yellow_ready.webp')

        this.load.image('green', 'assets/images/minigame/green.webp')
        this.load.image('green-ready', 'assets/images/minigame/green_ready.webp')
    }
    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Background ────────────────────────────────
        this.bg = this.add.image(0, 0, 'core-bg')
            .setOrigin(0, 0)
            .setDisplaySize(W, H)
            .setDepth(0)

        const sx = W / this.textures.get('core-bg').getSourceImage().width
        const sy = H / this.textures.get('core-bg').getSourceImage().height

        // ─── Positions from Photoshop ──────────────────
        const pos = {
            core: { x: 1497 * sx, y: 496 * sy },
            'yellow-ready': { x: 354 * sx, y: 323.5 * sy },
            'red-ready': { x: 768 * sx, y: 321.5 * sy },
            'green-ready': { x: 390 * sx, y: 690 * sy },
            'blue-ready': { x: 778 * sx, y: 757 * sy },
            yellow: { x: 1327 * sx, y: 286 * sy },
            red: { x: 1497 * sx, y: 286 * sy },
            green: { x: 1327 * sx, y: 498 * sy },
            blue: { x: 1667 * sx, y: 286 * sy }
        }

        // ─── Drop order: core → red → blue → green → yellow
        const dropOrder = ['core', 'red', 'blue', 'green', 'yellow']
        this.currentOrder = 0

        // ─── Drop targets (hidden until correct order) ─
        this.targets = [
            {
                key: 'core',
                img: this.add.image(547.5 * sx, 540 * sy, 'core-ready')
                    .setDepth(1).setVisible(false),
                x: 547.5 * sx,
                y: 540 * sy
            },
            {
                key: 'red',
                img: this.add.image(pos['red-ready'].x, pos['red-ready'].y, 'red-ready')
                    .setDepth(1).setVisible(false),
                x: pos['red-ready'].x,
                y: pos['red-ready'].y
            },
            {
                key: 'blue',
                img: this.add.image(pos['blue-ready'].x, pos['blue-ready'].y, 'blue-ready')
                    .setDepth(1).setVisible(false),
                x: pos['blue-ready'].x,
                y: pos['blue-ready'].y
            },
            {
                key: 'green',
                img: this.add.image(pos['green-ready'].x, pos['green-ready'].y, 'green-ready')
                    .setDepth(1).setVisible(false),
                x: pos['green-ready'].x,
                y: pos['green-ready'].y
            },
            {
                key: 'yellow',
                img: this.add.image(pos['yellow-ready'].x, pos['yellow-ready'].y, 'yellow-ready')
                    .setDepth(1).setVisible(false),
                x: pos['yellow-ready'].x,
                y: pos['yellow-ready'].y
            }
        ]

        // ─── Draggable pieces ──────────────────────────
        this.pieces = []

        const pieceData = [
            { key: 'core', x: pos.core.x, y: pos.core.y },
            { key: 'red', x: pos.red.x, y: pos.red.y },
            { key: 'blue', x: pos.blue.x, y: pos.blue.y },
            { key: 'green', x: pos.green.x, y: pos.green.y },
            { key: 'yellow', x: pos.yellow.x, y: pos.yellow.y }
        ]

        pieceData.forEach((data) => {
            const piece = this.add.image(data.x, data.y, data.key)
                .setDepth(3)
                .setInteractive({ draggable: true, useHandCursor: true })

            piece.pieceKey = data.key
            piece.startX = data.x
            piece.startY = data.y
            piece.placed = false

            this.pieces.push(piece)
        })

        // ─── Order indicator ───────────────────────────
        // ─── Order indicator ───────────────────────────
        this.orderText = this.add.text(W / 2, 30, 'Guess the correct order!', {
            fontSize: '22px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(20)

        // ─── Drag events ───────────────────────────────
        this.input.on('dragstart', (pointer, obj) => {
            if (obj.placed) return
            obj.setDepth(10)
        })

        this.input.on('drag', (pointer, obj, dragX, dragY) => {
            if (obj.placed) return
            obj.x = dragX
            obj.y = dragY
        })

        this.input.on('dragend', (pointer, obj) => {
            if (obj.placed) return

            const expectedKey = dropOrder[this.currentOrder]

            // Check if near ANY target
            let nearTarget = null
            this.targets.forEach(target => {
                const dist = Phaser.Math.Distance.Between(obj.x, obj.y, target.x, target.y)
                const snapDist = (target.key === 'green') ? 200 : 150
                if (dist < snapDist) {
                    nearTarget = target
                }
            })

            if (!nearTarget) {
                // Not near any target — snap back
                this.tweens.add({
                    targets: obj,
                    x: obj.startX,
                    y: obj.startY,
                    duration: 300,
                    ease: 'Back.out'
                })
                obj.setDepth(3)
                return
            }

            // Near a target — check if correct piece AND correct order
            if (obj.pieceKey === expectedKey && nearTarget.key === expectedKey) {
                // Correct!
                obj.x = nearTarget.x
                obj.y = nearTarget.y
                obj.placed = true
                obj.setDepth(2)
                obj.disableInteractive()

                nearTarget.img.setVisible(true)
                nearTarget.img.setAlpha(0)
                this.tweens.add({
                    targets: nearTarget.img,
                    alpha: 1,
                    duration: 400
                })

                obj.setVisible(false)
                this.cameras.main.flash(200, 0, 255, 0)

                this.currentOrder++

                if (this.currentOrder >= dropOrder.length) {
                    this.orderText.setText('✅ All pieces placed!')
                    this.orderText.setFill('#00ff88')
                    this.checkWin()
                }

            } else {
                // Wrong piece or wrong order — FULL RESET
                this.cameras.main.shake(200, 0.01)
                this.orderText.setFill('#ff4444')
                this.orderText.setText('❌ Wrong! Try again!')

                this.time.delayedCall(1000, () => {
                    this.orderText.setFill('#ffffff')
                    this.orderText.setText('Guess the correct order!')
                })

                // Reset ALL pieces back
                this.currentOrder = 0

                this.pieces.forEach(p => {
                    p.placed = false
                    p.setVisible(true)
                    p.setDepth(3)
                    p.setInteractive({ draggable: true, useHandCursor: true })

                    this.tweens.add({
                        targets: p,
                        x: p.startX,
                        y: p.startY,
                        duration: 400,
                        ease: 'Back.out'
                    })
                })

                // Hide all ready images again
                this.targets.forEach(t => {
                    t.img.setVisible(false)
                })
            }

        })

        // ─── Close Button ──────────────────────────────
        const closeBtn = this.add.text(W - 60, 40, '✖', {
            fontSize: '32px',
            fill: '#ff4444',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true })

        closeBtn.on('pointerover', () => closeBtn.setFill('#ff0000'))
        closeBtn.on('pointerout', () => closeBtn.setFill('#ff4444'))
        closeBtn.on('pointerdown', () => {
            this.scene.stop()
            this.scene.resume('SecretBaseScene')
        })
    }

    update() {
        // empty — drag logic handled by input events
    }

    checkWin() {
        const allPlaced = this.pieces.every(p => p.placed)
        if (!allPlaced) return

        // Set core installation flags
        GameState.setFlag('coreInstalled')
        GameState.armor.hasCore = true
        if (!GameState.armor.parts.includes('core')) {
            GameState.addArmorPart('core')
        }
        GameState.addSkill('repair', 10)
        GameState.addReputation(5)

        const W = this.cameras.main.width
        const H = this.cameras.main.height

        const successBg = this.add.image(0, 0, 'core-ready-bg')
            .setOrigin(0, 0)
            .setDisplaySize(W, H)
            .setDepth(50)
            .setAlpha(0)

        this.tweens.add({
            targets: successBg,
            alpha: 1,
            duration: 800
        })

        this.time.delayedCall(2500, () => {
            this.scene.stop('CoreAssemblyGame')
            this.scene.resume('SecretBaseScene')
        })
    }
}