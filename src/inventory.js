export default class Inventory {
    constructor(scene) {
        this.scene = scene
        this.visible = false
        this.items = []
        this.slots = []
    }

    // ─── Add Item ──────────────────────────────────────
    static addItem(item) {
        // item = { id, name, icon, description, quantity }
        const existing = GameState.inventory.find(i => i.id === item.id)
        if (existing) {
            existing.quantity += item.quantity || 1
        } else {
            GameState.inventory.push({
                ...item,
                quantity: item.quantity || 1
            })
        }
    }

    // ─── Remove Item ───────────────────────────────────
    static removeItem(id, quantity = 1) {
        const item = GameState.inventory.find(i => i.id === id)
        if (item) {
            item.quantity -= quantity
            if (item.quantity <= 0) {
                GameState.inventory = GameState.inventory.filter(i => i.id !== id)
            }
            return true
        }
        return false
    }

    // ─── Has Item ──────────────────────────────────────
    static hasItem(id) {
        return GameState.inventory.some(i => i.id === id)
    }

    // ─── Get Item ──────────────────────────────────────
    static getItem(id) {
        return GameState.inventory.find(i => i.id === id)
    }

    // ─── Show Inventory UI ─────────────────────────────
    show() {
        if (this.visible) return
        this.visible = true

        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        // ─── Overlay ───────────────────
        this.overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(200)

        // ─── Panel ─────────────────────
        this.panel = this.scene.add.rectangle(W / 2, H / 2, 900, 650, 0x1a1a2e)
            .setStrokeStyle(3, 0x00ff88)
            .setScrollFactor(0).setDepth(201)

        // ─── Title ─────────────────────
        this.title = this.scene.add.text(W / 2, H / 2 - 290, '🎒 Inventory', {
            fontSize: '30px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        // ─── Categories ────────────────
        this.categoryText = this.scene.add.text(W / 2 - 400, H / 2 - 240, 'All Items', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setScrollFactor(0).setDepth(202)

        // ─── Grid slots ────────────────
        this.slots = []
        this.tooltipBox = null

        const cols = 6
        const rows = 4
        const slotSize = 90
        const startX = W / 2 - (cols * slotSize) / 2 + slotSize / 2
        const startY = H / 2 - 150

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * slotSize
                const y = startY + row * slotSize
                const index = row * cols + col

                // Slot bg
                const slot = this.scene.add.rectangle(x, y, slotSize - 5, slotSize - 5, 0x222233)
                    .setStrokeStyle(1, 0x444466)
                    .setScrollFactor(0).setDepth(202)
                    .setInteractive({ useHandCursor: true })

                // Item in this slot
                const item = GameState.inventory[index]
                let icon = null
                let qty = null

                if (item) {
                    icon = this.scene.add.text(x, y - 10, item.icon, {
                        fontSize: '28px'
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)

                    qty = this.scene.add.text(x + 30, y + 25, `x${item.quantity}`, {
                        fontSize: '14px',
                        fill: '#ffaa00'
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(203)

                    // Hover tooltip
                    slot.on('pointerover', () => {
                        slot.setFillStyle(0x333355)
                        this.showTooltip(x, y - 70, item)
                    })
                    slot.on('pointerout', () => {
                        slot.setFillStyle(0x222233)
                        this.hideTooltip()
                    })
                } else {
                    slot.on('pointerover', () => slot.setFillStyle(0x2a2a44))
                    slot.on('pointerout', () => slot.setFillStyle(0x222233))
                }

                this.slots.push({ slot, icon, qty })
            }
        }

        // ─── Armor Status ──────────────
        this.armorSection = this.scene.add.text(W / 2, H / 2 + 230, this.getArmorText(), {
            fontSize: '18px',
            fill: '#888888',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)

        // ─── Close Button ──────────────
        this.closeBtn = this.scene.add.text(W / 2 + 420, H / 2 - 295, '✖', {
            fontSize: '28px',
            fill: '#ff4444'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
            .setInteractive({ useHandCursor: true })

        this.closeBtn.on('pointerover', () => this.closeBtn.setFill('#ff0000'))
        this.closeBtn.on('pointerout', () => this.closeBtn.setFill('#ff4444'))
        this.closeBtn.on('pointerdown', () => this.hide())

        // ─── Empty hint ────────────────
        if (GameState.inventory.length === 0) {
            this.emptyText = this.scene.add.text(W / 2, H / 2, 'No items yet.\nComplete tasks to earn items!', {
                fontSize: '20px',
                fill: '#555566',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
        }
    }

    showTooltip(x, y, item) {
        const W = this.scene.cameras.main.width
        const H = this.scene.cameras.main.height

        this.tooltipBg = this.scene.add.rectangle(x, y, 200, 80, 0x000000, 0.9)
            .setStrokeStyle(1, 0x00ff88)
            .setScrollFactor(0).setDepth(210)

        this.tooltipName = this.scene.add.text(x, y - 20, item.name, {
            fontSize: '16px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(211)

        this.tooltipDesc = this.scene.add.text(x, y + 10, item.description, {
            fontSize: '13px',
            fill: '#aaaaaa',
            wordWrap: { width: 180 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(211)
    }

    hideTooltip() {
        if (this.tooltipBg) this.tooltipBg.destroy()
        if (this.tooltipName) this.tooltipName.destroy()
        if (this.tooltipDesc) this.tooltipDesc.destroy()
    }

    getArmorText() {
        const parts = GameState.armor.parts
        return `🤖 Armor: ${parts.length}/3 parts  |  Core: ${GameState.armor.hasCore ? '✅' : '❌'}  |  Status: ${GameState.armor.isHalfDone ? 'In Progress' : 'Not Started'}`
    }

    hide() {
        this.visible = false
        if (this.overlay) this.overlay.destroy()
        if (this.panel) this.panel.destroy()
        if (this.title) this.title.destroy()
        if (this.categoryText) this.categoryText.destroy()
        if (this.armorSection) this.armorSection.destroy()
        if (this.closeBtn) this.closeBtn.destroy()
        if (this.emptyText) this.emptyText.destroy()
        this.hideTooltip()
        this.slots.forEach(s => {
            if (s.slot) s.slot.destroy()
            if (s.icon) s.icon.destroy()
            if (s.qty) s.qty.destroy()
        })
        this.slots = []
    }

    toggle() {
        if (this.visible) {
            this.hide()
        } else {
            this.show()
        }
    }
}