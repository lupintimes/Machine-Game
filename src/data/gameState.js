const GameState = {

    // ─── Time System ───────────────────────────────────
    day: 1,
    maxDays: 7,
    timeOfDay: 'morning',
    timeIndex: 0,

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

    skipToNight() {
        if (this.timeIndex < 3) {
            this.timeIndex = 3
            this.timeOfDay = 'night'
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

    // ─── Core Stats ────────────────────────────────────
    level: 1,
    money: 5000,
    reputation: 100,
    elixir: 100,

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

    addItem(item) {
        if (!this.inventory) this.inventory = []
        const existing = this.inventory.find(i => i.id === item.id)
        if (existing) {
            existing.quantity += item.quantity || 1
        } else {
            this.inventory.push({
                ...item,
                quantity: item.quantity || 1
            })
        }
        console.log(`🎒 Item added: ${item.name}`, this.inventory)
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

    // ─── Flags ─────────────────────────────────────────
    flags: {
        // ─── Items ─────────────────────────────────────
        hasCommsDevice: false,
        gaveCommsToGF: false,

        // ─── Intro ─────────────────────────────────────
        introSeen: false,

        // ─── Level 1 ───────────────────────────────────
        workshopIntroSeen: false,
        junkyardIntroSeen: false,
        electricalUnlocked: false,
        metTrader: false,
        boughtCore: false,
        secretBaseRevealed: false,
        secretBaseVisited: false,
        secretBaseIntroSeen: false,

        // ─── Level 2 ───────────────────────────────────
        metKing: false,
        kingGaveQuest: false,
        metLuvaza: false,
        metParkCleaner: false,
        learnedTruth: false,
        toldKing: false,
        rebuiltBuildings: false,

        // ─── Clues ─────────────────────────────────────
        researchClueFound: false,
        luvazaClueFound: false,
        parkClueFound: false,
        traderClueFound: false,

        // ─── Level 3 ───────────────────────────────────
        conspiracyRevealed: false,
        enemyTerritoryUnlocked: false,
        armorServoInstalled: false,
        armorPlatingInstalled: false,
        armorComplete: false,
        parkCleanerRevealed: false,
        reasonForAttackKnown: false,

        // ─── GF Story ──────────────────────────────────
        gfCalledComms: false,
        gfHeardConversation: false,
        gfDead: false,

        // ─── Friendship ────────────────────────────────
        parkCleanerFriendship: 0,


        traderCalledCleaner: false,   // trader radio call to park cleaner
        luvazaVisitedPark: false,     // luvaza sees king + cleaner talking

        traderCalledArmor: false,
        armorTested: false,
    },

    // ─── Flag Methods ──────────────────────────────────
    setFlag(flag, value = true) {
        this.flags[flag] = value
        console.log(`🚩 Flag set: ${flag} =`, value)

        // ─── Auto-check level advance on every flag set ─
        this.tryAdvanceLevel()
    },

    getFlag(flag) {
        return this.flags[flag]
    },

    // ─── Money Methods ─────────────────────────────────
    earnMoney(amount) {
        this.money += amount
        console.log(`💰 Earned ${amount}. Total: ${this.money}`)
    },

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount
            console.log(`💸 Spent ${amount}. Remaining: ${this.money}`)
            return true
        }
        console.log(`❌ Not enough money. Need ${amount}, have ${this.money}`)
        return false
    },

    // ─── Other Methods ─────────────────────────────────
    addReputation(amount) {
        this.reputation += amount
    },

    addSkill(skill, amount) {
        if (this.skills[skill] !== undefined) {
            this.skills[skill] += amount
            if (skill === 'repair' && this.skills.repair >= 5) {
                this.flags.electricalUnlocked = true
            }
        }
    },

    addElixir(amount) {
        this.elixir += amount
    },

    addArmorPart(part) {
        if (!this.armor.parts.includes(part)) {
            this.armor.parts.push(part)
        }
    },

    advanceLevel() {
        this.level++
        console.log(`⭐ Level up! Now level ${this.level}`)
    },

    // ─── Level Completion Checks ───────────────────────
    isLevel1Complete() {
        return this.flags.boughtCore === true
    },

    isLevel2ReadyToAdvance() {
        return (
            this.flags.metKing &&
            this.flags.metLuvaza &&
            this.flags.rebuiltBuildings &&
            this.flags.metParkCleaner &&
            this.flags.learnedTruth &&
            this.flags.toldKing
        )
    },

    isLevel3ReadyToAdvance() {
        return (
            this.flags.armorComplete &&
            this.flags.reasonForAttackKnown &&
            this.flags.gfDead
        )
    },

    tryAdvanceLevel() {
        let advanced = false

        if (this.level === 1 && this.isLevel1Complete()) {
            this.level = 2
            console.log('⭐ Level up! Now level 2')
            advanced = true
        }

        if (this.level === 2 && this.isLevel2ReadyToAdvance()) {
            this.level = 3
            console.log('⭐ Level up! Now level 3')
            advanced = true
        }

        if (this.level === 3 && this.isLevel3ReadyToAdvance()) {
            this.level = 4
            console.log('⭐ Level up! Now level 4')
            advanced = true
        }

        return advanced
    },

    canMeetTrader() {
        return this.skills.repair >= 10
    }
}

export default GameState