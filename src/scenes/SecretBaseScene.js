import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class SecretBaseScene extends Phaser.Scene {
    constructor() {
        super('SecretBaseScene')
    }

    preload() {
        // Add a background image later if you have one
        // this.load.image('secretbase-bg', 'assets/images/secretbase-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── UI ────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Background (Underground Bunker) ───────────
        // Dark underground gradient feel
        this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a12).setDepth(-2)

        // Concrete walls
        this.add.rectangle(W / 2, 40, W, 80, 0x1a1a22).setDepth(-1)
        this.add.rectangle(W / 2, H - 40, W, 80, 0x1a1a22).setDepth(-1)

        // Wall pipes (left)
        for (let i = 0; i < 8; i++) {
            this.add.rectangle(30, 100 + (i * 120), 8, 80, 0x555566).setDepth(0)
        }

        // Wall pipes (right)
        for (let i = 0; i < 8; i++) {
            this.add.rectangle(W - 30, 100 + (i * 120), 8, 80, 0x555566).setDepth(0)
        }

        // Ceiling lights
        for (let i = 0; i < 5; i++) {
            const lx = 200 + (i * 380)
            this.add.rectangle(lx, 85, 60, 6, 0xffaa00, 0.3).setDepth(0)
            // Light glow
            this.add.circle(lx, 130, 80, 0xffaa00, 0.03).setDepth(0)
        }

        // Floor grating
        for (let i = 0; i < 20; i++) {
            const fx = 50 + (i * 100)
            this.add.rectangle(fx, H - 80, 80, 2, 0x333344).setDepth(0)
        }

        // ─── Armor Stand (Center) ──────────────────────
        this.armorStand = this.add.rectangle(W / 2, H / 2 - 50, 200, 300, 0x222233)
            .setStrokeStyle(2, 0x444466).setDepth(1)

        this.armorIcon = this.add.text(W / 2, H / 2 - 100, '🤖', {
            fontSize: '80px'
        }).setOrigin(0.5).setDepth(2)

        this.armorLabel = this.add.text(W / 2, H / 2 + 70, 'ROBOTIC ARMOR', {
            fontSize: '20px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2)

        this.armorStatus = this.add.text(W / 2, H / 2 + 100, '', {
            fontSize: '16px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(2)

        this.updateArmorStatus()

        // ─── Workbench (Left) ──────────────────────────
        this.workbench = this.add.rectangle(300, H / 2, 200, 150, 0x3d2b1f)
            .setStrokeStyle(2, 0x5a3d2b).setDepth(1)

        this.add.text(300, H / 2 - 50, '🔧', { fontSize: '40px' })
            .setOrigin(0.5).setDepth(2)

        this.add.text(300, H / 2 + 20, 'Workbench', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(2)

        // ─── Parts Shelf (Right) ───────────────────────
        this.partsShelf = this.add.rectangle(W - 300, H / 2, 200, 150, 0x2b2b3d)
            .setStrokeStyle(2, 0x3d3d5a).setDepth(1)

        this.add.text(W - 300, H / 2 - 50, '📦', { fontSize: '40px' })
            .setOrigin(0.5).setDepth(2)

        this.add.text(W - 300, H / 2 + 20, 'Parts Storage', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(2)

        // ─── Ambient particles ─────────────────────────
        this.createDustParticles(W, H)

        // ─── Scene Title ───────────────
        this.add.text(W / 2, 30, '🔐 Secret Underground Base', {
            fontSize: '28px',
            fill: '#ff8800',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20)

        // ─── Dialog ────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Menu ──────────────────────
        this.menuActive = false
        this.menuItems = []

        // ─── Intro dialog (first time) ─
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
                { name: 'Trader', text: 'The city needs protection. This armor is the answer.' },
                { name: '', text: 'You can now assemble armor parts here.' }
            ], () => {
                GameState.setFlag('secretBaseIntroSeen')
                this.showBaseMenu()
            })
        } else {
            this.showBaseMenu()
        }
    }

    update() {
        if (this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
        }
    }

    // ─── Dust Particles ────────────────────────────────
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

    // ─── Update Armor Display ──────────────────────────
    updateArmorStatus() {
        const parts = GameState.armor.parts
        const hasCore = GameState.armor.hasCore

        let status = `Core: ${hasCore ? '✅' : '❌'}`
        status += `  |  Servo: ${parts.includes('servo') ? '✅' : '❌'}`
        status += `  |  Plating: ${parts.includes('plating') ? '✅' : '❌'}`
        status += `\n${parts.length}/3 parts installed`

        this.armorStatus.setText(status)

        // Change armor color based on completion
        if (parts.length >= 3) {
            this.armorStand.setStrokeStyle(3, 0x00ff88)
            this.armorLabel.setFill('#00ff88')
            this.armorLabel.setText('ARMOR COMPLETE!')
        } else if (parts.length >= 1) {
            this.armorStand.setStrokeStyle(2, 0xffaa00)
        }
    }

    // ─── Base Menu ─────────────────────────────────────
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

        // ─── Assemble Armor ────────────
        const canAssemble = this.getAvailableParts().length > 0
        this.createMenuButton(W / 2 - 400, H - 150, '🔧 Assemble Armor', () => {
            this.closeBaseMenu()
            this.showAssemblyMenu()
        }, !canAssemble)

        // ─── Inspect Armor ─────────────
        this.createMenuButton(W / 2 - 100, H - 150, '🔍 Inspect Armor', () => {
            this.closeBaseMenu()
            this.inspectArmor()
        })

        // ─── Talk to Trader ────────────
        this.createMenuButton(W / 2 + 200, H - 150, '💬 Talk to Trader', () => {
            this.closeBaseMenu()
            this.talkToTrader()
        })

        // ─── Leave ─────────────────────
        this.createMenuButton(W / 2 + 500, H - 150, '🔙 Leave', () => {
            this.closeBaseMenu()
            this.scene.start('JunkyardScene')
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

    // ─── Assembly Menu ─────────────────────────────────
    getAvailableParts() {
        const available = []

        // ─── FIX: Check BOTH hasCore and parts array ──────
        const hasCore = GameState.armor.hasCore ||
            GameState.armor.parts.includes('core') ||
            GameState.getFlag('boughtCore')

        if (hasCore && !GameState.armor.parts.includes('servo')) {
            available.push({
                id: 'servo',
                name: 'Servo Motors',
                icon: '⚙️',
                description: 'Precision motors for armor movement.',
                cost: 300,
                repairNeeded: 15
            })
        }
        if (GameState.armor.parts.includes('servo') && !GameState.armor.parts.includes('plating')) {
            available.push({
                id: 'plating',
                name: 'Armor Plating',
                icon: '🛡️',
                description: 'Heavy duty plating for protection.',
                cost: 400,
                repairNeeded: 25
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

        // Current status
        this.add.text(W / 2, H / 2 - 160, `💰 Money: ${GameState.money}  |  🔧 Repair: ${GameState.skills.repair}`, {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(52)

        if (available.length === 0) {
            const msg = GameState.armor.parts.length >= 3
                ? '✅ Armor is fully assembled!'
                : '🔒 No parts available yet. Progress further in the story.'

            this.add.text(W / 2, H / 2, msg, {
                fontSize: '22px',
                fill: '#888888'
            }).setOrigin(0.5).setDepth(52)
        }

        available.forEach((part, i) => {
            const y = H / 2 - 60 + (i * 120)
            const canBuild = GameState.money >= part.cost && GameState.skills.repair >= part.repairNeeded

            // Part box
            const box = this.add.rectangle(W / 2, y, 600, 100, canBuild ? 0x222244 : 0x1a1a22)
                .setStrokeStyle(2, canBuild ? 0x00ff88 : 0x444444)
                .setDepth(52)
                .setInteractive({ useHandCursor: canBuild })

            // Icon + name
            this.add.text(W / 2 - 260, y - 20, `${part.icon} ${part.name}`, {
                fontSize: '22px',
                fill: canBuild ? '#ffffff' : '#666666',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setDepth(53)

            // Description
            this.add.text(W / 2 - 260, y + 15, part.description, {
                fontSize: '14px',
                fill: '#aaaaaa'
            }).setOrigin(0, 0.5).setDepth(53)

            // Cost
            this.add.text(W / 2 + 260, y - 15, `💰 ${part.cost}`, {
                fontSize: '16px',
                fill: canBuild ? '#ffaa00' : '#555555'
            }).setOrigin(1, 0.5).setDepth(53)

            // Skill requirement
            this.add.text(W / 2 + 260, y + 15, `🔧 ${part.repairNeeded} repair`, {
                fontSize: '14px',
                fill: GameState.skills.repair >= part.repairNeeded ? '#00ff88' : '#ff4444'
            }).setOrigin(1, 0.5).setDepth(53)

            if (canBuild) {
                box.on('pointerover', () => box.setFillStyle(0x333366))
                box.on('pointerout', () => box.setFillStyle(0x222244))
                box.on('pointerdown', () => {
                    this.buildPart(part)
                })
            }

            this.menuItems.push(box)
        })

        // Close
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

    // Replace ONLY the buildPart() method in your existing SecretBaseScene.js

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

        // ─── Keep flags in sync ────────────────────────────
        if (part.id === 'servo') {
            GameState.setFlag('armorServoInstalled')
        }
        if (part.id === 'plating') {
            GameState.setFlag('armorPlatingInstalled')
        }

        this.closeBaseMenu()
        this.updateArmorStatus()
        this.ui.updateStats()

        if (GameState.armor.parts.length >= 3) {
            GameState.setFlag('armorComplete')

            this.dialog.show([
                { name: 'You', text: 'The last piece is in place...' },
                { name: 'You', text: 'The armor... it\'s complete!' },
                { name: 'Trader', text: 'I knew you could do it, kid.' },
                { name: 'Trader', text: 'Look at it. Ancient engineering, brought back to life.' },
                { name: 'You', text: 'It feels... right. Like it was made for me.' },
                { name: 'Trader', text: 'No weapons. Pure protection.' },
                { name: 'Trader', text: 'Now you\'re ready for what\'s coming.' },
                { name: '', text: '🤖 ROBOTIC ARMOR COMPLETED!' }
            ], () => {
                GameState.advanceLevel()
                this.ui.updateStats()
                this.showArmorCompleteCutscene()
            })
        } else {
            this.dialog.show([
                { name: 'You', text: `${part.icon} ${part.name} installed!` },
                { name: 'You', text: 'The armor is getting stronger.' },
                { name: 'Trader', text: 'Good work. Keep going.' }
            ], () => {
                this.showBaseMenu()
            })
        }
    }

    // ─── Add this NEW method to SecretBaseScene ────────────
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

        addText(W / 2, H / 2 - 140, '✅ Power Core   ✅ Servo Motors   ✅ Armor Plating', {
            fontSize: '22px',
            fill: '#ffffff'
        }, 1500)

        addText(W / 2, H / 2 - 60, 'No weapons. No destruction.', {
            fontSize: '24px',
            fill: '#aaaaaa'
        }, 2500)

        addText(W / 2, H / 2 - 20, 'Just pure protection for those who need it most.', {
            fontSize: '22px',
            fill: '#888888',
            fontStyle: 'italic'
        }, 3500)

        addText(W / 2, H / 2 + 80, '"The strongest armor is built not for war,\nbut for those we love."', {
            fontSize: '20px',
            fill: '#ff8800',
            fontStyle: 'italic',
            align: 'center'
        }, 5000)

        addText(W / 2, H / 2 + 180, '⭐ LEVEL 3 REACHED ⭐', {
            fontSize: '36px',
            fill: '#ffdd00',
            fontStyle: 'bold'
        }, 6500)

        // ─── Continue button ──────────────────────────────
        this.time.delayedCall(8000, () => {
            const cont = this.add.text(W / 2, H / 2 + 280, '[ Click to continue ]', {
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

    // ─── Inspect Armor ─────────────────────────────────
    inspectArmor() {
        const parts = GameState.armor.parts
        const hasCore = GameState.armor.hasCore ||
            parts.includes('core') ||
            GameState.getFlag('boughtCore')
        const total = 3

        let lines = [
            { name: '', text: '─── ARMOR STATUS ───' },
            { name: 'Core', text: hasCore ? '✅ Installed - Powers the entire suit' : '❌ Missing - Need to buy from Trader' },
            { name: 'Servo', text: parts.includes('servo') ? '✅ Installed - Enables movement' : '❌ Missing - Assemble at workbench' },
            { name: 'Plating', text: parts.includes('plating') ? '✅ Installed - Full protection' : '❌ Missing - Assemble at workbench' },
            { name: '', text: `Progress: ${parts.length}/${total} parts` }
        ]

        if (parts.length >= 3) {
            lines.push({ name: '⭐', text: 'The armor is COMPLETE and ready!' })
        }

        this.dialog.show(lines, () => {
            this.showBaseMenu()
        })
    }

    // ─── Talk to Trader ────────────────────────────────
    talkToTrader() {
        const parts = GameState.armor.parts

        if (parts.length === 0) {
            this.dialog.show([
                { name: 'Trader', text: 'You\'ve got the core installed already.' },
                { name: 'Trader', text: 'Next you need servo motors for movement.' },
                { name: 'Trader', text: 'It\'ll cost you, but it\'s worth it.' },
                { name: 'You', text: 'I\'ll get to work.' }
            ], () => {
                this.showBaseMenu()
            })
        } else if (parts.length === 1) {
            this.dialog.show([
                { name: 'Trader', text: 'Servos are in. Nice work.' },
                { name: 'Trader', text: 'Last thing you need is the plating.' },
                { name: 'Trader', text: 'Heavy stuff. But it\'ll keep you alive.' },
                { name: 'You', text: 'Almost there...' }
            ], () => {
                this.showBaseMenu()
            })
        } else if (parts.length >= 2 && parts.length < 3) {
            this.dialog.show([
                { name: 'Trader', text: 'One more part to go.' },
                { name: 'Trader', text: 'You\'re close, kid. Real close.' },
                { name: 'You', text: 'I can feel it coming together.' }
            ], () => {
                this.showBaseMenu()
            })
        } else {
            this.dialog.show([
                { name: 'Trader', text: 'The armor is complete.' },
                { name: 'Trader', text: 'You did something no one else could.' },
                { name: 'Trader', text: 'The city needs you now more than ever.' },
                { name: 'You', text: 'I\'m ready.' },
                { name: 'Trader', text: 'Good. Because what\'s coming won\'t wait.' }
            ], () => {
                this.showBaseMenu()
            })
        }
    }
}