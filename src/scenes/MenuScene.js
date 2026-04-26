export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    this.load.image('menu-bg', 'assets/images/menu.webp')
  }

  create() {

    playDynamicMusic(this);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;

    // Full screen background
    this.add.image(centerX, height / 2, "menu-bg").setDisplaySize(width, height);

    // Start button at 3/4 down the screen
    this.createButton(centerX, height * 0.75, 260, 64, "Start Game", () => {
      this.scene.start("HubScene");
    });
  }

  createButton(x, y, width, height, label, onClick) {
    const button = this.add.rectangle(x, y, width, height, 0x000000, 0.9)
      .setStrokeStyle(2, 0xffffff, 0.7);

    this.add.text(x, y, label, {
      fontFamily: "Arial, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5);

    const hitArea = this.add.zone(x, y, width, height).setOrigin(0.5);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on("pointerover", () => {
      button.setFillStyle(0x333333, 1);
      button.setStrokeStyle(2, 0xffffff, 1);
    });

    hitArea.on("pointerout", () => {
      button.setFillStyle(0x000000, 0.9);
      button.setStrokeStyle(2, 0xffffff, 0.7);
    });

    hitArea.on("pointerdown", onClick);

    return { button, hitArea };
  }
}