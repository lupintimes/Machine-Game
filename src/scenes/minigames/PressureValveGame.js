export default class PressureValveGame extends Phaser.Scene {
    constructor() {
        super('PressureValveGame');
    }

    preload() {
        // Replace these paths with your actual asset locations
        this.load.image('gauge_panel_bg', 'assets/images/minigame/gauge_back.png');      // The empty valve frame
        this.load.image('gauge_fill', 'assets/images/minigame/green_fill.png');    // The green liquid/bar
        this.load.image('gauge_panel_overlay', 'assets/images/minigame/gauge_glass.png'); // The highlights/top frame
    }


    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.timeLeft = 20;
        this.failed = false;

        // ─── 1. Background Logic ────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setDepth(0);

        // Main Panel Background
        const panelX = 964.50;
        const panelY = 592.00;
        this.add.image(panelX, panelY, 'gauge_panel_bg').setDepth(1);

        const panelBG = this.add.image(panelX, panelY, 'gauge_panel_bg').setDepth(1);
        const closeX = panelX + (panelBG.width / 2) - 40;
        const closeY = panelY - (panelBG.height / 2) + 40;

        this.createCloseButton(closeX, closeY)

        this.gauges = [];

        // Horizontal offsets for the 4 valves (adjust these to fit your BG slots)
        const xOffsets = [-335, -112, 112, 335];

        xOffsets.forEach((offset, i) => {
            // We pass the absolute design coordinates for the first percentage text
            // and offset the others by the same gap as the valves.
            const textX = 618.00 + (i * 223); // 223 is the gap between xOffsets (-112 - (-335))
            const textY = 421.91;

            this.gauges.push(this.createGaugeLogic(panelX + offset, panelY + 45, textX, textY));
        });

        // ─── 3. Overlay (The Glass) ─────────────
        this.add.image(964.50, 640.00, 'gauge_panel_overlay').setDepth(5);

        // ─── 4. UI ──────────────────────────────
        this.timerText = this.add.text(W / 2 - 95, 362, '20', {
            fontSize: '32px', fill: '#f3a70b', fontStyle: 'bold', fontFamily: "'Orbitron', sans-serif",
        }).setOrigin(0.5).setDepth(10);

        this.time.addEvent({ delay: 1000, callback: this.tickTimer, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 100, callback: this.updateGauges, callbackScope: this, loop: true });
    }

    createCloseButton(x, y) {
        const closeBtn = this.add.text(x, y, '✖', {
            fontSize: '40px',
            fill: '#ff4444',
            fontFamily: "'Orbitron', sans-serif",
            padding: { x: 20, y: 20 }
        })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            this.scene.stop('PressureValveGame');
            this.scene.resume('WorkshopScene');
        });
    }

    createGaugeLogic(x, y, textX, textY) {
        const gauge = {
            x, y,
            value: Phaser.Math.Between(10, 30),
            speed: Phaser.Math.FloatBetween(0.7, 1.8),
            exploded: false
        };

        // Fill Bar
        gauge.bar = this.add.image(x, y + 150, 'gauge_fill')
            .setOrigin(0.5, 1)
            .setDepth(2);

        // Mask
        const maskShape = this.make.graphics();
        maskShape.fillRect(x - 40, y - 100, 80, 250);
        gauge.bar.setMask(maskShape.createGeometryMask());

        // Hitbox for clicking
        const hitArea = this.add.rectangle(x, y, 100, 280, 0xffffff, 0)
            .setInteractive({ useHandCursor: true })
            .setDepth(6);

        hitArea.on('pointerdown', () => {
            if (!gauge.exploded && !this.failed) {
                gauge.value = Math.max(0, gauge.value - 30);

            }
        });

        // Percentage Text at your EXACT requested coordinates
        gauge.valueText = this.add.text(textX + 20, textY + 50, '0%', {
            fontSize: '22px',
            fill: '#000000',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(10);

        return gauge;
    }

    updateGauges() {
        if (this.failed) return;

        this.gauges.forEach(gauge => {
            if (gauge.exploded) return;

            gauge.value = Math.min(gauge.value + gauge.speed, 100);
            gauge.bar.setScale(1, gauge.value / 100);

            // Change color based on pressure
            if (gauge.value < 60) gauge.bar.setTint(0x00ff88);
            else if (gauge.value < 85) gauge.bar.setTint(0xffaa00);
            else {
                gauge.bar.setTint(0xff4444);
                if (Math.random() > 0.9) this.cameras.main.shake(50, 0.002);
            }

            gauge.valueText.setText(`${Math.round(gauge.value)}%`);

            if (gauge.value >= 100) {
                gauge.exploded = true;
                gauge.bar.setTint(0x220000);
                this.add.text(gauge.x, gauge.y, '', { fontSize: '60px' }).setOrigin(0.5).setDepth(15);
                if (this.gauges.every(g => g.exploded)) this.endGame(false);
            }
        });
    }

    tickTimer() {
        if (this.failed) return;
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}`);
        if (this.timeLeft <= 0) this.endGame(true);
    }

    endGame(success) {
        this.failed = true;
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
            success ? "STABILIZED" : "SYSTEM FAILURE",
            { fontSize: '60px', fill: success ? '#00ff88' : '#ff0000', fontStyle: 'bold', fontFamily: "'Orbitron', sans-serif", })
            .setOrigin(0.5).setDepth(20);

        this.time.delayedCall(3000, () => {
            this.scene.stop();
            this.scene.resume('WorkshopScene');
        });
    }
}