const GameState = {

    // ─── Time System ───────────────────────────────────
    day: 1,
    maxDays: 7,
    timeOfDay: 'morning',    // morning, afternoon, evening, night
    timeIndex: 0,            // 0=morning, 1=afternoon, 2=evening, 3=night

    // ─── Time Methods ──────────────────────────────────
    advanceTime() {
        this.timeIndex++
        if (this.timeIndex >= 4) {
            this.timeIndex = 0
            this.day++
        }
        const times = ['morning', 'afternoon', 'evening', 'night']
        this.timeOfDay = times[this.timeIndex]

        console.log(`📅 Day ${this.day} - ${this.timeOfDay}`)
        return this.isGameOver()
    },

    skipToMorning() {
        this.timeIndex = 0
        this.timeOfDay = 'morning'
        this.day++
        console.log(`😴 Slept. Day ${this.day} - morning`)
        return this.isGameOver()
    },

    skipToAfternoon() {
        if (this.timeIndex < 1) {
            this.timeIndex = 1
            this.timeOfDay = 'afternoon'
        }
    },

    skipToEvening() {
        if (this.timeIndex < 2) {
            this.timeIndex = 2
            this.timeOfDay = 'evening'
        }
    },

    isGameOver() {
        return this.day > this.maxDays
    },

    getDaysLeft() {
        return Math.max(0, this.maxDays - this.day + 1)
    },

    getTimeIcon() {
        const icons = {
            'morning': '🌅',
            'afternoon': '☀️',
            'evening': '🌆',
            'night': '🌙'
        }
        return icons[this.timeOfDay]
    },

    getTimeColor() {
        const colors = {
            'morning': '#ffdd44',
            'afternoon': '#ffffff',
            'evening': '#ff8844',
            'night': '#4444aa'
        }
        return colors[this.timeOfDay]
    },

    level: 1,
    money: 5000,
    reputation: 0,
    elixir: 0,

    skills: {
        repair: 10,
        research: 10,
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
        hasCommsDevice: false,
        gaveCommsToGF: false,

        introSeen: false,
        // Level 1
        workshopIntroSeen: false,
        junkyardIntroSeen: false,
        electricalUnlocked: false,
        metTrader: false,
        boughtCore: false,
        secretBaseRevealed: false,
        secretBaseVisited: false,
        secretBaseIntroSeen: false,

        // Level 2
        metKing: false,
        kingGaveQuest: false,
        metLuvaza: false,
        metParkCleaner: false,
        learnedTruth: false,
        toldKing: false,
        rebuiltBuildings: false,

        // Level 3
        gfHeardConversation: false,
        gfDead: false,
        conspiracyRevealed: false,
        enemyTerritoryUnlocked: false,
        armorServoInstalled: false,
        armorPlatingInstalled: false,
        armorComplete: false,
        parkCleanerFriendship: 0,    // NOT a flag, add as property
        gfCalledComms: false,
        gfHeardConversation: false,
        gfDead: false,
        parkCleanerRevealed: false,
        reasonForAttackKnown: false,
        researchClueFound: false,    // from workshop research
        luvazaClueFound: false,      // from talking to Luvaza
        parkClueFound: false,
        traderClueFound: false,       // from Park Cleaner
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