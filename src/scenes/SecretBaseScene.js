import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class SecretBaseScene extends Phaser.Scene {
    constructor() {
        super('SecretBaseScene')
    }

    preload() {
        this.load.image('armor-nocore', 'assets/images/secretbase/armor_nocore.png')
        this.load.image('armor-core', 'assets/images/secretbase/armor_core.png')
        this.load.image('armor-nohead', 'assets/images/secretbase/armor_nohead.png')
        this.load.image('armor-head', 'assets/images/secretbase/armor_head.png')
        this.load.image('armor-ready', 'assets/images/secretbase/armor_ready.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Background based on armor progress ────────
        const bgKey = this.getArmorBackground()
        this.bg = this.add.image(W / 2, H / 2, bgKey)
            .setDisplaySize(W, H)
            .setDepth(-10)

        this.cameras.main.fadeIn(300, 0, 0, 0)

        // ─── UI ────────────────────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── State ─────────────────────────────────────
        this.menuActive = false
        this.menuItems = []
        this.testItems = []
        this.cutsceneItems = []
        this.minigameItems = []

        // ─── Shutdown cleanup ──────────────────────────
        this.events.on('shutdown', () => {
            if (this.ui) this.ui.destroy()
        })

        this.events.on('resume', () => {
            this.updateBackground()
            if (this.ui) this.ui.updateStats()
            this.time.delayedCall(100, () => {
                this.showBaseMenu()
            })
        })

        // ─── Delay then show intro ─────────────────────
        this.time.delayedCall(100, () => {
            if (!GameState.getFlag('secretBaseIntroSeen')) {
                this.dialog.show([
                    { name: 'Trader', text: 'Welcome to my secret workshop.' },
                    { name: 'Trader', text: 'I found this place years ago, deep underground.' },
                    { name: 'Trader', text: 'And this...' },
                    { name: 'Trader', text: 'This is what I wanted to show you.' },
                    { name: 'You', text: 'Is that... an armor frame?' },
                    { name: 'Trader', text: 'Not just any armor. This is ancient engineering.' },
                    { name: 'Trader', text: 'No one else could figure out how to power it.' },
                    { name: 'Trader', text: 'But you bought that core. You understand machines.' },
                    { name: 'You', text: 'You think I can make it work?' },
                    { name: 'Trader', text: 'I don\'t think. I know.' },
                    { name: 'Trader', text: 'Use the assembly bench when you\'re ready.' },
                    { name: '', text: 'Use the menu to install the core and build parts.' }
                ], () => {
                    GameState.setFlag('secretBaseIntroSeen')
                    this.showBaseMenu()
                })
            } else if (GameState.getFlag('traderCalledArmor') &&
                GameState.getFlag('traderFinishing') &&
                !GameState.getFlag('armorRevealSeen')) {
                this.showTraderFinishedDialog()
            } else {
                this.showBaseMenu()
            }
        })
    }

    update() {
        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── GET ARMOR BACKGROUND ──────────────────────────
    // ═══════════════════════════════════════════════════

    getArmorBackground() {
        if (GameState.getFlag('armorRevealSeen')) {
            return 'armor-ready'
        }
        if (GameState.getFlag('armorHeadFixed')) {
            return 'armor-head'
        }
        if (GameState.getFlag('armorLimbsInstalled')) {
            return 'armor-nohead'
        }
        if (GameState.getFlag('coreInstalled')) {
            return 'armor-core'
        }
        return 'armor-nocore'
    }

    // ═══════════════════════════════════════════════════
    // ─── Background Swap with Animation ────────────────
    // ═══════════════════════════════════════════════════

    updateBackground() {
        const newTexture = this.getArmorBackground()

        if (this.bg.texture.key !== newTexture) {
            this.tweens.add({
                targets: this.bg,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    this.bg.setTexture(newTexture)
                    this.tweens.add({
                        targets: this.bg,
                        alpha: 1,
                        duration: 600
                    })
                }
            })
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── CORE INSTALLATION MINI-GAME ───────────────────
    // ═══════════════════════════════════════════════════

    startCoreInstallation() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.minigameItems = []
        this.menuActive = true

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
            .setDepth(60)
        this.minigameItems.push(overlay)

        const title = this.add.text(W / 2, 60, '⚡ CORE INSTALLATION', {
            fontSize: '36px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(61)
        this.minigameItems.push(title)

        const subtitle = this.add.text(W / 2, 105, 'Drag the power core into the armor chest cavity', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setDepth(61)
        this.minigameItems.push(subtitle)

        const cavityX = W / 2
        const cavityY = H / 2 - 20

        const cavityOuter = this.add.rectangle(cavityX, cavityY, 160, 160, 0x111133)
            .setStrokeStyle(3, 0x334455)
            .setDepth(61)
        this.minigameItems.push(cavityOuter)

        const cavityLabel = this.add.text(cavityX, cavityY - 100, '▼ CHEST CAVITY ▼', {
            fontSize: '14px',
            fill: '#445566'
        }).setOrigin(0.5).setDepth(61)
        this.minigameItems.push(cavityLabel)

        const dropZone = this.add.rectangle(cavityX, cavityY, 120, 120, 0x003322, 0.3)
            .setStrokeStyle(2, 0x00ff88)
            .setDepth(62)
        this.minigameItems.push(dropZone)

        this.tweens.add({
            targets: dropZone,
            alpha: 0.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        })

        const coreStartX = W / 2 - 300
        const coreStartY = H / 2 + 200

        const coreBg = this.add.rectangle(coreStartX, coreStartY, 100, 100, 0x112244)
            .setStrokeStyle(2, 0x00aaff)
            .setDepth(63)
        this.minigameItems.push(coreBg)

        const coreGlow = this.add.circle(coreStartX, coreStartY, 35, 0x0088ff, 0.6)
            .setDepth(64)
        this.minigameItems.push(coreGlow)

        const coreInner = this.add.circle(coreStartX, coreStartY, 20, 0x00ccff, 0.9)
            .setDepth(65)
        this.minigameItems.push(coreInner)

        const coreLabel = this.add.text(coreStartX, coreStartY + 70, '⚡ POWER CORE', {
            fontSize: '14px',
            fill: '#00aaff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(63)
        this.minigameItems.push(coreLabel)

        this.tweens.add({
            targets: coreGlow,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        })

        const coreGroup = [coreBg, coreGlow, coreInner]
        coreBg.setInteractive({ useHandCursor: true, draggable: true })

        let dragOffsetX = 0
        let dragOffsetY = 0

        coreBg.on('dragstart', (pointer) => {
            dragOffsetX = coreBg.x - pointer.x
            dragOffsetY = coreBg.y - pointer.y
            coreLabel.setVisible(false)
        })

        coreBg.on('drag', (pointer) => {
            const newX = pointer.x + dragOffsetX
            const newY = pointer.y + dragOffsetY

            coreBg.setPosition(newX, newY)
            coreGlow.setPosition(newX, newY)
            coreInner.setPosition(newX, newY)

            const dist = Phaser.Math.Distance.Between(newX, newY, cavityX, cavityY)
            if (dist < 80) {
                dropZone.setStrokeStyle(3, 0x00ff88)
                dropZone.setFillStyle(0x004433, 0.5)
            } else {
                dropZone.setStrokeStyle(2, 0x00ff88)
                dropZone.setFillStyle(0x003322, 0.3)
            }
        })

        coreBg.on('dragend', () => {
            const dist = Phaser.Math.Distance.Between(coreBg.x, coreBg.y, cavityX, cavityY)

            if (dist < 80) {
                coreGroup.forEach(obj => obj.setPosition(cavityX, cavityY))
                coreBg.disableInteractive()
                dropZone.setVisible(false)

                const flash = this.add.rectangle(W / 2, H / 2, W, H, 0x00ff88, 0.3)
                    .setDepth(70)
                this.minigameItems.push(flash)

                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.time.delayedCall(500, () => {
                            this.startWiringPhase(cavityX, cavityY)
                        })
                    }
                })

                const placedText = this.add.text(W / 2, H - 100, '✅ Core placed! Now connect the wires...', {
                    fontSize: '20px',
                    fill: '#00ff88',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(65)
                this.minigameItems.push(placedText)

            } else {
                this.tweens.add({
                    targets: coreGroup,
                    x: coreStartX,
                    y: coreStartY,
                    duration: 300,
                    ease: 'Back.out'
                })
                coreLabel.setVisible(true)
            }
        })

        const hint = this.add.text(W / 2, H - 40, 'Click and drag the core to the chest cavity', {
            fontSize: '16px',
            fill: '#555555'
        }).setOrigin(0.5).setDepth(61)
        this.minigameItems.push(hint)
    }

    // ═══════════════════════════════════════════════════
    // ─── WIRE CONNECTION PHASE ─────────────────────────
    // ═══════════════════════════════════════════════════

    startWiringPhase(coreX, coreY) {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        const oldHints = this.minigameItems.filter(item =>
            item.type === 'Text' && item.y > H - 120
        )
        oldHints.forEach(h => h.destroy())

        const wireTitle = this.add.text(W / 2, 105, 'Connect wires in the correct order: RED → BLUE → GREEN → YELLOW', {
            fontSize: '16px',
            fill: '#ffaa00'
        }).setOrigin(0.5).setDepth(66)
        this.minigameItems.push(wireTitle)

        const wires = [
            { color: 0xff4444, name: 'RED', angle: -45, order: 0 },
            { color: 0x4488ff, name: 'BLUE', angle: 45, order: 1 },
            { color: 0x44ff44, name: 'GREEN', angle: 135, order: 2 },
            { color: 0xffff44, name: 'YELLOW', angle: 225, order: 3 }
        ]

        this.currentWireIndex = 0
        this.connectedWires = 0

        const shuffled = Phaser.Utils.Array.Shuffle([...wires])

        shuffled.forEach((wire, i) => {
            const radius = 140
            const rad = Phaser.Math.DegToRad(wire.angle)
            const wx = coreX + Math.cos(rad) * radius
            const wy = coreY + Math.sin(rad) * radius

            const disconnectedLine = this.add.line(
                0, 0,
                coreX + Math.cos(rad) * 60, coreY + Math.sin(rad) * 60,
                wx, wy,
                wire.color, 0.3
            ).setLineWidth(3).setDepth(63)
            this.minigameItems.push(disconnectedLine)

            const wireBtn = this.add.circle(wx, wy, 25, wire.color, 0.4)
                .setStrokeStyle(3, wire.color)
                .setDepth(67)
                .setInteractive({ useHandCursor: true })
            this.minigameItems.push(wireBtn)

            const wireLabel = this.add.text(wx, wy + 35, wire.name, {
                fontSize: '12px',
                fill: '#' + wire.color.toString(16).padStart(6, '0'),
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(67)
            this.minigameItems.push(wireLabel)

            const wireStatus = this.add.text(wx, wy - 35, '⬜', {
                fontSize: '16px'
            }).setOrigin(0.5).setDepth(67)
            this.minigameItems.push(wireStatus)

            this.tweens.add({
                targets: wireBtn,
                scaleX: 1.15,
                scaleY: 1.15,
                duration: 600,
                yoyo: true,
                repeat: -1,
                delay: i * 200
            })

            wireBtn.on('pointerover', () => wireBtn.setAlpha(0.8))
            wireBtn.on('pointerout', () => wireBtn.setAlpha(1))

            wireBtn.on('pointerdown', () => {
                if (wire.order === this.currentWireIndex) {
                    wireBtn.setFillStyle(wire.color, 1)
                    wireBtn.disableInteractive()
                    wireStatus.setText('✅')

                    const connectedLine = this.add.line(
                        0, 0,
                        coreX + Math.cos(rad) * 60, coreY + Math.sin(rad) * 60,
                        wx, wy,
                        wire.color, 1
                    ).setLineWidth(4).setDepth(64)
                    this.minigameItems.push(connectedLine)

                    disconnectedLine.setAlpha(0)

                    const wireFlash = this.add.circle(wx, wy, 40, wire.color, 0.5)
                        .setDepth(66)
                    this.minigameItems.push(wireFlash)
                    this.tweens.add({
                        targets: wireFlash,
                        alpha: 0,
                        scaleX: 2,
                        scaleY: 2,
                        duration: 400
                    })

                    this.currentWireIndex++
                    this.connectedWires++

                    if (this.progressText) this.progressText.destroy()
                    this.progressText = this.add.text(W / 2, H - 80,
                        `Wires connected: ${this.connectedWires}/4`, {
                        fontSize: '18px',
                        fill: '#00ff88'
                    }).setOrigin(0.5).setDepth(67)
                    this.minigameItems.push(this.progressText)

                    if (this.connectedWires >= 4) {
                        this.time.delayedCall(800, () => {
                            this.coreInstallationComplete()
                        })
                    }

                } else {
                    const expectedName = wires[this.currentWireIndex].name

                    wireBtn.setFillStyle(0xff0000, 0.8)
                    this.time.delayedCall(300, () => {
                        wireBtn.setFillStyle(wire.color, 0.4)
                    })

                    this.tweens.add({
                        targets: wireBtn,
                        x: wireBtn.x - 5,
                        duration: 50,
                        yoyo: true,
                        repeat: 3
                    })

                    if (this.errorText) this.errorText.destroy()
                    this.errorText = this.add.text(W / 2, H - 40,
                        `❌ Wrong! Connect ${expectedName} wire next.`, {
                        fontSize: '16px',
                        fill: '#ff4444'
                    }).setOrigin(0.5).setDepth(67)
                    this.minigameItems.push(this.errorText)

                    this.time.delayedCall(2000, () => {
                        if (this.errorText) this.errorText.setAlpha(0)
                    })
                }
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── CORE INSTALLATION COMPLETE ────────────────────
    // ═══════════════════════════════════════════════════

    coreInstallationComplete() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.minigameItems.forEach(item => item.destroy())
        this.minigameItems = []

        const bigFlash = this.add.rectangle(W / 2, H / 2, W, H, 0x00ff88, 0.6)
            .setDepth(70)

        this.tweens.add({
            targets: bigFlash,
            alpha: 0,
            duration: 1000,
            onComplete: () => bigFlash.destroy()
        })

        // ─── Set flags ─────────────────────────────────
        GameState.setFlag('coreInstalled')
        GameState.armor.hasCore = true
        if (!GameState.armor.parts.includes('core')) {
            GameState.addArmorPart('core')
        }
        this.ui.updateStats()

        // ─── Swap background to armor-core ─────────────
        this.time.delayedCall(500, () => {
            this.updateBackground()
        })

        this.time.delayedCall(1500, () => {
            this.showCoreSuccessCutscene()
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── CORE SUCCESS CUTSCENE ─────────────────────────
    // ═══════════════════════════════════════════════════

    showCoreSuccessCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cutsceneItems = []

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(100)
        this.cutsceneItems.push(overlay)

        const addText = (x, y, text, style, delay) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(101)
                .setAlpha(0)
            this.cutsceneItems.push(t)
            this.time.delayedCall(delay, () => {
                this.tweens.add({ targets: t, alpha: 1, duration: 800 })
            })
            return t
        }

        addText(W / 2, H / 2 - 160, '⚡ CORE INSTALLED', {
            fontSize: '44px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }, 300)

        addText(W / 2, H / 2 - 80, '🔴 RED ✅  🔵 BLUE ✅  🟢 GREEN ✅  🟡 YELLOW ✅', {
            fontSize: '20px',
            fill: '#ffffff'
        }, 1200)

        addText(W / 2, H / 2 - 20, 'All wires connected. Power flowing.', {
            fontSize: '22px',
            fill: '#aaaaaa'
        }, 2200)

        addText(W / 2, H / 2 + 40, 'The armor hums with energy...', {
            fontSize: '20px',
            fill: '#00aaff',
            fontStyle: 'italic'
        }, 3200)

        this.time.delayedCall(4500, () => {
            const cont = this.add.text(W / 2, H / 2 + 150, '[ Continue ]', {
                fontSize: '22px',
                fill: '#555555'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
                .setAlpha(0)
                .setInteractive({ useHandCursor: true })

            this.cutsceneItems.push(cont)
            this.tweens.add({ targets: cont, alpha: 1, duration: 600 })

            cont.on('pointerover', () => cont.setStyle({ fill: '#ffffff' }))
            cont.on('pointerout', () => cont.setStyle({ fill: '#555555' }))
            cont.on('pointerdown', () => {
                this.cutsceneItems.forEach(item => item.destroy())
                this.cutsceneItems = []
                this.showPostCoreDialog()
            })
        })
    }

    showPostCoreDialog() {
        this.dialog.show([
            { name: 'Trader', text: '...Did you feel that?' },
            { name: 'You', text: 'The whole room shook.' },
            { name: 'Trader', text: 'That\'s the core syncing with the frame.' },
            { name: 'Trader', text: 'No one has done that in centuries.' },
            { name: 'You', text: 'The wiring was tricky, but it clicked.' },
            { name: 'Trader', text: 'You\'re a natural, kid.' },
            { name: 'Trader', text: 'The core is powering the frame now.' },
            { name: 'Trader', text: 'But the armor still needs hands, legs, and a head.' },
            { name: 'You', text: 'What do I need?' },
            { name: 'Trader', text: 'Money and repair skill. Both.' },
            { name: 'Trader', text: 'Use the assembly bench when you\'re ready.' },
            { name: '', text: '⚡ Power core installed! Armor frame is now active.' },
            { name: '', text: 'You can now assemble hands & legs, and fix the head.' }
        ], () => {
            this.menuActive = false
            this.showBaseMenu()
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── TRADER FINISHED PLATING (Level 3) ─────────────
    // ═══════════════════════════════════════════════════

    showTraderFinishedDialog() {
        this.dialog.show([
            { name: 'Trader', text: 'You\'re back. Good timing.' },
            { name: 'Trader', text: 'I just finished the last weld.' },
            { name: '', text: '🔧 *Trader pulls off welding mask*' },
            { name: '', text: '🔧 *wipes sweat from forehead*' },
            { name: 'Trader', text: 'Come look at this.' },
            { name: '', text: '🛡️ *A heavy tarp is pulled away*' },
            { name: '', text: '🛡️ *The armor stands complete*' },
            { name: '', text: '🛡️ *Plating gleams under the workshop lights*' },
            { name: 'You', text: '...' },
            { name: 'You', text: 'It\'s... beautiful.' },
            { name: 'Trader', text: 'Every plate hand-welded.' },
            { name: 'Trader', text: 'Reinforced at every joint.' },
            { name: 'Trader', text: 'Lightweight but tougher than anything out there.' },
            { name: 'You', text: 'You did all this while I was gone?' },
            { name: 'Trader', text: 'Didn\'t sleep much.' },
            { name: 'Trader', text: 'But it was worth it.' },
            { name: 'You', text: 'I built the core, the hands, the legs, the head...' },
            { name: 'Trader', text: 'And I gave it its skin.' },
            { name: 'You', text: 'We make a good team.' },
            { name: 'Trader', text: 'Don\'t get sentimental on me, kid.' },
            { name: 'Trader', text: '...but yeah. We do.' },
            { name: '', text: '🤖 ARMOR COMPLETE!' },
            { name: '', text: 'The Trader finished the final plating.' }
        ], () => {
            GameState.setFlag('armorComplete')
            GameState.setFlag('armorRevealSeen')
            GameState.addArmorPart('plating')
            GameState.setFlag('armorPlatingInstalled')
            GameState.tryAdvanceLevel()
            this.ui.updateStats()
            this.updateBackground()

            this.time.delayedCall(800, () => {
                this.showArmorCompleteCutscene()
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── Dust Particles ────────────────────────────────
    // ═══════════════════════════════════════════════════
    createDustParticles(W, H) {
        this.dustParticles = []
        for (let i = 0; i < 30; i++) {
            const dust = this.add.circle(
                Phaser.Math.Between(0, W),
                Phaser.Math.Between(0, H),
                Phaser.Math.Between(1, 3),
                0xffffff,
                Phaser.Math.FloatBetween(0.05, 0.15)
            ).setDepth(15)

            this.tweens.add({
                targets: dust,
                y: dust.y - Phaser.Math.Between(50, 150),
                x: dust.x + Phaser.Math.Between(-30, 30),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 8000),
                repeat: -1,
                onRepeat: () => {
                    dust.setPosition(
                        Phaser.Math.Between(0, W),
                        Phaser.Math.Between(H / 2, H)
                    )
                    dust.setAlpha(Phaser.Math.FloatBetween(0.05, 0.15))
                }
            })

            this.dustParticles.push(dust)
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── Update Armor Status ───────────────────────────
    // ═══════════════════════════════════════════════════
    updateArmorStatus() {
        this.updateBackground()
    }

    // ═══════════════════════════════════════════════════
    // ─── Base Menu ─────────────────────────────────────
    // ═══════════════════════════════════════════════════
    showBaseMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.menuActive = true
        this.menuItems = []

        this.menuOverlay = this.add.rectangle(W / 2, H - 150, W - 200, 200, 0x000000, 0.7)
            .setStrokeStyle(2, 0xff8800).setDepth(50)

        this.menuTitle = this.add.text(W / 2, H - 230, 'What would you like to do?', {
            fontSize: '22px',
            fill: '#ff8800'
        }).setOrigin(0.5).setDepth(51)
        this.menuItems.push(this.menuTitle)

        // ─── Core not installed → show Core Assembly ───
        if (!GameState.getFlag('coreInstalled') && GameState.getFlag('boughtCore')) {
            this.createMenuButton(W / 2 - 400, H - 150, '⚡ Core Assembly', () => {
                this.closeBaseMenu()
                this.scene.pause('SecretBaseScene')
                this.scene.launch('CoreAssemblyGame')
            })
        }

        // ─── Core installed → show Assemble Parts ──────
        if (GameState.getFlag('coreInstalled')) {
            const canAssemble = this.getAvailableParts().length > 0
            this.createMenuButton(W / 2 - 400, H - 150, '🔧 Assemble Parts', () => {
                this.closeBaseMenu()
                this.showAssemblyMenu()
            }, !canAssemble)
        }

        // ─── Inspect Armor ─────────────────────────────
        this.createMenuButton(W / 2 - 100, H - 150, '🔍 Inspect Armor', () => {
            this.closeBaseMenu()
            this.inspectArmor()
        })

        // ─── Test Armor OR Talk to Trader ──────────────
        if (GameState.getFlag('armorComplete') &&
            !GameState.getFlag('armorTested')) {
            this.createMenuButton(W / 2 + 200, H - 150, '🤖 Test Armor', () => {
                this.closeBaseMenu()
                this.testArmor()
            })
        } else {
            this.createMenuButton(W / 2 + 200, H - 150, '💬 Talk to Trader', () => {
                this.closeBaseMenu()
                this.talkToTrader()
            })
        }

        // ─── Leave ─────────────────────────────────────
        this.createMenuButton(W / 2 + 500, H - 150, '🔙 Leave', () => {
            this.closeBaseMenu()
            this.leaveBase()
        })
    }

    createMenuButton(x, y, text, onClick, locked = false) {
        const btn = this.add.rectangle(x, y, 250, 60, locked ? 0x222233 : 0x333355)
            .setStrokeStyle(2, locked ? 0x444444 : 0xff8800)
            .setDepth(52)
            .setInteractive({ useHandCursor: !locked })

        const label = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: locked ? '#666666' : '#ffffff'
        }).setOrigin(0.5).setDepth(53)

        if (!locked) {
            btn.on('pointerover', () => btn.setFillStyle(0x444477))
            btn.on('pointerout', () => btn.setFillStyle(0x333355))
        }
        btn.on('pointerdown', () => {
            if (!locked) onClick()
        })

        this.menuItems.push(btn, label)
        return btn
    }

    closeBaseMenu() {
        this.menuActive = false
        if (this.menuOverlay) this.menuOverlay.destroy()
        if (this.menuTitle) this.menuTitle.destroy()
        this.menuItems.forEach(item => item.destroy())
        this.menuItems = []
    }

    // ═══════════════════════════════════════════════════
    // ─── Leave Base ────────────────────────────────────
    // ═══════════════════════════════════════════════════
    leaveBase() {
        if (GameState.getFlag('armorTested') &&
            GameState.getFlag('reasonForAttackKnown') &&
            GameState.getFlag('gaveCommsToGF') &&
            !GameState.getFlag('gfDead')) {

            this.dialog.show([
                { name: 'You', text: 'It\'s getting late.' },
                { name: 'You', text: 'I should head home and rest.' },
                { name: 'You', text: 'Tomorrow I\'ll figure out who really attacked the city.' }
            ], () => {
                this.cameras.main.fade(800, 0, 0, 0)
                this.time.delayedCall(800, () => {
                    this.scene.start('CutsceneScene', {
                        key: 'eveningCutscene',
                        returnScene: 'HubScene'
                    })
                })
            })

        } else {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('JunkyardScene')
            })
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── Assembly Menu ─────────────────────────────────
    // ═══════════════════════════════════════════════════
    getAvailableParts() {
        const available = []
        const coreInstalled = GameState.getFlag('coreInstalled')

        // ─── Hands & Legs ──────────────────────────────
        if (coreInstalled && !GameState.armor.parts.includes('limbs')) {
            available.push({
                id: 'limbs',
                name: 'Hands & Legs',
                icon: '🦾',
                description: 'Mechanical hands and leg actuators for full mobility.',
                cost: 300,
                repairNeeded: 15
            })
        }

        // ─── Head Unit ─────────────────────────────────
        if (GameState.armor.parts.includes('limbs') &&
            !GameState.armor.parts.includes('head')) {
            available.push({
                id: 'head',
                name: 'Head Unit',
                icon: '🤖',
                description: 'Repair and attach the damaged head module.',
                cost: 400,
                repairNeeded: 20
            })
        }

        return available
    }

    showAssemblyMenu() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height
        const available = this.getAvailableParts()

        this.menuActive = true
        this.menuItems = []

        this.menuOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setDepth(50)

        this.menuPanel = this.add.rectangle(W / 2, H / 2, 700, 500, 0x111122)
            .setStrokeStyle(3, 0x00ff88).setDepth(51)

        this.menuTitle = this.add.text(W / 2, H / 2 - 210, '🔧 Armor Assembly', {
            fontSize: '28px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(52)

        const infoText = this.add.text(W / 2, H / 2 - 160,
            `💰 Money: ${GameState.money}  |  🔧 Repair: ${GameState.skills.repair}`, {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(52)
        this.menuItems.push(this.menuPanel, this.menuTitle, infoText)

        if (available.length === 0) {
            let msg = ''
            if (GameState.getFlag('traderFinishing')) {
                msg = '🔧 Trader is working on the final plating. Come back in Level 3.'
            } else if (GameState.getFlag('playerPartsDone')) {
                msg = '✅ Your parts are done! Talk to the Trader.'
            } else if (!GameState.getFlag('coreInstalled')) {
                msg = '⚡ Install the power core first!'
            } else {
                msg = '🔒 No parts available yet.'
            }
            const emptyText = this.add.text(W / 2, H / 2, msg, {
                fontSize: '20px',
                fill: '#888888',
                wordWrap: { width: 600 },
                align: 'center'
            }).setOrigin(0.5).setDepth(52)
            this.menuItems.push(emptyText)
        }

        available.forEach((part, i) => {
            const y = H / 2 - 60 + (i * 120)
            const canBuild = GameState.money >= part.cost &&
                GameState.skills.repair >= part.repairNeeded

            const box = this.add.rectangle(W / 2, y, 600, 100,
                canBuild ? 0x222244 : 0x1a1a22)
                .setStrokeStyle(2, canBuild ? 0x00ff88 : 0x444444)
                .setDepth(52)
                .setInteractive({ useHandCursor: canBuild })

            const nameText = this.add.text(W / 2 - 260, y - 20, `${part.icon} ${part.name}`, {
                fontSize: '22px',
                fill: canBuild ? '#ffffff' : '#666666',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setDepth(53)

            const descText = this.add.text(W / 2 - 260, y + 15, part.description, {
                fontSize: '14px',
                fill: '#aaaaaa'
            }).setOrigin(0, 0.5).setDepth(53)

            const costText = this.add.text(W / 2 + 260, y - 15, `💰 ${part.cost}`, {
                fontSize: '16px',
                fill: canBuild ? '#ffaa00' : '#555555'
            }).setOrigin(1, 0.5).setDepth(53)

            const reqText = this.add.text(W / 2 + 260, y + 15, `🔧 ${part.repairNeeded} repair`, {
                fontSize: '14px',
                fill: GameState.skills.repair >= part.repairNeeded ? '#00ff88' : '#ff4444'
            }).setOrigin(1, 0.5).setDepth(53)

            if (canBuild) {
                box.on('pointerover', () => box.setFillStyle(0x333366))
                box.on('pointerout', () => box.setFillStyle(0x222244))
                box.on('pointerdown', () => { this.buildPart(part) })
            }

            this.menuItems.push(box, nameText, descText, costText, reqText)
        })

        const close = this.add.text(W / 2, H / 2 + 220, '[ Back ]', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(52)
            .setInteractive({ useHandCursor: true })
        close.on('pointerdown', () => {
            this.closeBaseMenu()
            this.showBaseMenu()
        })
        this.menuItems.push(close)
    }

    // ═══════════════════════════════════════════════════
    // ─── Build Part ────────────────────────────────────
    // ═══════════════════════════════════════════════════
    buildPart(part) {
        GameState.spendMoney(part.cost)
        GameState.addArmorPart(part.id)
        GameState.addItem({
            id: part.id,
            name: part.name,
            icon: part.icon,
            description: part.description,
            quantity: 1
        })

        if (part.id === 'limbs') GameState.setFlag('armorLimbsInstalled')
        if (part.id === 'head') GameState.setFlag('armorHeadFixed')

        this.closeBaseMenu()
        this.updateArmorStatus()
        this.ui.updateStats()

        if (part.id === 'limbs') {
            // ─── Hands & Legs installed ────────────────
            this.dialog.show([
                { name: 'You', text: 'Alright... hands first.' },
                { name: '', text: '⚙️ *attaching mechanical fingers*' },
                { name: '', text: '⚙️ *calibrating grip sensors*' },
                { name: 'You', text: 'Now the legs...' },
                { name: '', text: '⚙️ *leg actuators locking in*' },
                { name: '', text: '⚙️ *hydraulic lines connecting*' },
                { name: 'You', text: 'The hands flex perfectly. Legs feel solid.' },
                { name: 'Trader', text: 'Good hands, good legs. That\'s the foundation.' },
                { name: 'Trader', text: 'Now you need to fix the head unit.' },
                { name: 'Trader', text: 'It took some damage over the years.' },
                { name: 'You', text: 'I\'ll get it done.' }
            ], () => {
                this.showBaseMenu()
            })

        } else if (part.id === 'head') {
            // ─── Head fixed — all player parts done ────
            GameState.setFlag('playerPartsDone')
            this.ui.updateStats()

            this.dialog.show([
                { name: 'You', text: 'The head unit is cracked... let me see.' },
                { name: '', text: '🔧 *removing damaged visor*' },
                { name: '', text: '🔧 *rewiring optical sensors*' },
                { name: '', text: '🔧 *sealing the casing*' },
                { name: 'You', text: 'There. Visor is clear, sensors are live.' },
                { name: 'Trader', text: '...' },
                { name: 'Trader', text: 'Kid, you actually did it.' },
                { name: 'You', text: 'It\'s done? The armor is complete?' },
                { name: 'Trader', text: 'Almost.' },
                { name: 'Trader', text: 'You\'ve done the hard parts — core, limbs, head.' },
                { name: 'Trader', text: 'But there\'s still the final touch.' },
                { name: 'You', text: 'What final touch?' },
                { name: 'Trader', text: 'The armor plating. The outer shell.' },
                { name: 'Trader', text: 'It needs to be welded, sealed, and reinforced.' },
                { name: 'Trader', text: 'That\'s precision metalwork. My specialty.' },
                { name: 'You', text: 'You\'re going to finish it?' },
                { name: 'Trader', text: 'I\'ll take care of the final touch.' },
                { name: 'Trader', text: 'You built the brain and the body.' },
                { name: 'Trader', text: 'Let me give it its skin.' },
                { name: 'Trader', text: 'Come back later. I\'ll have it ready.' },
                { name: 'You', text: 'Thanks... I couldn\'t have done any of this without you.' },
                { name: 'Trader', text: 'You did the impossible part, kid.' },
                { name: 'Trader', text: 'I\'m just finishing what you started.' },
                { name: '', text: '🔧 The Trader will complete the armor plating.' },
                { name: '', text: 'Return in Level 3 to see the finished armor.' }
            ], () => {
                GameState.setFlag('traderFinishing')
                this.showBaseMenu()
            })
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── Armor Complete Cutscene ───────────────────────
    // ═══════════════════════════════════════════════════
    showArmorCompleteCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cutsceneItems = []

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.95)
            .setScrollFactor(0).setDepth(100)
        this.cutsceneItems.push(overlay)

        const addText = (x, y, text, style, delay) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(101)
                .setAlpha(0)
            this.cutsceneItems.push(t)
            this.time.delayedCall(delay, () => {
                this.tweens.add({ targets: t, alpha: 1, duration: 800 })
            })
            return t
        }

        addText(W / 2, H / 2 - 220, '🤖 ARMOR COMPLETE', {
            fontSize: '48px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }, 500)

        addText(W / 2, H / 2 - 140, '✅ Power Core   ✅ Hands & Legs   ✅ Head Unit', {
            fontSize: '20px',
            fill: '#ffffff'
        }, 1500)

        addText(W / 2, H / 2 - 100, '✅ Armor Plating — finished by the Trader', {
            fontSize: '18px',
            fill: '#ffaa00'
        }, 2200)

        addText(W / 2, H / 2 - 30, 'Built by you. Finished by a friend.', {
            fontSize: '24px',
            fill: '#aaaaaa'
        }, 3200)

        addText(W / 2, H / 2 + 20, 'No weapons. Just pure protection.', {
            fontSize: '22px',
            fill: '#888888',
            fontStyle: 'italic'
        }, 4200)

        addText(W / 2, H / 2 + 100,
            '"The strongest armor is built not for war,\nbut for those we love."', {
            fontSize: '20px',
            fill: '#ff8800',
            fontStyle: 'italic',
            align: 'center'
        }, 5500)

        this.time.delayedCall(7500, () => {
            const cont = this.add.text(W / 2, H / 2 + 220, '[ Click to continue ]', {
                fontSize: '22px',
                fill: '#555555'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
                .setAlpha(0)
                .setInteractive({ useHandCursor: true })

            this.cutsceneItems.push(cont)
            this.tweens.add({ targets: cont, alpha: 1, duration: 600 })

            cont.on('pointerover', () => cont.setStyle({ fill: '#ffffff' }))
            cont.on('pointerout', () => cont.setStyle({ fill: '#555555' }))
            cont.on('pointerdown', () => {
                this.cutsceneItems.forEach(item => item.destroy())
                this.cutsceneItems = []
                this.showBaseMenu()
            })
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── Armor Test ────────────────────────────────────
    // ═══════════════════════════════════════════════════
    testArmor() {
        this.dialog.show([
            { name: 'Trader', text: 'Alright kid. Step into the frame.' },
            { name: 'You', text: 'Here goes nothing...' },
            { name: '', text: '⚙️ *mechanical whirring*' },
            { name: '', text: '🦾 *hands clenching, fingers flexing*' },
            { name: '', text: '🦿 *legs locking, hydraulics engaging*' },
            { name: '', text: '🤖 *head visor powering on*' },
            { name: '', text: '🛡️ *plating sealing around body*' },
            { name: 'Trader', text: 'How does it feel?' },
            { name: 'You', text: '...light. Like it weighs nothing.' },
            { name: 'Trader', text: 'That\'s my welding. Lightweight but tough.' },
            { name: 'Trader', text: 'Try moving around.' }
        ], () => {
            this.showTestPhase1()
        })
    }

    showTestPhase1() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.testItems = []

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(60)
        this.testItems.push(overlay)

        const title = this.add.text(W / 2, 100, '🤖 ARMOR TEST: FULL SYSTEMS', {
            fontSize: '32px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(61)
        this.testItems.push(title)

        const instruction = this.add.text(W / 2, 170, 'Click each test to complete it', {
            fontSize: '20px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(61)
        this.testItems.push(instruction)

        this.testsCompleted = 0
        this.totalTests = 5

        const tests = [
            { label: '🦾 Hand Grip', response: '*Fingers clench and release. Perfect grip strength.*' },
            { label: '🦿 Leg Movement', response: '*Legs respond perfectly. Walking feels natural.*' },
            { label: '🤖 Head Visor', response: '*Visor displays HUD. Optical sensors online.*' },
            { label: '🛡️ Plating Seal', response: '*All plating segments sealed tight. No gaps.*' },
            { label: '⚡ Core Sync', response: '*Power core stable. All systems drawing power evenly.*' }
        ]

        tests.forEach((test, i) => {
            const y = 260 + (i * 80)

            const btn = this.add.rectangle(W / 2, y, 500, 65, 0x222244)
                .setStrokeStyle(2, 0x00ff88)
                .setScrollFactor(0).setDepth(61)
                .setInteractive({ useHandCursor: true })

            const label = this.add.text(W / 2 - 200, y, `⬜ ${test.label}`, {
                fontSize: '20px',
                fill: '#ffffff'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(62)

            const status = this.add.text(W / 2 + 200, y, 'PENDING', {
                fontSize: '16px',
                fill: '#888888'
            }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(62)

            this.testItems.push(btn, label, status)

            btn.on('pointerover', () => btn.setFillStyle(0x333366))
            btn.on('pointerout', () => btn.setFillStyle(0x222244))
            btn.on('pointerdown', () => {
                btn.setFillStyle(0x224422)
                btn.setStrokeStyle(2, 0x00ff88)
                btn.disableInteractive()
                label.setText(`✅ ${test.label}`)
                label.setFill('#00ff88')
                status.setText('PASS')
                status.setFill('#00ff88')

                this.testsCompleted++

                const responseText = this.add.text(W / 2, y + 22, test.response, {
                    fontSize: '12px',
                    fill: '#44ff44',
                    fontStyle: 'italic'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(62)
                this.testItems.push(responseText)

                if (this.testsCompleted >= this.totalTests) {
                    this.time.delayedCall(1000, () => {
                        this.testItems.forEach(item => item.destroy())
                        this.testItems = []
                        this.showTestComplete()
                    })
                }
            })
        })
    }

    showTestComplete() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.testItems = []

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(60)
        this.testItems.push(overlay)

        const addText = (x, y, text, style, delay) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setScrollFactor(0).setDepth(61)
                .setAlpha(0)
            this.testItems.push(t)
            this.time.delayedCall(delay, () => {
                this.tweens.add({ targets: t, alpha: 1, duration: 600 })
            })
            return t
        }

        addText(W / 2, H / 2 - 220, '🤖 TEST RESULTS', {
            fontSize: '40px', fill: '#00ff88', fontStyle: 'bold'
        }, 300)

        addText(W / 2, H / 2 - 140, '✅ Hand Grip — PASS', {
            fontSize: '20px', fill: '#00ff88'
        }, 800)

        addText(W / 2, H / 2 - 100, '✅ Leg Movement — PASS', {
            fontSize: '20px', fill: '#00ff88'
        }, 1200)

        addText(W / 2, H / 2 - 60, '✅ Head Visor — PASS', {
            fontSize: '20px', fill: '#00ff88'
        }, 1600)

        addText(W / 2, H / 2 - 20, '✅ Plating Seal — PASS', {
            fontSize: '20px', fill: '#00ff88'
        }, 2000)

        addText(W / 2, H / 2 + 20, '✅ Core Sync — PASS', {
            fontSize: '20px', fill: '#00ff88'
        }, 2400)

        addText(W / 2, H / 2 + 80, 'ALL SYSTEMS OPERATIONAL', {
            fontSize: '28px', fill: '#ffffff', fontStyle: 'bold'
        }, 3200)

        addText(W / 2, H / 2 + 130, '"Not a weapon. Protection."', {
            fontSize: '20px', fill: '#ff8800', fontStyle: 'italic'
        }, 4200)

        this.time.delayedCall(5500, () => {
            const cont = this.add.text(W / 2, H / 2 + 220, '[ Continue ]', {
                fontSize: '22px',
                fill: '#555555'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(61)
                .setAlpha(0)
                .setInteractive({ useHandCursor: true })
            this.testItems.push(cont)

            this.tweens.add({ targets: cont, alpha: 1, duration: 600 })

            cont.on('pointerover', () => cont.setStyle({ fill: '#ffffff' }))
            cont.on('pointerout', () => cont.setStyle({ fill: '#555555' }))
            cont.on('pointerdown', () => {
                this.testItems.forEach(item => item.destroy())
                this.testItems = []
                this.showPostTestDialog()
            })
        })
    }

    showPostTestDialog() {
        this.dialog.show([
            { name: 'Trader', text: 'All tests passed. 100% operational.' },
            { name: 'Trader', text: 'The armor is yours now kid.' },
            { name: 'You', text: 'It feels... incredible.' },
            { name: 'You', text: 'The hands move like they\'re my own.' },
            { name: 'You', text: 'The visor shows me everything.' },
            { name: 'Trader', text: 'You built the core, the limbs, the head.' },
            { name: 'Trader', text: 'I just wrapped it in metal.' },
            { name: 'You', text: 'We built it together.' },
            { name: 'Trader', text: '...' },
            { name: 'Trader', text: 'Yeah. We did.' },
            { name: 'Trader', text: 'But remember what it\'s for.' },
            { name: 'You', text: 'Protection. Not destruction.' },
            { name: 'Trader', text: 'Exactly.' },
            { name: 'Trader', text: 'Now go home. Get some rest.' },
            { name: 'Trader', text: 'You\'ve earned it.' },
            { name: 'You', text: 'Thanks. For everything.' },
            { name: 'Trader', text: 'Don\'t thank me yet.' },
            { name: 'Trader', text: 'Something tells me the hard part hasn\'t started.' },
            { name: '', text: '🤖 Armor fully tested and ready!' }
        ], () => {
            GameState.setFlag('armorTested')
            this.updateArmorStatus()
            this.ui.updateStats()
            this.showBaseMenu()
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── Inspect Armor ─────────────────────────────────
    // ═══════════════════════════════════════════════════
    inspectArmor() {
        const parts = GameState.armor.parts
        const coreInstalled = GameState.getFlag('coreInstalled')
        const traderFinishing = GameState.getFlag('traderFinishing')
        const armorComplete = GameState.getFlag('armorComplete')

        const lines = [
            { name: '', text: '─── ARMOR STATUS ───' },
            {
                name: '⚡ Core',
                text: coreInstalled
                    ? '✅ Installed & wired — Powers the suit'
                    : '❌ Not installed'
            },
            {
                name: '🦾 Limbs',
                text: parts.includes('limbs')
                    ? '✅ Hands & legs attached — Full mobility'
                    : '❌ Missing — Assemble at workbench'
            },
            {
                name: '🤖 Head',
                text: parts.includes('head')
                    ? '✅ Visor repaired — Sensors online'
                    : '❌ Damaged — Fix at workbench'
            },
            {
                name: '🛡️ Plating',
                text: armorComplete
                    ? '✅ Welded & sealed by Trader'
                    : traderFinishing
                        ? '🔧 Trader is working on it... (Level 3)'
                        : '❌ Not started — Trader will handle this'
            }
        ]

        // ─── Progress summary ──────────────────────────
        const playerParts = [coreInstalled, parts.includes('limbs'), parts.includes('head')]
            .filter(Boolean).length
        lines.push({
            name: '',
            text: `Your work: ${playerParts}/3 parts  |  Trader: ${armorComplete ? '1/1' : '0/1'}`
        })

        if (armorComplete) {
            lines.push({ name: '⭐', text: 'The armor is COMPLETE and battle-ready!' })
        } else if (traderFinishing) {
            lines.push({ name: '🔧', text: 'Trader is finishing the plating. Return in Level 3.' })
        } else if (playerParts === 3) {
            lines.push({ name: '💬', text: 'Talk to the Trader about the final touch.' })
        }

        this.dialog.show(lines, () => { this.showBaseMenu() })
    }

    // ═══════════════════════════════════════════════════
    // ─── Talk to Trader ────────────────────────────────
    // ═══════════════════════════════════════════════════
    talkToTrader() {
        const parts = GameState.armor.parts
        const coreInstalled = GameState.getFlag('coreInstalled')
        const traderFinishing = GameState.getFlag('traderFinishing')
        const traderCalled = GameState.getFlag('traderCalledArmor')
        const armorComplete = GameState.getFlag('armorComplete')

        if (!coreInstalled) {
            this.dialog.show([
                { name: 'Trader', text: 'You still need to install the core.' },
                { name: 'Trader', text: 'Drag it into the chest and wire it up.' },
                { name: 'Trader', text: 'Red, Blue, Green, Yellow. In that order.' },
                { name: 'You', text: 'Got it. I\'ll handle it.' }
            ], () => { this.showBaseMenu() })

        } else if (!parts.includes('limbs')) {
            this.dialog.show([
                { name: 'Trader', text: 'Core is humming. Good work on the wiring.' },
                { name: 'Trader', text: 'Next up — hands and legs.' },
                { name: 'Trader', text: 'Without them, it\'s just a glowing statue.' },
                { name: 'You', text: 'I\'ll get them built.' }
            ], () => { this.showBaseMenu() })

        } else if (!parts.includes('head')) {
            this.dialog.show([
                { name: 'Trader', text: 'Limbs are solid. Good craftsmanship.' },
                { name: 'Trader', text: 'Now the head unit. It\'s damaged.' },
                { name: 'Trader', text: 'The visor is cracked, sensors are fried.' },
                { name: 'Trader', text: 'You\'ll need to repair it carefully.' },
                { name: 'You', text: 'I can handle it.' }
            ], () => { this.showBaseMenu() })

            // ─── CHANGED: Trader called AND finishing → reveal ─
        } else if (traderCalled && traderFinishing && !GameState.getFlag('armorRevealSeen')) {
            this.showTraderFinishedDialog()

            // ─── Trader finishing but hasn't called yet ────────
        } else if (traderFinishing && !traderCalled) {
            this.dialog.show([
                { name: 'Trader', text: 'I\'m still working on the plating.' },
                { name: 'Trader', text: 'This kind of welding takes time.' },
                { name: 'Trader', text: 'Every plate has to be perfect.' },
                { name: 'You', text: 'How much longer?' },
                { name: 'Trader', text: 'I\'ll call you when it\'s ready.' },
                { name: 'Trader', text: 'Trust me, kid. It\'ll be worth the wait.' }
            ], () => { this.showBaseMenu() })

        } else if (armorComplete && !GameState.getFlag('armorTested')) {
            this.dialog.show([
                { name: 'Trader', text: 'The armor is complete.' },
                { name: 'Trader', text: 'But we should test it before you go out there.' },
                { name: 'Trader', text: 'Step into the frame when you\'re ready.' },
                { name: 'You', text: 'Let\'s do this.' }
            ], () => { this.showBaseMenu() })

        } else if (armorComplete) {
            this.dialog.show([
                { name: 'Trader', text: 'The armor is tested and ready.' },
                { name: 'Trader', text: 'You built the impossible, kid.' },
                { name: 'Trader', text: 'The city needs you now more than ever.' },
                { name: 'You', text: 'I won\'t let them down.' },
                { name: 'Trader', text: 'I know you won\'t.' }
            ], () => { this.showBaseMenu() })
        }
    }
}