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

        this.load.image('hub-overlay', 'assets/images/locations/border.png')
        this.load.image('legend', 'assets/images/locations/legend.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Background color + zoom ───────────────────
        this.cameras.main.setBackgroundColor('#e0d0ae')
        this.cameras.main.setZoom(0.98)
        this.cameras.main.centerOn(W / 2, H / 2 - 20)

        playDynamicMusic(this);
        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
            if (this.uiCam) {
                this.cameras.remove(this.uiCam)
                this.uiCam = null
            }
        })

        if (!GameState.getFlag('introSeen')) {
            this.scene.start('CutsceneScene', {
                key: 'gameIntro',
                returnScene: 'HubScene'
            })
            return
        }

        // ─── Background ────────────────────────────────
        this.bg = this.add.image(W / 2, H / 2, 'hub-bg')
        const scaleX = W / this.bg.width
        const scaleY = H / this.bg.height
        this.bg.setScale(Math.max(scaleX, scaleY))
        this.bg.setDepth(0)

        this.cameras.main.fadeIn(300, 0, 0, 0)


        // ─── Locations ─────────────────────────────────
        this.locations = []

        this.createLocation({
            x: 1510.00,
            y: 299.00,
            label: 'WORKSHOP',
            imageKey: 'loc-workshop',
            targetScene: 'WorkshopScene',
            unlocked: true,
            tooltipW: 145,
            tooltipH: 30,
            tooltipFont: '24px'
        })

        this.createLocation({
            x: 1545,
            y: 733,
            label: 'JUNKYARD',
            imageKey: 'loc-junkyard',
            targetScene: 'JunkyardScene',
            unlocked: true,
            tooltipW: 145,
            tooltipH: 30,
            tooltipFont: '24px'
        })

        this.createLocation({
            x: 606.00,
            y: 274.00,
            label: "PALACE",
            imageKey: 'loc-palace',
            targetScene: GameState.level >= 3 && GameState.getFlag('gfCalledComms')
                ? 'Level3PalaceScene'
                : 'PalaceScene',
            unlocked: GameState.level >= 2,
            tooltipW: 175,
            tooltipH: 30,
            tooltipFont: '24px'
        })

        this.createLocation({
            x: 1034.00,
            y: 570.00,
            label: 'TOWN CENTER',
            imageKey: 'loc-towncenter',
            targetScene: 'TownCenterScene',
            unlocked: GameState.getFlag('metKing'),
            tooltipW: 200,
            tooltipH: 40,
            tooltipFont: '24px'
        })

        this.createLocation({
            x: 717.00,
            y: 815.00,
            label: 'PARK',
            imageKey: 'loc-park',
            targetScene: 'ParkScene',
            unlocked: GameState.getFlag('metLuvaza'),
            timeRestriction: 'evening',
            tooltipW: 145,
            tooltipH: 30,
            tooltipFont: '24px'
        })

        this.createLocation({
            x: 255.50,
            y: 556,
            label: 'Enemy Territory',
            imageKey: 'loc-enemy',
            targetScene: 'EnemyScene',
            unlocked: GameState.flags.enemyTerritoryUnlocked,
            tooltipW: 200,
            tooltipH: 30,
            tooltipFont: '14px'
        })

        this.legend = this.add.image(211, 911, 'legend')
            .setDepth(3)
            .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 50 })


        this.legend.on('pointerover', () => {
            this.tweens.add({
                targets: this.legend,
                scale: 1.1,
                duration: 200,
                ease: 'Back.easeOut'
            })
        })

        this.legend.on('pointerout', () => {
            this.tweens.add({
                targets: this.legend,
                scale: 1,
                duration: 200,
                ease: 'Sine.easeOut'
            })
        })

        // ─── Overlay above everything except UI ────────
        this.hubOverlay = this.add.image(W / 2, H / 2, 'hub-overlay')
        const overlayScaleX = W / this.hubOverlay.width
        const overlayScaleY = H / this.hubOverlay.height
        this.hubOverlay.setScale(Math.max(overlayScaleX, overlayScaleY))
        this.hubOverlay.setDepth(100)


        // ─── UI (created AFTER game content) ───────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── UI Camera (full size, no zoom) ────────────
        this.uiCam = this.cameras.add(0, 0, W, H)
        this.uiCam.setScroll(0, 0)

        // ─── Collect all UI elements ───────────────────
        const uiElements = [
            this.ui.bar,
            this.ui.statsText,
            this.ui.dayText,
            this.ui.levelText,
            this.ui.crisisBarBg,
            this.ui.crisisBar,
            this.ui.crisisLabel,
            this.ui.timeIcon,
            this.ui.dayPillTab,
            this.ui.dayPillText,
            this.ui.taskIcon,
            this.ui.invIcon,
            this.ui.hubIcon
        ].filter(el => el)

        // ─── Main camera ignores UI ────────────────────
        uiElements.forEach(el => {
            this.cameras.main.ignore(el)
        })

        // ─── UI camera ignores everything except UI ────
        this.children.list.forEach(child => {
            if (!uiElements.includes(child)) {
                this.uiCam.ignore(child)
            }
        })
    }

    createLocation(config) {
        const {
            x, y,
            label, imageKey,
            targetScene, unlocked,
            tooltipW, tooltipH, tooltipFont,
            timeRestriction
        } = config

        const locImage = this.add.image(x, y, imageKey).setDepth(3)

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
            locImage.clearTint()
            locImage.setAlpha(1)

            locImage.setInteractive({
                useHandCursor: true,
                pixelPerfect: true,
                alphaTolerance: 50
            })

            locImage.on('pointerover', () => {
                this.tweens.add({
                    targets: locImage,
                    scale: 1.1,
                    duration: 200,
                    ease: 'Back.easeOut'
                })
                this.showTooltip(
                    x,
                    y - (locImage.displayHeight / 2) - 20,
                    label,
                    tooltipW || 145,
                    tooltipH || 30,
                    tooltipFont || '14px'
                )
            })

            locImage.on('pointerout', () => {
                this.tweens.add({
                    targets: locImage,
                    scale: 1,
                    duration: 200,
                    ease: 'Sine.easeOut'
                })
                this.hideTooltip()
            })

            locImage.on('pointerdown', () => {
                // ─── Time restriction check ────────────
                if (timeRestriction && GameState.timeOfDay !== timeRestriction) {
                    this.hideTooltip()
                    this.showTooltip(
                        x,
                        y - (locImage.displayHeight / 2) - 20,
                        `🕐 Only in ${timeRestriction}`,
                        250,
                        35,
                        '24px'
                    )
                    this.time.delayedCall(2000, () => this.hideTooltip())
                    return
                }

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

        const locationData = {
            locImage, lockIcon, outlineShadows,
            unlocked, label, targetScene, x, y,
            tooltipW, tooltipH, tooltipFont,
            timeRestriction
        }
        this.locations.push(locationData)

        return locationData
    }

    unlockLocation(locationLabel) {
        const loc = this.locations.find(l => l.label === locationLabel)
        if (!loc || loc.unlocked) return

        loc.unlocked = true

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

        this.cameras.main.flash(300, 0, 255, 100)

        this.tweens.add({
            targets: loc.locImage,
            scale: 1.2,
            duration: 300,
            yoyo: true,
            ease: 'Back.easeOut'
        })

        loc.locImage.setInteractive({
            useHandCursor: true,
            pixelPerfect: true,
            alphaTolerance: 50
        })

        loc.locImage.on('pointerover', () => {
            this.tweens.add({
                targets: loc.locImage,
                scale: 1.1,
                duration: 200,
                ease: 'Back.easeOut'
            })
            this.showTooltip(
                loc.x,
                loc.y - (loc.locImage.displayHeight / 2) - 20,
                loc.label,
                loc.tooltipW || 145,
                loc.tooltipH || 30,
                loc.tooltipFont || '14px'
            )
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
            // ─── Time restriction check ────────────
            if (loc.timeRestriction && GameState.timeOfDay !== loc.timeRestriction) {
                this.hideTooltip()
                this.showTooltip(
                    loc.x,
                    loc.y - (loc.locImage.displayHeight / 2) - 20,
                    `🕐 Only in the ${loc.timeRestriction}`,
                    250,
                    35,
                    '14px'
                )
                this.time.delayedCall(2000, () => this.hideTooltip())
                return
            }

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

    showTooltip(x, y, message, boxW = 145, boxH = 30, fontSize = '14px') {
        this.hideTooltip()

        const tooltipContainer = this.add.container(x, y).setDepth(200)

        const w = boxW
        const h = boxH

        // ─── Outer border (96705b) ─────────────────────
        const border1 = this.add.rectangle(0, 0, w + 8, h + 8, 0x96705b)

        // ─── Middle border (black) ─────────────────────
        const border2 = this.add.rectangle(0, 0, w + 4, h + 4, 0x000000)

        // ─── Inner border (96705b) ─────────────────────
        const border3 = this.add.rectangle(0, 0, w, h, 0x96705b)

        // ─── Fill (fae9cc) ─────────────────────────────
        const bg = this.add.rectangle(0, 0, w - 4, h - 4, 0xfae9cc)

        // ─── Text ──────────────────────────────────────
        const text = this.add.text(0, 0, message, {
            fontFamily: 'Courier, monospace',
            fontSize: fontSize,
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5)

        tooltipContainer.add([border1, border2, border3, bg, text])

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

        // ─── Hide from UI camera ───────────────────────
        if (this.uiCam) {
            this.uiCam.ignore(tooltipContainer)
        }
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy()
            this.tooltip = null
        }
    }
}