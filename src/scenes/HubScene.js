import UI from '../ui.js'

export default class HubScene extends Phaser.Scene {
    constructor() {
        super('HubScene')
    }

    preload() {
        this.load.image('hub-bg', 'assets/images/hub-bg.png')

        this.load.image('loc-workshop', 'assets/images/locations/workshop.png')
        this.load.image('loc-junkyard', 'assets/images/locations/junkyard.png')
        this.load.image('loc-palace', 'assets/images/locations/palace.png')
        this.load.image('loc-towncenter', 'assets/images/locations/towncenter.png')
        this.load.image('loc-park', 'assets/images/locations/park.png')
        this.load.image('loc-enemy', 'assets/images/locations/enemy.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.ui = new UI(this)
        this.ui.create()

        if (!GameState.getFlag('introSeen')) {
            this.scene.start('CutsceneScene', {
                key: 'gameIntro',
                returnScene: 'HubScene'
            })
            return
        }

        // Background
        this.bg = this.add.image(W / 2, H / 2, 'hub-bg')
        const scaleX = W / this.bg.width
        const scaleY = H / this.bg.height
        this.bg.setScale(Math.max(scaleX, scaleY))
        this.bg.setDepth(0)

        this.locations = []

        this.createLocation({
            x: 1510.00,
            y: 299.00,
            label: 'Workshop',
            imageKey: 'loc-workshop',
            targetScene: 'WorkshopScene',
            unlocked: true
        })

        this.createLocation({
            x: 1545,
            y: 733,
            label: 'Junkyard',
            imageKey: 'loc-junkyard',
            targetScene: 'JunkyardScene',
            unlocked: true
        })

        this.createLocation({
            x: 606.00,
            y: 274.00,
            label: "King's Palace",
            imageKey: 'loc-palace',
            targetScene: GameState.level >= 3 && GameState.getFlag('gfCalledComms')
                ? 'Level3PalaceScene'
                : 'PalaceScene',
            unlocked: GameState.level >= 2
        })

        this.createLocation({
            x: 1034.00,
            y: 570.00,
            label: 'Town Center',
            imageKey: 'loc-towncenter',
            targetScene: 'TownCenterScene',
            unlocked: GameState.getFlag('metKing')
        })

        this.createLocation({
            x: 717.00,
            y: 815.00,
            label: 'Park',
            imageKey: 'loc-park',
            targetScene: 'ParkScene',
            unlocked: GameState.getFlag('metLuvaza')
        })

        this.createLocation({
            x: 255.50,
            y: 556,
            label: 'Enemy Territory',
            imageKey: 'loc-enemy',
            targetScene: 'EnemyScene',
            unlocked: GameState.flags.enemyTerritoryUnlocked
        })
    }

    createLocation(config) {
        const {
            x, y,
            label, imageKey,
            targetScene, unlocked
        } = config

        // The image
        const locImage = this.add.image(x, y, imageKey).setDepth(3)

        // Declare before if block
        let lockIcon = null
        let outlineShadows = null

        if (!unlocked) {
            locImage.setTint(0x0c0c0c)
            locImage.setAlpha(1)

            const offsets = [
                { x: -3, y: 0 },
                { x: 3, y: 0 },
                { x: 0, y: -3 },
                { x: 0, y: 3 },
                { x: -2, y: -2 },
                { x: 2, y: -2 },
                { x: -2, y: 2 },
                { x: 2, y: 2 }
            ]

            outlineShadows = []
            offsets.forEach(offset => {
                const shadow = this.add.image(x + offset.x, y + offset.y, imageKey)
                    .setTint(0x000000)
                    .setAlpha(0.8)
                    .setDepth(2)
                outlineShadows.push(shadow)
            })

            // ===== FIXED: Added padding to prevent cropping =====
            lockIcon = this.add.image(x, y, 'lock-icon')
                .setOrigin(0.5)
                .setDepth(6)
                .setScale(0.1)

            lockIcon.setInteractive({ useHandCursor: true })

            lockIcon.on('pointerdown', () => {
                this.tweens.add({
                    targets: lockIcon,
                    angle: { from: -15, to: 15 },
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        lockIcon.setAngle(0)
                    }
                })
            })
        } else {
            // Unlocked: full color
            locImage.clearTint()
            locImage.setAlpha(1)

            // Make image interactive
            locImage.setInteractive({
                useHandCursor: true,
                pixelPerfect: true,
                alphaTolerance: 50
            })

            // Hover - scale up + tooltip
            locImage.on('pointerover', () => {
                this.tweens.add({
                    targets: locImage,
                    scale: 1.1,
                    duration: 200,
                    ease: 'Back.easeOut'
                })
                this.showTooltip(x, y - (locImage.displayHeight / 2) - 20, label)
            })

            // Hover out - scale back
            locImage.on('pointerout', () => {
                this.tweens.add({
                    targets: locImage,
                    scale: 1,
                    duration: 200,
                    ease: 'Sine.easeOut'
                })
                this.hideTooltip()
            })

            // Click - travel
            locImage.on('pointerdown', () => {
                this.tweens.add({
                    targets: locImage,
                    scale: 0.95,
                    duration: 80,
                    yoyo: true,
                    onComplete: () => {
                        this.cameras.main.fade(500, 0, 0, 0)
                        this.time.delayedCall(500, () => {
                            this.scene.start(targetScene)
                        })
                    }
                })
            })
        }

        // Store
        const locationData = {
            locImage, lockIcon, outlineShadows,
            unlocked, label, targetScene, x, y
        }
        this.locations.push(locationData)

        return locationData
    }

    unlockLocation(locationLabel) {
        const loc = this.locations.find(l => l.label === locationLabel)
        if (!loc || loc.unlocked) return

        loc.unlocked = true

        // Animate tint removal
        let progress = { val: 0 }
        this.tweens.add({
            targets: progress,
            val: 1,
            duration: 800,
            onUpdate: () => {
                const c = Math.floor(progress.val * 255)
                loc.locImage.setTint(Phaser.Display.Color.GetColor(c, c, c))
                loc.locImage.setAlpha(0.975 + (progress.val * 0.025))
            },
            onComplete: () => {
                loc.locImage.clearTint()
                loc.locImage.setAlpha(1)
            }
        })

        // Remove outline shadows
        if (loc.outlineShadows) {
            loc.outlineShadows.forEach(shadow => {
                this.tweens.add({
                    targets: shadow,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        shadow.destroy()
                    }
                })
            })
            loc.outlineShadows = null
        }

        // Remove lock icon
        if (loc.lockIcon) {
            this.tweens.add({
                targets: loc.lockIcon,
                alpha: 0,
                scale: 3,
                angle: 360,
                duration: 500,
                ease: 'Back.easeIn',
                onComplete: () => {
                    loc.lockIcon.destroy()
                    loc.lockIcon = null
                }
            })
        }

        // Flash
        this.cameras.main.flash(300, 0, 255, 100)

        // Bounce
        this.tweens.add({
            targets: loc.locImage,
            scale: 1.2,
            duration: 300,
            yoyo: true,
            ease: 'Back.easeOut'
        })

        // Enable interactions
        loc.locImage.setInteractive({
            useHandCursor: true,
            pixelPerfect: true,
            alphaTolerance: 50
        })

        // Add hover/click events
        loc.locImage.on('pointerover', () => {
            this.tweens.add({
                targets: loc.locImage,
                scale: 1.1,
                duration: 200,
                ease: 'Back.easeOut'
            })
            this.showTooltip(loc.x, loc.y - (loc.locImage.displayHeight / 2) - 20, loc.label)
        })

        loc.locImage.on('pointerout', () => {
            this.tweens.add({
                targets: loc.locImage,
                scale: 1,
                duration: 200,
                ease: 'Sine.easeOut'
            })
            this.hideTooltip()
        })

        loc.locImage.on('pointerdown', () => {
            this.tweens.add({
                targets: loc.locImage,
                scale: 0.95,
                duration: 80,
                yoyo: true,
                onComplete: () => {
                    this.cameras.main.fade(500, 0, 0, 0)
                    this.time.delayedCall(500, () => {
                        this.scene.start(loc.targetScene)
                    })
                }
            })
        })
    }

    showTooltip(x, y, message) {
        this.hideTooltip()

        const tooltipContainer = this.add.container(x, y).setDepth(200)

        const text = this.add.text(0, 0, message, {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            fill: '#ffffff',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5)

        const bg = this.add.rectangle(0, 0,
            text.width + 24, text.height + 12,
            0x000000, 0.9
        ).setStrokeStyle(1, 0xffffff, 0.3)

        tooltipContainer.add(bg)
        tooltipContainer.add(text)

        tooltipContainer.setAlpha(0)
        tooltipContainer.setY(y + 10)

        this.tweens.add({
            targets: tooltipContainer,
            alpha: 1,
            y: y,
            duration: 150,
            ease: 'Sine.easeOut'
        })

        this.tooltip = tooltipContainer
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy()
            this.tooltip = null
        }
    }
}