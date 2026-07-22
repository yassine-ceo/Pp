'use strict';

// =============================================================================
// Loading state
// =============================================================================

window.LoadingState = { // Create an object with all of the loading information inside of it
  init() {
    // keep crispy-looking pixels
    this.game.renderer.renderSession.roundPixels = true; // Make the phaser sprites look smoother
    // Scale config must be set inside a state, not right after game creation (Phaser 2)
    this.game.scale.scaleMode = window.Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;
    this.game.scale.forceOrientation(true, false);
  },

  preload() {
    this.game.stage.disableVisibilityChange = true;

    // Load JSON levels
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');
    this.game.load.json('level:2', 'data/level02.json');
    this.game.load.json('level:3', 'data/level03.json');


    this.game.load.image('font:numbers', 'images/numbers.png');
    this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.image('background', 'images/bg.png');
    this.game.load.image('bg1', 'images/bg1.png');
    this.game.load.image('bg2', 'images/bg2.png');
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    this.game.load.image('key', 'images/key.png');
    this.game.load.image('spider', 'images/spider.png');

    this.game.load.spritesheet('decoration', 'images/decor.png', 42, 42);
    this.game.load.spritesheet('herodude', 'images/hero.png', 36, 42);
    this.game.load.spritesheet('hero', 'images/gameSmall.png', 36, 42);
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);

    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:key', 'audio/key.wav');
    this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
    this.game.load.audio('sfx:door', 'audio/door.wav');
    this.game.load.audio('bgm', ['audio/bgm.mp3', 'audio/bgm.ogg']);
  },

  create() {
    this._createGameTextures();
    console.log('[loadingState] starting play state, level:', window.globalCurrentLevel);
    this.game.state.start('play', true, false, { level: window.globalCurrentLevel }); // Start Game
  },

  _createGameTextures() {
    // Generate crawler bug spritesheet (2 frames, 32x42 each)
    try {
      var bugCanvas = document.createElement('canvas');
      bugCanvas.width = 64; bugCanvas.height = 42;
      var bc = bugCanvas.getContext('2d');

      // Frame 0 (left half) - legs spread
      bc.fillStyle = '#4a2c0d';
      bc.fillRect(6, 16, 20, 14);
      bc.fillRect(10, 12, 12, 20);
      bc.fillStyle = '#2a1a06';
      bc.fillRect(8, 14, 16, 18);
      // Head
      bc.fillStyle = '#3a2008';
      bc.fillRect(10, 10, 12, 8);
      // Eyes
      bc.fillStyle = '#ffffff';
      bc.fillRect(12, 11, 2, 2);
      bc.fillRect(18, 11, 2, 2);
      bc.fillStyle = '#000000';
      bc.fillRect(12, 11, 1, 1);
      bc.fillRect(18, 11, 1, 1);
      // Legs frame 0 - spread wide
      bc.strokeStyle = '#3a1c00';
      bc.lineWidth = 2;
      [-1, 1].forEach(function (side) {
        var baseX = side === -1 ? 10 : 22;
        bc.beginPath(); bc.moveTo(baseX, 26 + side * 2); bc.lineTo(side === -1 ? 0 : 32, 18); bc.stroke();
        bc.beginPath(); bc.moveTo(baseX, 26 + side * 2); bc.lineTo(side === -1 ? 0 : 32, 24); bc.stroke();
        bc.beginPath(); bc.moveTo(baseX, 26 + side * 2); bc.lineTo(side === -1 ? 0 : 32, 30); bc.stroke();
      });

      // Frame 1 (right half) - legs retracted
      bc.fillStyle = '#4a2c0d';
      bc.fillRect(38, 16, 20, 14);
      bc.fillRect(42, 12, 12, 20);
      bc.fillStyle = '#2a1a06';
      bc.fillRect(40, 14, 16, 18);
      bc.fillStyle = '#3a2008';
      bc.fillRect(42, 10, 12, 8);
      bc.fillStyle = '#ffffff';
      bc.fillRect(44, 11, 2, 2);
      bc.fillRect(50, 11, 2, 2);
      bc.fillStyle = '#000000';
      bc.fillRect(44, 11, 1, 1);
      bc.fillRect(50, 11, 1, 1);
      bc.strokeStyle = '#3a1c00';
      bc.lineWidth = 2;
      [-1, 1].forEach(function (side) {
        var baseX = side === -1 ? 42 : 54;
        bc.beginPath(); bc.moveTo(baseX, 24 + side * 4); bc.lineTo(side === -1 ? 34 : 62, 20); bc.stroke();
        bc.beginPath(); bc.moveTo(baseX, 24 + side * 4); bc.lineTo(side === -1 ? 34 : 62, 26); bc.stroke();
        bc.beginPath(); bc.moveTo(baseX, 24 + side * 4); bc.lineTo(side === -1 ? 34 : 62, 32); bc.stroke();
      });

      this.game.cache.addSpriteSheet('crawler', '', bugCanvas, 32, 42);
    } catch (e) {
      console.warn('Failed to generate crawler spritesheet, using fallback:', e);
      this.game.load.image('crawler_0', 'images/spider.png');
    }

    // Generate bomber (bird) - single frame 48x24
    try {
      var birdCanvas = document.createElement('canvas');
      birdCanvas.width = 48; birdCanvas.height = 24;
      var bic = birdCanvas.getContext('2d');
      // Body
      bic.fillStyle = '#2a2a2a';
      bic.beginPath(); bic.ellipse(24, 12, 10, 5, 0, 0, Math.PI * 2); bic.fill();
      // Wings
      bic.fillStyle = '#1a1a1a';
      bic.beginPath(); bic.moveTo(8, 12); bic.lineTo(20, 0); bic.lineTo(20, 24); bic.closePath(); bic.fill();
      bic.beginPath(); bic.moveTo(40, 12); bic.lineTo(28, 0); bic.lineTo(28, 24); bic.closePath(); bic.fill();
      // Head
      bic.fillStyle = '#2a2a2a';
      bic.beginPath(); bic.arc(38, 10, 5, 0, Math.PI * 2); bic.fill();
      // Eye
      bic.fillStyle = '#ffffff';
      bic.fillRect(40, 8, 2, 2);
      bic.fillStyle = '#000000';
      bic.fillRect(40, 8, 1, 1);
      // Beak
      bic.fillStyle = '#cc6600';
      bic.beginPath(); bic.moveTo(44, 9); bic.lineTo(48, 10); bic.lineTo(44, 11); bic.closePath(); bic.fill();
      this.game.cache.addImage('bomber', '', birdCanvas);
    } catch (e) {
      console.warn('Failed to generate bomber:', e);
    }

    // Generate bomb - single frame 16x16
    try {
      var bombCanvas = document.createElement('canvas');
      bombCanvas.width = 16; bombCanvas.height = 16;
      var bomc = bombCanvas.getContext('2d');
      // Bomb body
      bomc.fillStyle = '#222222';
      bomc.beginPath(); bomc.arc(8, 10, 6, 0, Math.PI * 2); bomc.fill();
      bomc.fillStyle = '#111111';
      bomc.beginPath(); bomc.arc(6, 8, 2, 0, Math.PI * 2); bomc.fill();
      // Fuse
      bomc.strokeStyle = '#8B4513';
      bomc.lineWidth = 2;
      bomc.beginPath(); bomc.moveTo(8, 4); bomc.lineTo(10, 1); bomc.stroke();
      // Spark
      bomc.fillStyle = '#ff4400';
      bomc.beginPath(); bomc.arc(10, 0, 2, 0, Math.PI * 2); bomc.fill();
      bomc.fillStyle = '#ffaa00';
      bomc.beginPath(); bomc.arc(10, 0, 1, 0, Math.PI * 2); bomc.fill();
      this.game.cache.addImage('bomb', '', bombCanvas);
    } catch (e) {
      console.warn('Failed to generate bomb:', e);
    }

    // Generate HP pickup (green cross) - single frame 20x20
    try {
      var hpCanvas = document.createElement('canvas');
      hpCanvas.width = 20; hpCanvas.height = 20;
      var hpc = hpCanvas.getContext('2d');
      // Outer glow
      hpc.fillStyle = 'rgba(0, 200, 80, 0.3)';
      hpc.beginPath(); hpc.arc(10, 10, 10, 0, Math.PI * 2); hpc.fill();
      // Cross body
      hpc.fillStyle = '#00cc44';
      hpc.fillRect(3, 7, 14, 6);
      hpc.fillRect(7, 3, 6, 14);
      // White border
      hpc.strokeStyle = '#ffffff';
      hpc.lineWidth = 1;
      hpc.strokeRect(3, 7, 14, 6);
      hpc.strokeRect(7, 3, 6, 14);
      console.log('[textures] HP pickup canvas size:', hpCanvas.width, hpCanvas.height);
      this.game.cache.addImage('hpPickup', '', hpCanvas);
    } catch (e) {
      console.warn('Failed to generate hpPickup:', e);
    }
  }
};
