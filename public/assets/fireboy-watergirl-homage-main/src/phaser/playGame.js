import Phaser from "phaser";
import logoImg from "../assets/logo.png";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:4001";

class playGame extends Phaser.Scene {
  constructor() {
    super({ key: "playGame" });
    this.score = 0;
    this.pass = 0;
    this.id = -1;
    this.playerPos = [this.id, 50, 450];
    this.otherPlayerPos = [this.id, 740, 450];
    this.activeStars = [true, true, true, true, true, true];
    this.gameInfo = [this.id, 50, 450, true, true, true, true, true, true];
    this.gameOver = false;
    this.socket = socketIOClient(ENDPOINT);
  }

  client() {
    const _this = this;
    this.socket.on("FromAPI", (data) => {
      _this.id = data.id;
      _this.otherPlayerPos[1] = data.posX;
      _this.otherPlayerPos[2] = data.posY;
      _this.activeStars[0] = data.star1;
      _this.activeStars[1] = data.star2;
      _this.activeStars[2] = data.star3;
      _this.activeStars[3] = data.star4;
      _this.activeStars[4] = data.star5;
      _this.activeStars[5] = data.star6;
    });
  }

  preload() {
    this.load.image("logo", logoImg);
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");

    this.load.image("door", "assets/door.png");
    this.load.image("danger1", "assets/danger1.png");
    this.load.image("danger2", "assets/danger2.png");

    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    //fundo
    this.add.image(400, 300, "sky");

    //plataformas
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
    this.platforms.create(400, 400, "ground").setScale(0.8, 0.5).refreshBody();
    this.platforms.create(50, 250, "ground").setScale(0.3, 1).refreshBody();
    this.platforms.create(750, 250, "ground").setScale(0.3, 1).refreshBody();
    this.platforms.create(400, 100, "ground").setScale(0.6, 0.5).refreshBody();

    if (this.id === 1) {
      this.playerPos = [1, 740, 450];
    }

    //player1
    this.player = this.physics.add.sprite(
      this.playerPos[1],
      this.playerPos[2],
      "dude"
    );
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);
    this.player.setTint(0x00ffff);

    //player2
    this.player2 = this.physics.add.sprite(
      this.otherPlayerPos[1],
      this.otherPlayerPos[2],
      "dude"
    );
    this.player2.setBounce(0.2);
    this.player2.setCollideWorldBounds(true);
    this.physics.add.collider(this.player2, this.platforms);
    this.player2.setTint(0xff0000);

    //portas
    this.door = this.physics.add.staticGroup();
    this.physics.add.collider(
      this.player,
      this.door,
      this.colideDoor,
      null,
      this
    );
    this.physics.add.collider(
      this.player2,
      this.door,
      this.colideDoor,
      null,
      this
    );
    this.door.create(400, 60, "door").setScale(2).refreshBody();

    //blocos mortais
    this.danger1 = this.physics.add.staticGroup();
    this.physics.add.collider(
      this.player,
      this.danger1,
      this.colideBlock,
      null,
      this
    );
    this.danger1.create(200, 530, "danger1").setScale(0.5, 0.75).refreshBody();
    this.danger1.create(750, 230, "danger1").setScale(0.3, 0.5).refreshBody();

    this.danger2 = this.physics.add.staticGroup();
    this.physics.add.collider(
      this.player2,
      this.danger2,
      this.colideBlock,
      null,
      this
    );
    this.danger2.create(580, 530, "danger2").setScale(0.5, 0.75).refreshBody();
    this.danger2.create(50, 230, "danger2").setScale(0.3, 0.5).refreshBody();

    //animações
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    //estrelas
    this.stars = this.physics.add.group();
    this.stars.create(200, 290, "star");
    this.stars.create(600, 290, "star");
    this.stars.create(70, 100, "star");
    this.stars.create(730, 100, "star");
    this.stars.create(300, 300, "star");
    this.stars.create(500, 300, "star");

    this.stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );

    this.physics.add.overlap(
      this.player2,
      this.stars,
      this.collectStar,
      null,
      this
    );

    //pontuação
    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      fill: "#000",
    });
  }

  update() {
    this.client();

    if (this.id === 0) {
      this.player2.x = this.otherPlayerPos[1];
      this.player2.y = this.otherPlayerPos[2];
    } else if (this.id === 1) {
      this.player.x = this.otherPlayerPos[1];
      this.player.y = this.otherPlayerPos[2];
    }

    //movimentação
    this.cursors = this.input.keyboard.createCursorKeys();

    if (this.cursors.left.isDown && this.id === 0) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown && this.id === 0) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
    } else if (this.id === 0) {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    if (
      this.cursors.up.isDown &&
      this.player.body.touching.down &&
      this.id === 0
    ) {
      this.player.setVelocityY(-330);
    }

    if (this.keyA.isDown && this.id === 1) {
      this.player2.setVelocityX(-160);
      this.player2.anims.play("left", true);
    } else if (this.keyD.isDown && this.id === 1) {
      this.player2.setVelocityX(160);
      this.player2.anims.play("right", true);
    } else if (this.id === 1) {
      this.player2.setVelocityX(0);
      this.player2.anims.play("turn");
    }

    if (this.keyW.isDown && this.player2.body.touching.down && this.id === 1) {
      this.player2.setVelocityY(-330);
    }

    if (this.id != -1) {
      for (let i = 0; i < this.activeStars.length; i++) {
        if (this.activeStars[i] === false) {
          this.stars.children.entries[i].disableBody(true, true);
        }
      }
    }

    if (this.gameOver === false) {
      let score = 0;
      for (let i = 0; i < this.activeStars.length; i++) {
        if (this.activeStars[i] === false) {
          score += 10;
        }
      }
      this.score = score;
      this.scoreText.setText("Score: " + this.score);
    }

    this.emittingProcess();
  }

  collectStar(player, star) {
    for (let i = 0; i < this.stars.children.entries.length; i++) {
      if (this.stars.children.entries[i] === star) {
        this.activeStars[i] = false;
      }
    }
  }

  colideBlock() {
    this.physics.pause();
    this.player.setTint(0xff00ff);
    this.player2.setTint(0xff00ff);
    this.player.anims.play("turn");

    this.gameOver = true;
  }

  colideDoor() {
    if (this.score >= 60) {
      this.gameOver = true;
      this.player.disableBody(true, true);
      this.player2.disableBody(true, true);
      this.scoreText.setText("Parabéns, Player " + (this.id + 1) + "!");
    }
  }

  checkIfArraysAreDifferent(a, b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) {
        return true;
      }
    }
    return false;
  }

  emittingProcess() {
    let gameInfo = [this.id, 50, 450, true, true, true, true, true, true];

    if (this.id === 0) {
      gameInfo = [
        this.id,
        this.player.x,
        this.player.y,
        this.activeStars[0],
        this.activeStars[1],
        this.activeStars[2],
        this.activeStars[3],
        this.activeStars[4],
        this.activeStars[5],
      ];
    } else if (this.id === 1) {
      gameInfo = [
        this.id,
        this.player2.x,
        this.player2.y,
        this.activeStars[0],
        this.activeStars[1],
        this.activeStars[2],
        this.activeStars[3],
        this.activeStars[4],
        this.activeStars[5],
      ];
    }

    if (this.checkIfArraysAreDifferent(this.gameInfo, gameInfo)) {
      this.socket.emit("hey", gameInfo);
    }

    this.gameInfo = gameInfo;
  }
}

export default playGame;
