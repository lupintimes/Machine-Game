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

        // ─── State ─────────────────────
        this.speedMultiplier = 1
        this.isSkipping = false

        // ─── Controls ──────────────────
        this.enterKey = this.input.keyboard.addKey('ENTER')
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Black background ──────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000)

        // ─── CUTSCENE label ────────────
        this.add.text(W / 2, H / 2 - 100, '[ CUTSCENE ]', {
            fontSize: '28px',
            fill: '#444444',
            fontStyle: 'italic'
        }).setOrigin(0.5)

        // ─── Title ─────────────────────
        this.cutsceneTitle = this.add.text(W / 2, H / 2, '', {
            fontSize: '42px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: W - 200 }
        }).setOrigin(0.5)

        // ─── Subtitle ──────────────────
        this.cutsceneSubtitle = this.add.text(W / 2, H / 2 + 80, '', {
            fontSize: '24px',
            fill: '#aaaaaa',
            align: 'center',
            wordWrap: { width: W - 200 }
        }).setOrigin(0.5)

        // ─── Speed indicator ───────────
        this.speedText = this.add.text(W - 30, 30, '⏩ 1x', {
            fontSize: '16px',
            fill: '#555555'
        }).setOrigin(1, 0).setDepth(500)

        // ─── Control hint (bottom) ─────
        this.add.text(W / 2, H - 30, 'ENTER: Speed Up  |  SPACE: Skip', {
            fontSize: '16px',
            fill: '#555555'
        }).setOrigin(0.5).setDepth(500)

        // ─── Play the cutscene ─────────
        this.playCutscene(this.cutsceneKey)
    }

    update() {
        // ─── Speed up on ENTER ─────────
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.cycleSpeed()
        }

        // ─── SPACE handling ────────────
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (this.introDialog && this.introDialog.isActive) {
                this.introDialog.next()
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
        if (this.cutsceneKey === 'gfDeath') {
            GameState.setFlag('gfDead')
            GameState.setFlag('parkCleanerRevealed')
            GameState.advanceLevel()
        }
    }

    // ─── Skip Cutscene ─────────────────────────────────
    skipCutscene() {
        if (this.isSkipping) return
        this.isSkipping = true

        this.tweens.killAll()

        if (this.cutsceneKey === 'gameIntro') {
            GameState.setFlag('introSeen')
        }
        if (this.cutsceneKey === 'truthDiscovered') {
            GameState.setFlag('learnedTruth')
        }
        if (this.cutsceneKey === 'level2Complete') {
            GameState.setFlag('toldKing')
            GameState.advanceLevel()
            GameState.setFlag('enemyTerritoryUnlocked')
        }

        this.cameras.main.fade(300, 0, 0, 0)
        this.time.delayedCall(300, () => {
            if (this.cutsceneKey === 'gameIntro') {
                this.scene.start('HubScene')
            } else if (this.cutsceneKey === 'truthDiscovered') {
                this.scene.start('WorkshopScene')
            } else if (this.cutsceneKey === 'level2Complete') {
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

            this.add.text(W / 2, 50, '📍 City Entrance', {
                fontSize: '24px',
                fill: '#555555',
                fontStyle: 'italic'
            }).setOrigin(0.5)

            this.add.rectangle(200, 850, 32, 48, 0x00ff88).setDepth(2).setScale(7.25)
            this.add.text(200, 700, 'You', {
                fontSize: '16px', fill: '#00ff88'
            }).setOrigin(0.5).setDepth(3)

            this.add.rectangle(1720, 850, 32, 48, 0xff69b4).setDepth(2).setScale(7.25)
            this.add.text(1720, 700, 'Luvaza', {
                fontSize: '16px', fill: '#ff69b4'
            }).setOrigin(0.5).setDepth(3)

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
            GameState.advanceLevel()
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
    gfDeathCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(2000, 0, 0, 0)

        this.showSequence([
            { title: '', subtitle: '', duration: 1000 },
            { title: 'She\'s gone.', subtitle: '', duration: 3000 },
            { title: 'Luvaza...', subtitle: 'The one person who believed in this city.', duration: 3500 },
            { title: 'Killed by her own father.', subtitle: 'To protect a secret worth more than his daughter\'s life.', duration: 4000 },
            { title: 'The comms device saved her voice.', subtitle: 'Her last words. The proof of everything.', duration: 3500 },
            { title: 'The Park Cleaner is the Enemy Boss.', subtitle: 'He played everyone. Including me.', duration: 3500 },
            { title: 'The King sold his city.', subtitle: 'His people. His daughter. For Veridium.', duration: 3500 },
            { title: 'No more hiding.', subtitle: 'No more investigating.', duration: 2500 },
            { title: 'They will answer for this.', subtitle: '', duration: 3000 },
            { title: '⚔️ LEVEL 4 UNLOCKED', subtitle: 'Revenge. Justice. Whatever it takes.', duration: 4000 }
        ], () => {
            if (this.isSkipping) return
            GameState.advanceLevel()
            GameState.setFlag('parkCleanerRevealed')

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

    // ─── Default ───────────────────────────────────────
    defaultCutscene() {
        this.cutsceneTitle.setText('[ CUTSCENE ]')
        this.cutsceneSubtitle.setText('Coming soon...')
    }
}