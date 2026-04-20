export default class DialogBox {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.isClosed = false;
    this.dialogQueue = [];
    this.currentIndex = 0;
    this.onComplete = null;
    this.history = [];
    this.historyVisible = false;  // ← FIXED: Initialize here

    // Elements
    this.boxGraphics = null;
    this.topLine = null;
    this.bottomLine = null;
    this.nameText = null;
    this.dialogText = null;
    this.pageText = null;
    this.backBtn = null;
    this.nextBtn = null;
    this.skipBtn = null;
    this.historyBtn = null;
    this.hintText = null;

    // ← FIXED: Keyboard listener stored so we can remove it
    this.spaceKey = null;
  }

  show(lines, onComplete = null) {
    // ← FIXED: Guard against empty lines
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    this.dialogQueue = lines;
    this.currentIndex = 0;
    this.isActive = true;
    this.isClosed = false;
    this.onComplete = onComplete;
    this.history = [...this.history, ...lines];
    this.createBox();
    this.showLine();

    // ← FIXED: Add SPACE key listener
    this.spaceKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.spaceKey.on('down', () => {
      if (this.isActive && !this.isClosed && !this.historyVisible) {
        this.next();
      }
    });
  }

  createBox() {
    const W = this.scene.cameras.main.width;
    const H = this.scene.cameras.main.height;

    const OFFSET = 50;
    const BOX_WIDTH = 1920;
    const BOX_HEIGHT = 200;
    const FADE_WIDTH = 200;
    const OPACITY = 0.85;
    const FONT_FAMILY = "'Share Tech Mono', monospace";

    const boxY = H - BOX_HEIGHT / 2 - OFFSET;
    const boxX = W / 2;

    // Graphics
    this.boxGraphics = this.scene.add.graphics()
      .setDepth(100).setScrollFactor(0);

    // Left fade
    this.boxGraphics.fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,
      0, OPACITY, 0, OPACITY
    );
    this.boxGraphics.fillRect(
      boxX - BOX_WIDTH / 2, boxY - BOX_HEIGHT / 2,
      FADE_WIDTH, BOX_HEIGHT
    );

    // Center solid
    this.boxGraphics.fillStyle(0x000000, OPACITY);
    this.boxGraphics.fillRect(
      boxX - BOX_WIDTH / 2 + FADE_WIDTH, boxY - BOX_HEIGHT / 2,
      BOX_WIDTH - FADE_WIDTH * 2, BOX_HEIGHT
    );

    // Right fade
    this.boxGraphics.fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,
      OPACITY, 0, OPACITY, 0
    );
    this.boxGraphics.fillRect(
      boxX + BOX_WIDTH / 2 - FADE_WIDTH, boxY - BOX_HEIGHT / 2,
      FADE_WIDTH, BOX_HEIGHT
    );

    // Decorative lines
    this.topLine = this.scene.add.rectangle(
      boxX, boxY - BOX_HEIGHT / 2 + 1,
      BOX_WIDTH - FADE_WIDTH * 2 - 40, 1,
      0xffffff, 0.1
    ).setDepth(101).setScrollFactor(0);

    this.bottomLine = this.scene.add.rectangle(
      boxX, boxY + BOX_HEIGHT / 2 - 1,
      BOX_WIDTH - FADE_WIDTH * 2 - 40, 1,
      0xffffff, 0.1
    ).setDepth(101).setScrollFactor(0);

    // Name text
    this.nameText = this.scene.add.text(
      boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30,
      boxY - BOX_HEIGHT / 2 + 12, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      fill: '#00ff88',
      fontStyle: 'bold'
    }).setDepth(102).setScrollFactor(0);

    // Dialog text
    this.dialogText = this.scene.add.text(
      boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30,
      boxY - 15, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      fill: '#ffffff',
      wordWrap: { width: BOX_WIDTH - FADE_WIDTH * 2 - 80 }
    }).setDepth(102).setScrollFactor(0);

    // Page counter
    this.pageText = this.scene.add.text(
      boxX + BOX_WIDTH / 2 - FADE_WIDTH - 30,
      boxY - BOX_HEIGHT / 2 + 12, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      fill: '#555555'
    }).setOrigin(1, 0).setDepth(102).setScrollFactor(0);

    // Buttons
    const btnY = boxY + BOX_HEIGHT / 2 - 22;
    const btnStyle = { fontFamily: FONT_FAMILY, fontSize: '14px', fill: '#888888' };
    const contentLeft = boxX - BOX_WIDTH / 2 + FADE_WIDTH + 30;
    const contentRight = boxX + BOX_WIDTH / 2 - FADE_WIDTH - 30;

    // Back button
    this.backBtn = this.scene.add.text(contentLeft, btnY, '◀ Back', btnStyle)
      .setDepth(102).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.backBtn.on('pointerover', () => this.backBtn.setFill('#ffffff'));
    this.backBtn.on('pointerout', () => this.backBtn.setFill('#888888'));
    this.backBtn.on('pointerdown', () => {
      if (!this.isClosed) this.prev();  // ← FIXED: Guard
    });

    // Next button
    this.nextBtn = this.scene.add.text(boxX, btnY, 'Next ▶', btnStyle)
      .setOrigin(0.5, 0).setDepth(102).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.nextBtn.on('pointerover', () => this.nextBtn.setFill('#555555'));
    this.nextBtn.on('pointerout', () => this.nextBtn.setFill('#888888'));
    this.nextBtn.on('pointerdown', () => {
      if (!this.isClosed) this.next();  // ← FIXED: Guard
    });

    // Skip button
    this.skipBtn = this.scene.add.text(contentRight - 80, btnY, 'Skip ⏭', btnStyle)
      .setDepth(102).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.skipBtn.on('pointerover', () => this.skipBtn.setFill('#ff4444'));
    this.skipBtn.on('pointerout', () => this.skipBtn.setFill('#888888'));
    this.skipBtn.on('pointerdown', () => {
      if (!this.isClosed) this.skip();  // ← FIXED: Guard
    });

    // History button
    this.historyBtn = this.scene.add.text(contentRight, btnY - 30, '📜 Log', btnStyle)
      .setOrigin(1, 0).setDepth(102).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.historyBtn.on('pointerover', () => this.historyBtn.setFill('#ffaa00'));
    this.historyBtn.on('pointerout', () => this.historyBtn.setFill('#888888'));
    this.historyBtn.on('pointerdown', () => {
      if (!this.isClosed) this.showHistory();  // ← FIXED: Guard
    });

    // Space hint
    this.hintText = this.scene.add.text(boxX, btnY, '[SPACE]', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      fill: '#333333'
    }).setOrigin(0.5, 0).setDepth(101).setScrollFactor(0);

    // Entrance animation
    this.getAllElements().forEach(el => el.setAlpha(0));

    this.scene.tweens.add({
      targets: this.getAllElements(),
      alpha: 1,
      duration: 200,
      ease: 'Sine.easeOut'
    });
  }

  // ← FIXED: Helper to get all elements (avoids repetition)
  getAllElements() {
    return [
      this.boxGraphics, this.topLine, this.bottomLine,
      this.nameText, this.dialogText, this.pageText,
      this.backBtn, this.nextBtn, this.skipBtn,
      this.historyBtn, this.hintText
    ].filter(el => el !== null && el !== undefined);
  }

  showLine() {
    if (this.isClosed) return;
    if (!this.dialogText || !this.nameText || !this.pageText || !this.backBtn) return;

    // ← FIXED: Guard against out-of-bounds index
    if (this.currentIndex < 0 || this.currentIndex >= this.dialogQueue.length) return;

    const line = this.dialogQueue[this.currentIndex];

    // ← FIXED: Guard against malformed line
    if (!line) return;

    const nameColors = {
      'You': '#00ff88',
      'Luvaza': '#ff69b4',
      'King': '#ffdd00',
      'Trader': '#ff8800',
      'Park Cleaner': '#44ff44',
      'Luvaza (recording)': '#ff69b4'
    };

    const nameColor = nameColors[line.name] || '#aaaaaa';
    this.nameText.setFill(nameColor);
    this.nameText.setText(line.name || '');
    this.dialogText.setText(line.text || '');
    this.pageText.setText(`${this.currentIndex + 1} / ${this.dialogQueue.length}`);

    // ← FIXED: Update next button text on last line
    if (this.currentIndex === this.dialogQueue.length - 1) {
      this.nextBtn.setText('Close ✓');
      this.nextBtn.setFill('#44ff88');
    } else {
      this.nextBtn.setText('Next ▶');
      this.nextBtn.setFill('#888888');
    }

    this.backBtn.setAlpha(this.currentIndex === 0 ? 0.3 : 1);
  }

  next() {
    if (this.isClosed) return false;
    if (!this.isActive) return false;

    this.currentIndex++;

    if (this.currentIndex >= this.dialogQueue.length) {
      this.close();
      return false;
    }

    this.showLine();
    return true;
  }

  prev() {
    if (this.isClosed) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.showLine();
    }
  }

  skip() {
    if (this.isClosed) return;
    this.close();
  }

  // ========== HISTORY ==========
  showHistory() {
    if (this.historyVisible) {
      this.hideHistory();
      return;
    }

    this.historyVisible = true;

    const W = this.scene.cameras.main.width;
    const H = this.scene.cameras.main.height;

    this.histOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(200).setInteractive();

    this.histGraphics = this.scene.add.graphics()
      .setDepth(201).setScrollFactor(0);

    const panelW = 1920;
    const panelH = 1080;
    const panelFade = 100;

    this.histGraphics.fillGradientStyle(0x111122, 0x111122, 0x111122, 0x111122, 0, 0.95, 0, 0.95);
    this.histGraphics.fillRect(W / 2 - panelW / 2, H / 2 - panelH / 2, panelFade, panelH);

    this.histGraphics.fillStyle(0x111122, 0.95);
    this.histGraphics.fillRect(W / 2 - panelW / 2 + panelFade, H / 2 - panelH / 2, panelW - panelFade * 2, panelH);

    this.histGraphics.fillGradientStyle(0x111122, 0x111122, 0x111122, 0x111122, 0.95, 0, 0.95, 0);
    this.histGraphics.fillRect(W / 2 + panelW / 2 - panelFade, H / 2 - panelH / 2, panelFade, panelH);

    this.histTopLine = this.scene.add.rectangle(
      W / 2, H / 2 - panelH / 2 + 1, panelW - panelFade * 2 - 40, 1, 0xffaa00, 0.2
    ).setScrollFactor(0).setDepth(202);

    this.histBottomLine = this.scene.add.rectangle(
      W / 2, H / 2 + panelH / 2 - 1, panelW - panelFade * 2 - 40, 1, 0xffaa00, 0.2
    ).setScrollFactor(0).setDepth(202);

    this.histTitle = this.scene.add.text(W / 2, H / 2 - 270, '📜 Dialog History', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      fill: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    this.histItems = [];

    const startIndex = Math.max(0, this.history.length - 12);
    const recentHistory = this.history.slice(startIndex);

    const nameColors = {
      'You': '#00ff88',
      'Luvaza': '#ff69b4',
      'King': '#ffdd00',
      'Trader': '#ff8800',
      'Park Cleaner': '#44ff44',
      'Luvaza (recording)': '#ff69b4'
    };

    recentHistory.forEach((line, i) => {
      if (!line) return;  // ← FIXED: Guard
      const nameColor = nameColors[line.name] || '#aaaaaa';

      const nameText = this.scene.add.text(
        W / 2 - 310, H / 2 - 220 + (i * 38),
        `${line.name || '...'}:`, {
        fontFamily: 'Courier, monospace',
        fontSize: '14px',
        fill: nameColor,
        fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(202);

      const lineText = this.scene.add.text(
        W / 2 - 200, H / 2 - 220 + (i * 38),
        line.text || '', {
        fontFamily: 'Courier, monospace',
        fontSize: '14px',
        fill: '#cccccc',
        wordWrap: { width: 480 }
      }).setScrollFactor(0).setDepth(202);

      this.histItems.push(nameText, lineText);
    });

    if (this.history.length > 12) {
      const scrollHint = this.scene.add.text(W / 2, H / 2 + 250,
        `Showing last 12 of ${this.history.length} entries`, {
        fontFamily: 'Courier, monospace',
        fontSize: '13px',
        fill: '#555555'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
      this.histItems.push(scrollHint);
    }

    this.histClose = this.scene.add.text(W / 2, H / 2 + 280, '[ Close ]', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      fill: '#888888'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202)
      .setInteractive({ useHandCursor: true });

    this.histClose.on('pointerover', () => this.histClose.setFill('#ffffff'));
    this.histClose.on('pointerout', () => this.histClose.setFill('#888888'));
    this.histClose.on('pointerdown', () => this.hideHistory());
    this.histOverlay.on('pointerdown', () => this.hideHistory());
  }

  hideHistory() {
    this.historyVisible = false;
    if (this.histOverlay) { this.histOverlay.destroy(); this.histOverlay = null; }
    if (this.histGraphics) { this.histGraphics.destroy(); this.histGraphics = null; }
    if (this.histTopLine) { this.histTopLine.destroy(); this.histTopLine = null; }
    if (this.histBottomLine) { this.histBottomLine.destroy(); this.histBottomLine = null; }
    if (this.histTitle) { this.histTitle.destroy(); this.histTitle = null; }
    if (this.histClose) { this.histClose.destroy(); this.histClose = null; }
    if (this.histItems) {
      this.histItems.forEach(i => { if (i) i.destroy(); });
      this.histItems = [];
    }
  }

  // ========== CLOSE ==========
  close() {
    if (this.isClosed) return;  // ← FIXED: Prevent double close

    this.isActive = false;
    this.isClosed = true;

    // ← FIXED: Remove SPACE key listener
    if (this.spaceKey) {
      this.spaceKey.removeAllListeners();
      this.spaceKey = null;
    }

    // ← FIXED: Hide history if open before closing
    if (this.historyVisible) {
      this.hideHistory();
    }

    const elements = this.getAllElements();

    if (elements.length === 0) {
      // ← FIXED: If no elements, just fire onComplete
      this.fireOnComplete();
      return;
    }

    this.scene.tweens.add({
      targets: elements,
      alpha: 0,
      duration: 150,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.destroyElements();
      }
    });
  }

  // ← FIXED: Separate onComplete firing to avoid double calls
  fireOnComplete() {
    if (this.onComplete) {
      const cb = this.onComplete;
      this.onComplete = null;  // ← Clear first to prevent double call
      cb();
    }
  }

  destroyElements() {
    const elements = {
      boxGraphics: this.boxGraphics,
      topLine: this.topLine,
      bottomLine: this.bottomLine,
      nameText: this.nameText,
      dialogText: this.dialogText,
      hintText: this.hintText,
      backBtn: this.backBtn,
      nextBtn: this.nextBtn,
      skipBtn: this.skipBtn,
      historyBtn: this.historyBtn,
      pageText: this.pageText
    };

    // Destroy all
    Object.values(elements).forEach(el => {
      if (el) el.destroy();
    });

    // Null all
    this.boxGraphics = null;
    this.topLine = null;
    this.bottomLine = null;
    this.nameText = null;
    this.dialogText = null;
    this.hintText = null;
    this.backBtn = null;
    this.nextBtn = null;
    this.skipBtn = null;
    this.historyBtn = null;
    this.pageText = null;

    this.fireOnComplete();
  }
}