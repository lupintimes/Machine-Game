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

    flags: {
        metTrader: false,
        boughtCore: false,
        learnedTruth: false,
        toldKing: false,
        metParkCleaner: false,
        gfHeardConversation: false,
        gfDead: false,
        conspiracyRevealed: false,
        enemyTerritoryUnlocked: false
    },

    earnMoney(amount) {
        this.money += amount
    },

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount
            return true
        }
        return false
    },

    addReputation(amount) {
        this.reputation += amount
    },

    addSkill(skill, amount) {
        if (this.skills[skill] !== undefined) {
            this.skills[skill] += amount
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

    setFlag(flag, value = true) {
        if (this.flags[flag] !== undefined) {
            this.flags[flag] = value
        }
    },

    getFlag(flag) {
        return this.flags[flag]
    },

    advanceLevel() {
        this.level++
    },

    isLevel1Complete() {
        return this.armor.hasCore === true
    },

    isLevel2Complete() {
        return this.flags.learnedTruth && this.flags.toldKing
    },

    isLevel3Complete() {
        return this.flags.gfDead === true
    }
}

export default GameState