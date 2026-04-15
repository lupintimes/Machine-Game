const GameState = {

    level: 1,
    money: 0,
    reputation: 0,
    elixir: 0,

    skills: {
        repair: 0,
        research: 0,
        combat: 0
    },

    armor: {
        isHalfDone: true,
        hasCore: false,
        parts: []
    },

    // ─── Inventory ─────────────────────────────────────
    inventory: [],

    // ─── Inventory Methods ─────────────────────────────
    addItem(item) {
        const existing = this.inventory.find(i => i.id === item.id)
        if (existing) {
            existing.quantity += item.quantity || 1
        } else {
            this.inventory.push({
                ...item,
                quantity: item.quantity || 1
            })
        }
    },

    removeItem(id, quantity = 1) {
        const item = this.inventory.find(i => i.id === id)
        if (item) {
            item.quantity -= quantity
            if (item.quantity <= 0) {
                this.inventory = this.inventory.filter(i => i.id !== id)
            }
            return true
        }
        return false
    },

    hasItem(id) {
        return this.inventory.some(i => i.id === id)
    },

    getItem(id) {
        return this.inventory.find(i => i.id === id)
    },

    // ─── existing methods ──────────────────────────────
    flags: {
        secretBaseVisited: false,
        secretBaseIntroSeen: false,
        workshopIntroSeen: false,
        electricalUnlocked: false,
        metTrader: false,
        boughtCore: false,
        secretBaseRevealed: false,
        learnedTruth: false,
        toldKing: false,
        metParkCleaner: false,
        gfHeardConversation: false,
        gfDead: false,
        conspiracyRevealed: false,
        enemyTerritoryUnlocked: false
    },

    earnMoney(amount) { this.money += amount },

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount
            return true
        }
        return false
    },

    addReputation(amount) { this.reputation += amount },

    addSkill(skill, amount) {
        if (this.skills[skill] !== undefined) {
            this.skills[skill] += amount
            if (skill === 'repair' && this.skills.repair >= 5) {
                this.flags.electricalUnlocked = true
            }
        }
    },

    addElixir(amount) { this.elixir += amount },

    addArmorPart(part) {
        if (!this.armor.parts.includes(part)) {
            this.armor.parts.push(part)
        }
    },

    setFlag(flag, value = true) {
        if (this.flags[flag] !== undefined) {
            this.flags[flag] = value
        }
    },

    getFlag(flag) { return this.flags[flag] },

    advanceLevel() { this.level++ },

    isLevel1Complete() { return this.flags.boughtCore === true },
    isLevel2Complete() { return this.flags.learnedTruth && this.flags.toldKing },
    isLevel3Complete() { return this.flags.gfDead === true },
    canMeetTrader() { return this.skills.repair >= 10 }
}

export default GameState