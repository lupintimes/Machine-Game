import DialogBox from '../dialog.js'

export default class CutsceneScene extends Phaser.Scene {
    constructor() {
        super('CutsceneScene')
    }

    init(data) {
        this.cutsceneKey = data.key || 'default'
        this.returnScene = data.returnScene || 'HubScene'
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── State ─────────────────────────────────────
        this.speedMultiplier = 1
        this.isSkipping = false

        // ─── Controls ──────────────────────────────────
        this.enterKey = this.input.keyboard.addKey('ENTER')
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Black background ──────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000)

        // ─── CUTSCENE label ────────────────────────────
        this.add.text(W / 2, H / 2 - 100, '[ CUTSCENE ]', {
            fontSize: '28px',
            fill: '#444444',
            fontStyle: 'italic'
        }).setOrigin(0.5)

        // Title:
        this.cutsceneTitle = this.add.text(W / 2, H / 2, '', {
            fontFamily: "'Orbitron', monospace",
            fontSize: '42px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: W - 200 }
        }).setOrigin(0.5)

        // Subtitle:
        this.cutsceneSubtitle = this.add.text(W / 2, H / 2 + 80, '', {
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '24px',
            fill: '#aaaaaa',
            align: 'center',
            wordWrap: { width: W - 200 }
        }).setOrigin(0.5)

        // ─── Speed indicator ───────────────────────────
        this.speedText = this.add.text(W - 30, 30, '⏩ 1x', {
            fontSize: '16px',
            fill: '#555555'
        }).setOrigin(1, 0).setDepth(500)

        // ─── Control hint ──────────────────────────────
        this.add.text(W / 2, H - 30, 'ENTER: Speed Up  |  SPACE: Skip', {
            fontSize: '16px',
            fill: '#555555'
        }).setOrigin(0.5).setDepth(500)

        // ─── Play the cutscene ─────────────────────────
        this.playCutscene(this.cutsceneKey)
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.cycleSpeed()
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (this.introDialog && this.introDialog.isActive) {
                this.introDialog.next()
            } else if (this.eveningDialog && this.eveningDialog.isActive) {
                this.eveningDialog.next()
            } else {
                this.skipCutscene()
            }
        }
    }

    // ─── Speed Control ─────────────────────────────────
    cycleSpeed() {
        if (this.speedMultiplier === 1) {
            this.speedMultiplier = 2
            this.speedText.setText('⏩ 2x')
            this.speedText.setFill('#ffaa00')
        } else if (this.speedMultiplier === 2) {
            this.speedMultiplier = 4
            this.speedText.setText('⏩ 4x')
            this.speedText.setFill('#ff4444')
        } else {
            this.speedMultiplier = 1
            this.speedText.setText('⏩ 1x')
            this.speedText.setFill('#555555')
        }
    }

    // ─── Skip Cutscene ─────────────────────────────────
    skipCutscene() {
        if (this.isSkipping) return
        this.isSkipping = true

        this.tweens.killAll()

        // ─── Set flags on skip ─────────────────────────
        if (this.cutsceneKey === 'gameIntro') {
            GameState.setFlag('introSeen')
        }
        if (this.cutsceneKey === 'truthDiscovered') {
            GameState.setFlag('learnedTruth')
        }
        if (this.cutsceneKey === 'level2Complete') {
            GameState.setFlag('toldKing')
            GameState.tryAdvanceLevel()
            GameState.setFlag('enemyTerritoryUnlocked')
        }
        if (this.cutsceneKey === 'eveningCutscene') {
            GameState.setFlag('gfDead')
            GameState.setFlag('luvazaVisitedPark')
            GameState.setFlag('gfHeardConversation')
            GameState.setFlag('gfCalledComms')
            GameState.setFlag('conspiracyRevealed')
        }
        if (this.cutsceneKey === 'gfDeath') {
            GameState.setFlag('gfDead')
            GameState.setFlag('learnedTruth')
            GameState.tryAdvanceLevel()
        }

        this.cameras.main.fade(300, 0, 0, 0)
        this.time.delayedCall(300, () => {
            if (this.cutsceneKey === 'gameIntro') {
                this.scene.start('HubScene')
            } else if (this.cutsceneKey === 'truthDiscovered') {
                this.scene.start('WorkshopScene')
            } else if (this.cutsceneKey === 'level2Complete') {
                this.scene.start('HubScene')
            } else if (this.cutsceneKey === 'eveningCutscene') {
                this.scene.start('Level3PalaceScene')
            } else if (this.cutsceneKey === 'gfDeath') {
                this.scene.start('HubScene')
            } else if (this.cutsceneKey === 'gameOver') {
                location.reload()
            } else {
                this.scene.start(this.returnScene)
            }
        })
    }

    // ─── Show Sequence ─────────────────────────────────
    showSequence(sequence, onComplete) {
        let index = 0

        const showNext = () => {
            if (this.isSkipping) return
            if (index >= sequence.length) {
                if (onComplete) onComplete()
                return
            }

            const item = sequence[index]
            index++

            this.cutsceneTitle.setAlpha(0)
            this.cutsceneSubtitle.setAlpha(0)
            this.cutsceneTitle.setText(item.title || '')
            this.cutsceneSubtitle.setText(item.subtitle || '')

            const fadeIn = 800 / this.speedMultiplier
            const hold = (item.duration || 2500) / this.speedMultiplier
            const fadeOut = 600 / this.speedMultiplier

            this.tweens.add({
                targets: [this.cutsceneTitle, this.cutsceneSubtitle],
                alpha: 1,
                duration: fadeIn,
                onComplete: () => {
                    if (this.isSkipping) return
                    this.time.delayedCall(hold, () => {
                        if (this.isSkipping) return
                        this.tweens.add({
                            targets: [this.cutsceneTitle, this.cutsceneSubtitle],
                            alpha: 0,
                            duration: fadeOut,
                            onComplete: showNext
                        })
                    })
                }
            })
        }

        showNext()
    }

    // ─── Play Cutscene ─────────────────────────────────
    playCutscene(key) {
        switch (key) {
            case 'gameIntro': this.gameIntroCutscene(); break
            case 'truthDiscovered': this.truthDiscoveredCutscene(); break
            case 'level2Complete': this.level2CompleteCutscene(); break
            case 'level3Intro': this.level3IntroCutscene(); break
            case 'eveningCutscene': this.eveningCutscene(); break  // ← NEW
            case 'gfDeath': this.gfDeathCutscene(); break
            case 'gameOver': this.gameOverCutscene(); break
            default: this.defaultCutscene()
        }
    }

    // ─── Game Intro ────────────────────────────────────
    gameIntroCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1500, 0, 0, 0)

        this.showSequence([
            { title: 'A city once full of life...', subtitle: '', duration: 2500 },
            { title: 'Now lies in ruins.', subtitle: 'Half destroyed by an unknown enemy.', duration: 3000 },
            { title: 'The attack came without warning.', subtitle: 'No one knows why. No one knows who.', duration: 3000 },
            { title: 'But life must go on.', subtitle: '', duration: 2000 }
        ], () => {
            if (this.isSkipping) return

            this.cutsceneTitle.setAlpha(0)
            this.cutsceneSubtitle.setAlpha(0)



            this.introDialog = new DialogBox(this)
            this.introDialog.show([
                { name: 'You', text: '...' },
                { name: 'You', text: 'The city... it\'s worse than I thought.' },
                { name: 'Luvaza', text: 'You made it! I was so worried about you.' },
                { name: 'You', text: 'Are you okay? Are you hurt?' },
                { name: 'Luvaza', text: 'I\'m fine. But the city...' },
                { name: 'Luvaza', text: 'Half of it is gone. Just... gone.' },
                { name: 'You', text: 'What happened exactly?' },
                { name: 'Luvaza', text: 'It was sudden. Explosions everywhere.' },
                { name: 'Luvaza', text: 'No warning. No demands. They just attacked.' },
                { name: 'You', text: 'Do they know who did it?' },
                { name: 'Luvaza', text: 'No one knows. My father has been trying to find out.' },
                { name: 'You', text: 'Your father... is he okay?' },
                { name: 'Luvaza', text: 'He\'s fine. Just... overwhelmed.' },
                { name: 'You', text: 'I\'m an engineer. I should be able to help somehow.' },
                { name: 'Luvaza', text: 'Your workshop! Is it still standing?' },
                { name: 'You', text: 'I don\'t know. I need to check.' },
                { name: 'You', text: 'And that armor project I was working on...' },
                { name: 'Luvaza', text: 'Be careful out there.' },
                { name: 'You', text: 'I will. I\'ll find you later.' }
            ], () => {
                GameState.setFlag('introSeen')

                this.cutsceneTitle.setText('Time to get to work.')
                this.cutsceneTitle.setAlpha(0)

                this.tweens.add({
                    targets: this.cutsceneTitle,
                    alpha: 1,
                    duration: 800,
                    onComplete: () => {
                        this.time.delayedCall(2000, () => {
                            const cont = this.add.text(W / 2, H - 100, '[ Click to begin ]', {
                                fontSize: '22px', fill: '#888888'
                            }).setOrigin(0.5).setAlpha(0)
                                .setInteractive({ useHandCursor: true })

                            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })
                            cont.on('pointerdown', () => {
                                this.cameras.main.fade(500, 0, 0, 0)
                                this.time.delayedCall(500, () => {
                                    this.scene.start('HubScene')
                                })
                            })
                        })
                    }
                })
            })
        })
    }

    // ─── Truth Discovered ──────────────────────────────
    truthDiscoveredCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.showSequence([
            { title: 'The pieces fall into place...', subtitle: '', duration: 2000 },
            { title: 'The research data...', subtitle: 'The attack was perfectly planned.\nEvery guard rotation. Every vault location.', duration: 3000 },
            { title: 'Luvaza\'s words...', subtitle: '"Father had secret meetings\nbefore the attack..."', duration: 3000 },
            { title: 'The Park Cleaner\'s slip...', subtitle: '"The Veridium vaults..."\nHow did he know?', duration: 3000 },
            { title: 'The Trader\'s warning...', subtitle: '"A royal seal.\nTwo weeks before the attack."', duration: 3000 },
            { title: 'The truth...', subtitle: 'The attack was orchestrated.\nTo extract the Veridium.', duration: 3000 },
            { title: 'Someone at the very top.', subtitle: 'Someone with royal authority.', duration: 3500 },
            { title: 'I need to tell the King.', subtitle: '...even if I\'m not sure I can trust him.', duration: 3000 }
        ], () => {
            if (this.isSkipping) return
            GameState.setFlag('learnedTruth')

            const cont = this.add.text(W / 2, H - 100, '[ Click to continue ]', {
                fontSize: '22px', fill: '#888888'
            }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })
            cont.on('pointerdown', () => {
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => { this.scene.start('WorkshopScene') })
            })
        })
    }

    // ─── Level 2 Complete ──────────────────────────────
    level2CompleteCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.showSequence([
            { title: 'I told the King.', subtitle: 'But something felt wrong.', duration: 2500 },
            { title: '"That\'s... a serious accusation."', subtitle: 'He wasn\'t shocked.\nHe was... calm.', duration: 3500 },
            { title: 'Too calm.', subtitle: 'Like he already knew.', duration: 2500 },
            { title: 'It was him.', subtitle: 'The King and the Enemy Boss.\nThey planned this together.', duration: 3000 },
            { title: 'The Veridium.', subtitle: 'That\'s what they\'re after.', duration: 3000 },
            { title: 'And Luvaza...', subtitle: 'She doesn\'t know.\nNot yet.', duration: 3000 },
            { title: '⭐ LEVEL 3 UNLOCKED', subtitle: 'The truth is known.\nNow comes the hardest part.', duration: 3500 }
        ], () => {
            if (this.isSkipping) return
            GameState.tryAdvanceLevel()
            GameState.setFlag('enemyTerritoryUnlocked')

            const cont = this.add.text(W / 2, H - 100, '[ Click to continue ]', {
                fontSize: '22px', fill: '#888888'
            }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })
            cont.on('pointerdown', () => {
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => { this.scene.start('HubScene') })
            })
        })
    }

    // ─── Level 3 Intro ─────────────────────────────────
    level3IntroCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.showSequence([
            { title: 'Level 3', subtitle: 'The conspiracy deepens.', duration: 2500 }
        ], () => {
            if (this.isSkipping) return
            const cont = this.add.text(W / 2, H - 100, '[ Click to continue ]', {
                fontSize: '22px', fill: '#888888'
            }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })
            cont.on('pointerdown', () => { this.scene.start('HubScene') })
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── Evening Cutscene (NEW) ────────────────────────
    // Triggered from SecretBaseScene after armor tested
    // Luvaza mishears King + Park Cleaner
    // She confronts them → accident → dies
    // Emergency comms ping → rush to palace
    // ═══════════════════════════════════════════════════
    eveningCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(2000, 0, 0, 0)

        // ─── Opening sequence ──────────────────────────
        this.showSequence([
            { title: '🌙 That evening...', subtitle: '', duration: 2500 },
            { title: 'Palace Gardens', subtitle: 'Luvaza often walked here to think.', duration: 2500 },
            { title: 'Tonight was different.', subtitle: 'She heard voices.', duration: 2000 }
        ], () => {
            if (this.isSkipping) return
            this.cutsceneTitle.setAlpha(0)
            this.cutsceneSubtitle.setAlpha(0)
            this.showLuvazaDiscovery()
        })
    }

    // ─── Luvaza hears King + Park Cleaner ──────────────
    showLuvazaDiscovery() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.eveningDialog = new DialogBox(this)
        this.eveningDialog.show([
            { name: '', text: '── Palace Gardens, Night ──' },
            { name: '', text: 'Luvaza crept toward the voices.' },
            { name: '', text: 'Behind the old fountain.' },
            { name: '', text: 'She recognized her father\'s voice.' },
            { name: '', text: 'And someone else.' },
            { name: '', text: '' },
            { name: '', text: '── What she heard ──' },
            { name: 'King', text: '...the Veridium extraction must be stopped.' },
            { name: 'Park Cleaner', text: '...the boy has been investigating...' },
            { name: 'King', text: '...we need to act before the enemy does.' },
            { name: 'Park Cleaner', text: '...if the enemy finds him first...' },
            { name: 'King', text: '...then we eliminate the threat. Whatever it takes.' },
            { name: 'Park Cleaner', text: '...understood. I\'ll handle the situation.' },
            { name: '', text: '' },
            { name: '', text: '── What they ACTUALLY meant ──' },
            { name: '', text: 'The King wanted to PROTECT the Veridium from enemies.' },
            { name: '', text: '"The boy investigating" = the ENEMY spy in the city.' },
            { name: '', text: '"Eliminate the threat" = stop the ENEMY\'s plan.' },
            { name: '', text: 'The Park Cleaner was a ROYAL AGENT all along.' },
            { name: '', text: '' },
            { name: '', text: '── But Luvaza only heard fragments ──' },
            { name: '', text: 'She thought "the boy" meant the engineer she loved.' },
            { name: '', text: 'She thought "eliminate" meant kill.' },
            { name: '', text: 'She thought her father planned the attack.' },
            { name: '', text: '' },
            { name: '', text: 'She was wrong about everything.' },
            { name: '', text: 'But she didn\'t know that.' },
            { name: '', text: '' },
            { name: 'Luvaza', text: '(whispering) No... father... you can\'t...' },
            { name: 'Luvaza', text: '(whispering) I won\'t let you hurt him.' },
            { name: '', text: '' },
            { name: '', text: 'She didn\'t run.' },
            { name: '', text: 'She walked straight into the throne room.' }
        ], () => {
            this.showConfrontation()
        })
    }

    // ─── The Confrontation ─────────────────────────────
    showConfrontation() {
        this.eveningDialog.show([
            { name: '', text: '── Throne Room ──' },
            { name: '', text: '' },
            { name: 'Luvaza', text: 'FATHER!' },
            { name: 'King', text: 'Luvaza?! What are you doing here?' },
            { name: 'Luvaza', text: 'I HEARD YOU! In the garden!' },
            { name: 'Luvaza', text: 'You\'re going to kill him!' },
            { name: 'King', text: 'What? Kill who? Luvaza—' },
            { name: 'Luvaza', text: 'The engineer! The boy I love!' },
            { name: 'Luvaza', text: 'You said "eliminate the threat"!' },
            { name: 'King', text: 'No! That wasn\'t about him! We meant the enemy—' },
            { name: 'Luvaza', text: 'LIAR!' },
            { name: 'Park Cleaner', text: 'Princess, please listen—' },
            { name: 'Luvaza', text: 'You said you\'d "handle it"!' },
            { name: 'Luvaza', text: 'I won\'t let you touch him!' },
            { name: '', text: '' },
            { name: '', text: 'Luvaza lunged toward the Park Cleaner.' },
            { name: '', text: 'The royal guards reacted on instinct.' },
            { name: '', text: 'One grabbed her arm.' },
            { name: '', text: 'She pulled free—' },
            { name: '', text: 'Lost her balance—' },
            { name: '', text: 'And fell.' },
            { name: '', text: '' },
            { name: '', text: 'Her head hit the marble floor.' },
            { name: '', text: '' },
            { name: '', text: 'The sound echoed through the room.' },
            { name: '', text: '' },
            { name: '', text: '...' },
            { name: '', text: '' },
            { name: '', text: 'Silence.' },
            { name: '', text: '' },
            { name: 'King', text: 'LUVAZA!' },
            { name: '', text: 'The King rushed to her side.' },
            { name: '', text: 'The Park Cleaner stood frozen.' },
            { name: '', text: 'The guards stared at their hands.' },
            { name: '', text: '' },
            { name: '', text: 'She wasn\'t moving.' },
            { name: '', text: '' },
            { name: 'King', text: 'No... my little girl... no...' },
            { name: 'Park Cleaner', text: '...she wasn\'t supposed to be here...' },
            { name: '', text: '' },
            { name: '', text: 'The comms device in her pocket lit up.' },
            { name: '', text: 'One automatic emergency signal.' },
            { name: '', text: 'Sent to the only contact saved.' },
            { name: '', text: '' },
            { name: '', text: 'Your name on the screen.' }
        ], () => {
            GameState.setFlag('gfDead')
            GameState.setFlag('luvazaVisitedPark')
            GameState.setFlag('gfHeardConversation')
            this.showCommsAlert()
        })
    }

    // ─── Comms Alert ───────────────────────────────────
    showCommsAlert() {
        this.eveningDialog.show([
            { name: '', text: '── Your Workshop ──' },
            { name: '', text: '' },
            { name: '', text: 'You were resting after the armor test...' },
            { name: '', text: '' },
            { name: '', text: '📡 *BUZZ BUZZ BUZZ*' },
            { name: '', text: '' },
            { name: '', text: 'The comms channel crackles.' },
            { name: '', text: 'No voice.' },
            { name: '', text: 'Just static.' },
            { name: '', text: 'And a location ping.' },
            { name: '', text: '' },
            { name: '', text: '📡 LOCATION: ROYAL PALACE' },
            { name: '', text: '📡 SIGNAL: LUVAZA\'S DEVICE' },
            { name: '', text: '📡 STATUS: EMERGENCY' },
            { name: '', text: '' },
            { name: 'You', text: '...' },
            { name: 'You', text: 'Luvaza.' },
            { name: 'You', text: 'Something happened.' },
            { name: 'You', text: 'Something bad.' },
            { name: '', text: '' },
            { name: 'You', text: 'I have to get to the palace. NOW.' },
            { name: '', text: '' },
            { name: '', text: '⚠️ RUSH TO THE PALACE' }
        ], () => {
            GameState.setFlag('gfCalledComms')
            GameState.setFlag('conspiracyRevealed')
            this.showRushScreen()
        })
    }

    // ─── Rush Screen ───────────────────────────────────
    showRushScreen() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Hide dialog box area ──────────────────────
        this.cutsceneTitle.setAlpha(0)
        this.cutsceneSubtitle.setAlpha(0)

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.95)
            .setDepth(100)

        const rushItems = []
        rushItems.push(overlay)

        const addText = (x, y, text, style) => {
            const t = this.add.text(x, y, text, style)
                .setOrigin(0.5).setDepth(101)
            rushItems.push(t)
            return t
        }

        const urgentText = addText(W / 2, H / 2 - 80, '⚠️ EMERGENCY SIGNAL', {
            fontSize: '48px',
            fill: '#ff0000',
            fontStyle: 'bold'
        })

        this.tweens.add({
            targets: urgentText,
            alpha: { from: 1, to: 0.3 },
            duration: 400,
            yoyo: true,
            repeat: -1
        })

        addText(W / 2, H / 2, 'Luvaza\'s comms sent an emergency ping.', {
            fontSize: '22px',
            fill: '#ffffff'
        })

        addText(W / 2, H / 2 + 45, 'Location: Royal Palace. No voice. Just static.', {
            fontSize: '20px',
            fill: '#ff8888'
        })

        addText(W / 2, H / 2 + 85, 'Something is very wrong.', {
            fontSize: '22px',
            fill: '#ff4444',
            fontStyle: 'italic'
        })

        const goBtn = addText(W / 2, H / 2 + 180, '[ RUSH TO PALACE ]', {
            fontSize: '30px',
            fill: '#ff0000',
            fontStyle: 'bold'
        })
        goBtn.setInteractive({ useHandCursor: true })

        goBtn.on('pointerover', () => goBtn.setStyle({ fill: '#ffffff' }))
        goBtn.on('pointerout', () => goBtn.setStyle({ fill: '#ff0000' }))
        goBtn.on('pointerdown', () => {
            rushItems.forEach(item => {
                if (item && item.active) item.destroy()
            })
            this.cameras.main.fade(800, 0, 0, 0)
            this.time.delayedCall(800, () => {
                this.scene.start('Level3PalaceScene')
            })
        })
    }

    // ─── GF Death ──────────────────────────────────────
    gfDeathCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(2000, 0, 0, 0)

        this.showSequence([
            { title: '', subtitle: '', duration: 1000 },
            { title: 'She\'s gone.', subtitle: '', duration: 3000 },
            { title: 'Luvaza...', subtitle: 'She tried to save the one she loved.', duration: 3500 },
            { title: 'Based on words she only half heard.', subtitle: 'A conversation she didn\'t fully understand.', duration: 4000 },
            { title: 'No one planned her death.', subtitle: 'No one wanted it.', duration: 3500 },
            { title: 'The cruelest tragedies...', subtitle: '...are the ones that didn\'t need to happen.', duration: 3500 },
            { title: 'The real enemy is still out there.', subtitle: 'Whoever truly attacked this city\nis still planning.', duration: 4000 },
            { title: '⚔️ LEVEL 4 UNLOCKED', subtitle: 'Find the True Enemy.', duration: 4000 }
        ], () => {
            if (this.isSkipping) return
            GameState.tryAdvanceLevel()

            const cont = this.add.text(W / 2, H - 100, '[ Click to continue ]', {
                fontSize: '22px', fill: '#ff4444'
            }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })
            cont.on('pointerdown', () => {
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => { this.scene.start('HubScene') })
            })
        })
    }

    // ─── Game Over ─────────────────────────────────────
    gameOverCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.showSequence([
            { title: 'Time has run out.', subtitle: '', duration: 2500 },
            { title: 'The crisis consumed the city.', subtitle: 'You couldn\'t save everyone.', duration: 3000 },
            { title: 'GAME OVER', subtitle: 'The city falls into darkness.', duration: 3500 }
        ], () => {
            if (this.isSkipping) return
            const cont = this.add.text(W / 2, H - 100, '[ Click to restart ]', {
                fontSize: '22px', fill: '#ff4444'
            }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })
            cont.on('pointerdown', () => { location.reload() })
        })
    }

    // ─── Default ───────────────────────────────────────
    defaultCutscene() {
        this.cutsceneTitle.setText('[ CUTSCENE ]')
        this.cutsceneSubtitle.setText('Coming soon...')
    }
}