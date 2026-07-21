import Phaser from "phaser";

class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
    this.button;
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
  }

  create() {
    this.add.image(400, 300, "sky");
    this.add.text(20, 20, "Menu!", { font: "25px Arial", fill: "yellow" });

    const button = this.add.text(400, 300, "Jogar!", {
      font: "25px Arial",
      fill: "black",
    });
    button.setInteractive().on("pointerdown", () => {
      this.actionOnClick();
    });
  }

  update() {}

  actionOnClick() {
    this.scene.start("playGame");
  }
}

export default menu;
