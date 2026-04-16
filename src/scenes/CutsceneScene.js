export default class CutsceneScene extends Phaser.Scene {
    constructor() {
        super('CutsceneScene')
    }

    init(data) {
        // data passed when launching scene
        this.cutsceneKey = data.key || 'default'
        this.returnScene = data.returnScene || 'HubScene'
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

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

        // ─── Play the cutscene ─────────
        this.playCutscene(this.cutsceneKey)
    }

    playCutscene(key) {
        switch(key) {
            case 'truthDiscovered':
                this.truthDiscoveredCutscene()
                break
            case 'level2Complete':
                this.level2CompleteCutscene()
                break
            case 'level3Intro':
                this.level3IntroCutscene()
                break
            default:
                this.defaultCutscene()
        }
    }

    // ─── Helper to show text sequence ─
    showSequence(sequence, onComplete) {
        let index = 0

        const showNext = () => {
            if (index >= sequence.length) {
                if (onComplete) onComplete()
                return
            }

            const item = sequence[index]
            index++

            // Fade in
            this.cutsceneTitle.setAlpha(0)
            this.cutsceneSubtitle.setAlpha(0)

            this.cutsceneTitle.setText(item.title || '')
            this.cutsceneSubtitle.setText(item.subtitle || '')

            this.tweens.add({
                targets: [this.cutsceneTitle, this.cutsceneSubtitle],
                alpha: 1,
                duration: 800,
                onComplete: () => {
                    // Hold then fade out
                    this.time.delayedCall(item.duration || 2500, () => {
                        this.tweens.add({
                            targets: [this.cutsceneTitle, this.cutsceneSubtitle],
                            alpha: 0,
                            duration: 600,
                            onComplete: showNext
                        })
                    })
                }
            })
        }

        showNext()
    }

    // ─── Truth Discovered Cutscene ─────
    truthDiscoveredCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.showSequence([
            {
                title: 'The pieces fall into place...',
                subtitle: '',
                duration: 2000
            },
            {
                title: 'The research data...',
                subtitle: 'The attack was perfectly planned.\nEvery guard rotation. Every vault location.',
                duration: 3000
            },
            {
                title: 'Luvaza\'s words...',
                subtitle: '"Father had secret meetings\nbefore the attack..."',
                duration: 3000
            },
            {
                title: 'The Park Cleaner\'s slip...',
                subtitle: '"The Veridium vaults..."\nClassified information. How did he know?',
                duration: 3000
            },
            {
                title: 'The Trader\'s warning...',
                subtitle: '"A royal seal.\nTwo weeks before the attack."',
                duration: 3000
            },
            {
                title: 'The truth...',
                subtitle: 'The attack was orchestrated.\nTo extract the Veridium.',
                duration: 3000
            },
            {
                title: 'Someone at the very top.',
                subtitle: 'Someone with royal authority.\nSomeone who had everything to gain.',
                duration: 3500
            },
            {
                title: 'I need to tell the King.',
                subtitle: '...even if I\'m not sure I can trust him.',
                duration: 3000
            }
        ], () => {
            GameState.setFlag('learnedTruth')

            // Show continue button
            const cont = this.add.text(W / 2, H - 100, '[ Click to continue ]', {
                fontSize: '22px',
                fill: '#888888'
            }).setOrigin(0.5).setAlpha(0)
                .setInteractive({ useHandCursor: true })

            this.tweens.add({
                targets: cont,
                alpha: 1,
                duration: 800
            })

            cont.on('pointerdown', () => {
                this.cameras.main.fade(500, 0, 0, 0)
                this.time.delayedCall(500, () => {
                    this.scene.start('WorkshopScene')
                })
            })
        })
    }

    // ─── Level 2 Complete Cutscene ─────
    level2CompleteCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.showSequence([
            {
                title: 'I told the King.',
                subtitle: 'But something felt wrong.',
                duration: 2500
            },
            {
                title: '"That\'s... a serious accusation."',
                subtitle: 'He wasn\'t shocked.\nHe wasn\'t angry.\nHe was... calm.',
                duration: 3500
            },
            {
                title: 'Too calm.',
                subtitle: 'Like he already knew.',
                duration: 2500
            },
            {
                title: 'The meetings before the attack...',
                subtitle: 'The royal seal on the explosives buyer...\nThe Enemy Boss with inside knowledge...',
                duration: 3500
            },
            {
                title: 'It was him.',
                subtitle: 'The King and the Enemy Boss.\nThey planned this together.',
                duration: 3000
            },
            {
                title: 'The Veridium.',
                subtitle: 'A material only found in this city.\nThat\'s what they\'re after.',
                duration: 3000
            },
            {
                title: 'And Luvaza...',
                subtitle: 'She doesn\'t know.\nShe can\'t know.\nNot yet.',
                duration: 3000
            },
            {
                title: '⭐ LEVEL 3 UNLOCKED',
                subtitle: 'The truth is known.\nNow comes the hardest part.',
                duration: 3500
            }
        ], () => {
            GameState.advanceLevel()
            GameState.setFlag('enemyTerritoryUnlocked')

            const cont = this.add.text(W / 2, H - 100, '[ Click to continue ]', {
                fontSize: '22px',
                fill: '#888888'
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

    // ─── Level 3 Intro Cutscene ────────
    level3IntroCutscene() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.showSequence([
            {
                title: 'Level 3',
                subtitle: 'The conspiracy deepens.',
                duration: 2500
            }
        ], () => {
            const cont = this.add.text(W / 2, H - 100, '[ Click to continue ]', {
                fontSize: '22px',
                fill: '#888888'
            }).setOrigin(0.5).setAlpha(0)
                .setInteractive({ useHandCursor: true })

            this.tweens.add({ targets: cont, alpha: 1, duration: 800 })
            cont.on('pointerdown', () => {
                this.scene.start('HubScene')
            })
        })
    }

    // ─── Default ───────────────────────
    defaultCutscene() {
        this.cutsceneTitle.setText('[ CUTSCENE ]')
        this.cutsceneSubtitle.setText('Coming soon...')
    }
}