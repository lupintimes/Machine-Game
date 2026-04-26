import GameState from '../../data/gameState.js';

export default class OscilloscopeGame extends Phaser.Scene {
    constructor() {
        super('OscilloscopeGame');
    }

    preload() {
        this.load.image('osci_bg', 'assets/images/minigame/oscilloscope_bg.webp');
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;


        this.playerFreq = 0.01;
        this.playerAmp = 50;
        this.targetFreq = 0.05;
        this.targetAmp = 80;
        this.isMatching = false;
        this.matchTimer = 0;
        this.failed = false;

        const panelBG = this.add.image(W / 2, H / 2, 'osci_bg').setOrigin(0.5).setDepth(0);

        const panelX = panelBG.x;
        const panelY = panelBG.y;
        const padding = 40;

        const closeX = panelX + (panelBG.width / 2) - padding;
        const closeY = panelY - (panelBG.height / 2) + padding;


        this.screenGraphics = this.add.graphics().setDepth(1);

        this.statusText = this.add.text(W / 2, H / 2 + 260, 'SYNCING...', {
            fontSize: '100px', fill: '#00ff00', fontFamily: "'Orbitron', sans-serif", fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);


        this.resultText = this.add.text(W / 2, H / 2 - 50, '', {
            fontSize: '50px', fill: '#ffffff', fontFamily: "'Orbitron', sans-serif",
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(10).setAlpha(0);


        const closeBtn = this.add.text(closeX, closeY, '✖', {
            fontSize: '40px',
            fill: '#ff4444',
            fontFamily: "'Orbitron', sans-serif",
            padding: { x: 20, y: 20 }
        })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            this.scene.stop('OscilloscopeGame');
            this.scene.resume('WorkshopScene');
        });

        // 4. Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,S,A,D');
    }

    update(time, delta) {
        if (this.failed) return;

        // Handle Input
        if (this.keys.A.isDown) this.playerFreq -= 0.0005;
        if (this.keys.D.isDown) this.playerFreq += 0.0005;
        if (this.keys.W.isDown) this.playerAmp += 1;
        if (this.keys.S.isDown) this.playerAmp -= 1;

        // Clamp values
        this.playerFreq = Phaser.Math.Clamp(this.playerFreq, 0.005, 0.15);
        this.playerAmp = Phaser.Math.Clamp(this.playerAmp, 10, 150);

        this.drawWaves(time);
        this.checkMatch(delta);
    }

    drawWaves(time) {
        this.screenGraphics.clear();
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        const waveWidth = 800;
        const startX = W / 2 - (waveWidth / 2);
        const centerY = H * 0.4;

        // Draw Target Wave (Faded Green)
        this.screenGraphics.lineStyle(2, 0x008800, 0.5);
        this.screenGraphics.beginPath();
        for (let x = 0; x < waveWidth; x++) {
            const y = centerY + Math.sin(x * this.targetFreq) * this.targetAmp;
            if (x === 0) this.screenGraphics.moveTo(startX + x, y);
            else this.screenGraphics.lineTo(startX + x, y);
        }
        this.screenGraphics.strokePath();

        // Draw Player Wave (Bright Green)
        const flicker = Math.sin(time * 0.1) * 2;
        this.screenGraphics.lineStyle(3, 0x55ff55, 1);
        this.screenGraphics.beginPath();
        for (let x = 0; x < waveWidth; x++) {
            const y = centerY + Math.sin((x + time * 0.1) * this.playerFreq) * (this.playerAmp + flicker);
            if (x === 0) this.screenGraphics.moveTo(startX + x, y);
            else this.screenGraphics.lineTo(startX + x, y);
        }
        this.screenGraphics.strokePath();
    }

    checkMatch(delta) {
        if (this.failed) return;

        const freqDiff = Math.abs(this.playerFreq - this.targetFreq);
        const ampDiff = Math.abs(this.playerAmp - this.targetAmp);

        if (freqDiff < 0.005 && ampDiff < 10) {
            this.matchTimer += delta;
            this.statusText.setText(`${Math.round((this.matchTimer / 2000) * 100)}%`);
            this.statusText.setFill('#aaff00');

            if (this.matchTimer >= 2000) {
                this.endGame(true);
            }
        } else {
            this.matchTimer = Math.max(0, this.matchTimer - delta);
            this.statusText.setText('0%');
            this.statusText.setFill('#fc2f13');
        }
    }

    endGame(success) {
        this.failed = true;
        this.screenGraphics.clear();

        this.statusText.setAlpha(0);
        this.resultText.setAlpha(1);

        if (success) {
            this.resultText.setText('✅ Circuit Complete!');
            this.resultText.setFill('#00ff88');

            // ✅ BULLETPROOF FALLBACK (Fixes the import issue)
            // It checks the import first, and if it's empty, it checks window.GameState
            const GS = (typeof GameState !== 'undefined' && GameState.earnMoney)
                ? GameState
                : window.GameState;

            if (GS) {
                GS.earnMoney(1000);
                GS.addSkill('repair', 40);

            } 

        } else {
            this.resultText.setText('❌ Time is up! No reward.');
            this.resultText.setFill('#ff4444');
        }

        this.time.delayedCall(2000, () => {
            this.scene.stop('OscilloscopeGame');
            this.scene.resume('WorkshopScene');
        });
    }
}