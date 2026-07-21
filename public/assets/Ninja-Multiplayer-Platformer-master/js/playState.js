'use strict';

// =============================================================================
// Play state
// =============================================================================
const keyStates = {};
let keyCollected = false;
var leftSideDown;
var jumpVar = true;
var leftSideVar = true;
var rightSideVar = true;

window.frameCounter = 0;

function logCurrentStateCoin(game, coin) {
  // Log Current Game State of Collected Coins
  for (const value of window.globalLevelState.coinCache.coins) {
    if (coin.x === value.x) {
      window.globalLevelState.coinCache.coins.splice(window.globalLevelState.coinCache.coins.indexOf(value), 1);
      // console.log(value)
    }
  }
  window.fireCoins();
  // console.log(window.globalLevelState.coinCache.coins)
}

function handleKeyMessages() {
  const earlyMessages = [];
  const lateMessages = [];
  window.keyMessages.forEach((messageEvent) => {
    if (window.globalOtherHeros) { // If player exists
      if (messageEvent.channel === window.currentChannelName) { // If the messages channel is equal to your current channel
        if (!window.globalOtherHeros.has(messageEvent.message.uuid)) { // If the message isn't equal to your uuid
          window.globalGameState._addOtherCharacter(messageEvent.message.uuid); // Add another player to the game that is not yourself

          const otherplayer = window.globalOtherHeros.get(messageEvent.message.uuid);
          otherplayer.position.set(messageEvent.message.position.x, messageEvent.message.position.y); // set the position of each player according to x y
          otherplayer.initialRemoteFrame = messageEvent.message.frameCounter;
          otherplayer.initialLocalFrame = window.frameCounter;
          window.sendKeyMessage({}); // Send publish to all clients about user information
        }
        if (messageEvent.message.position && window.globalOtherHeros.has(messageEvent.message.uuid)) { // If the message contains the position of the player and the player has a uuid that matches with one in the level
          window.keyMessages.push(messageEvent);
          const otherplayer = window.globalOtherHeros.get(messageEvent.message.uuid);
          const frameDelta = messageEvent.message.frameCounter - otherplayer.lastKeyFrame;
          const initDelta = otherplayer.initialRemoteFrame - otherplayer.initialLocalFrame;
          const frameDelay = (messageEvent.message.frameCounter - window.frameCounter) - initDelta + window.syncOtherPlayerFrameDelay;

          /*console.log({
            lastKeyFrame: otherplayer.lastKeyFrame,
            frameCounter: messageEvent.message.frameCounter,
            frameDelta,
            rf_lf: otherplayer.initialRemoteFrame - otherplayer.initialLocalFrame,
            frameDelay
          });*/

          if (frameDelay > 0) {
            if (!messageEvent.hasOwnProperty('frameDelay')) {
              messageEvent.frameDelay = frameDelay;
              otherplayer.totalRecvedFrameDelay += frameDelay;
              otherplayer.totalRecvedFrames++;
            //console.log('avgFrameDelay', otherplayer.totalRecvedFrameDelay / otherplayer.totalRecvedFrames);
            }
            earlyMessages.push(messageEvent);
            //console.log('initDelta', initDelta, 'early', frameDelay);
            //console.log('early', frameDelay);
            return;
          } else if (messageEvent.message.keyMessage.stopped === 'not moving') {
            //console.log('initDelta', initDelta, 'stopping player');
            otherplayer.body.position.set(messageEvent.message.position.x, messageEvent.message.position.y);
            otherplayer.body.velocity.set(0, 0);
            otherplayer.goingLeft = false;
            otherplayer.goingRight = false;
            if (otherplayer.totalRecvedFrames > 0) {
              const avgFrameDelay = otherplayer.totalRecvedFrameDelay / otherplayer.totalRecvedFrames;
              const floorFrameDelay = Math.floor(avgFrameDelay);
            //console.log('otherplayer.initialRemoteFrame before', otherplayer.initialRemoteFrame);
              otherplayer.initialRemoteFrame += floorFrameDelay - 7;
            //console.log('otherplayer.initialRemoteFrame after', otherplayer.initialRemoteFrame);
              //console.log('avg frame delay', avgFrameDelay, 'adjusting delta', floorFrameDelay);
            }
            otherplayer.totalRecvedFrameDelay = 0;
            otherplayer.totalRecvedFrames = 0;
          } else if (frameDelay < 0) {
            otherplayer.totalRecvedFrameDelay += frameDelay;
            otherplayer.totalRecvedFrames++;
            lateMessages.push(messageEvent);
            //console.log('initDelta', initDelta, 'late', frameDelay);
            return;
          } else {
          //console.log('initDelta', initDelta, 'ontime', frameDelay);
          }

          otherplayer.lastKeyFrame = messageEvent.message.frameCounter;
          // otherplayer.position.set(messageEvent.message.position.x, messageEvent.message.position.y); // set the position of each player according to x y
          // if(otherplayer.position.y >525){ //If the physics pushes a player through the ground, and a message is receieved at a y less than 525, adjust the players position
          //    console.log("glitch")
          //    otherplayer.position.set(otherplayer.position.x, otherplayer.position + 75)
          // }
          if (messageEvent.message.keyMessage.up === 'down') { // If message equals arrow up, make the player jump with the correct UUID
            otherplayer.jump();
            otherplayer.jumpStart = Date.now();
          } else if (messageEvent.message.keyMessage.up === 'up') {
            otherplayer.jumpStart = 0;
          }
          if (messageEvent.message.keyMessage.left === 'down') { // If message equals arrow left, make the player move left with the correct UUID
            otherplayer.goingLeft = true;
          } else if (messageEvent.message.keyMessage.left === 'up') {
            otherplayer.goingLeft = false;
          }
          if (messageEvent.message.keyMessage.right === 'down') { // If message equals arrow down, make the player move right with the correct UUID
            otherplayer.goingRight = true;
          } else if (messageEvent.message.keyMessage.right === 'up') {
            otherplayer.goingRight = false;
          }
        }
      }
    }
  });

  if (lateMessages.length > 0) {
  //console.log({ lateMessages, earlyMessages });
  }
  window.keyMessages.length = 0;
  earlyMessages.forEach((em) => {
    window.keyMessages.push(em);
  });
}

window.PlayState = {
  init(data) {
    this.keys = this.game.input.keyboard.addKeys({
      left: window.Phaser.KeyCode.LEFT,
      right: window.Phaser.KeyCode.RIGHT,
      up: window.Phaser.KeyCode.UP
    });
    this.coinPickupCount = 0;
    keyCollected = false;
    this.level = (data.level || 0);
    this.isFinished = false;
    this.spectatorMode = false;
    this._transitioning = false;
    this._finishedTransition = false;
    this.waitingText = null;
    this._touchLeft = false;
    this._touchRight = false;
    this._touchJump = false;
  },

  create() {
    window.globalGameState = this;
    // console.log('window.globalGameState created' , this.level);
    // fade in  (from black)
    this.camera.flash(0x000000, 500);
    // create sound entities
    this.sfx = {
      jump: this.game.add.audio('sfx:jump'),
      coin: this.game.add.audio('sfx:coin'),
      key: this.game.add.audio('sfx:key'),
      stomp: this.game.add.audio('sfx:stomp'),
      door: this.game.add.audio('sfx:door')
    };
    // create level entities and decoration
    this.game.add.image(0, 0, 'background');
    window.textObject1 = this.game.add.text(700, 5, window.text1, { font: 'Bold 200px Arial', fill: '#000000', fontSize: '20px' });
    window.textObject2 = this.game.add.text(700, 35, window.text2, { font: 'Bold 200px Arial', fill: '#000000', fontSize: '20px' });
    window.textObject3 = this.game.add.text(700, 65, window.text3, { font: 'Bold 200px Arial', fill: '#000000', fontSize: '20px' });
    // console.log(window.text);
    if (window.globalLevelState === null) {
      window.globalLevelState = {
        time: 0,
        coinCache: this.game.cache.getJSON(`level:${this.level}`)
      };
    }
    this._loadLevel(window.globalLevelState.coinCache);
    // this._loadLevel(window.globalLevelState.value);
    // create UI score boards
    this._createHud();

    // Set up mobile touch controls (PNG-style arrow buttons)
    try { this._createTouchButtons(); } catch (e) { console.warn('Touch buttons skipped:', e); }

    // Callback invoked by main.js Firebase listener when both players finish
    window.onBothPlayersFinished = () => {
      this._performTransition();
    };
  },

  update() {
    window.frameCounter++;
    this._handleCollisions();
    this._handleInput();
    // update scoreboards
    this.coinFont.text = `x${this.coinPickupCount}`;
    this.keyIcon.frame = keyCollected ? 1 : 0;
  },

  shutdown() {
    window.onBothPlayersFinished = null;
    this._leftBtnBg = null;
    this._leftBtnArrow = null;
    this._rightBtnBg = null;
    this._rightBtnArrow = null;
    if (this.touchGroup) {
      this.touchGroup.destroy();
      this.touchGroup = null;
    }
  },

  _canHeroEnterDoor(hero) {
    return keyCollected && hero.body.touching.down;
  },

  _handleCollisions() {
    for (let i = 0; i < 2; i++) { // prevent collisions for pushing thru
      this.game.physics.arcade.collide(this.hero, this.platforms);
      if (window.globalOtherHeros) { for (const uuid of window.globalOtherHeros.keys()) {
        const otherplayer = window.globalOtherHeros.get(uuid);
        this.game.physics.arcade.collide(otherplayer, this.platforms, null, null, this);
        this.game.physics.arcade.overlap(otherplayer, this.coins, this._onHeroVsCoin, null, this);
        this.game.physics.arcade.overlap(otherplayer, this.key, this._onHeroVsKey, null, this);
        this.game.physics.arcade.overlap(otherplayer, this.door, this._onOtherHeroVsDoor, this._canHeroEnterDoor, this);
      } }
      // hero vs coins (pick up)
      this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
      // hero vs key (pick up)
      this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this);
      // hero vs door (end level)
      this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor, this._canHeroEnterDoor, this);
      // ignore if there is no key or the player is on air
    }
  },

  _handleInput() {
    handleKeyMessages();

    if (this.hero) {
      // Skip local player input in spectator mode but still process remote movement
      if (this.spectatorMode) {
        for (const uuid of window.globalOtherHeros.keys()) {
          const otherplayer = window.globalOtherHeros.get(uuid);
          if (!otherplayer) continue;
          this._moveRemotePlayer(otherplayer);
        }
        // Still update stooped message sync for spectator
        if (window.globalWasHeroMoving && this.hero.body.velocity.x === 0 && this.hero.body.velocity.y === 0 && this.hero.body.touching.down) {
          window.sendKeyMessage({ stopped: 'not moving' });
          window.globalWasHeroMoving = false;
        }
        return;
      }

      // --- Touch controls (mobile) ---
      this._handleTouchInput();

      // --- Keyboard controls ---
      if (this.keys.left.isDown) {
        if (!keyStates.leftIsDown) {
          window.sendKeyMessage({ left: 'down' });
        }
        keyStates.leftIsDown = true;
      } else {
        if (keyStates.leftIsDown) {
          window.sendKeyMessage({ left: 'up' });
        }
        keyStates.leftIsDown = false;
      }

      if (this.keys.right.isDown) {
        if (!keyStates.rightIsDown) {
          window.sendKeyMessage({ right: 'down' });
        }
        keyStates.rightIsDown = true;
      } else {
        if (keyStates.rightIsDown) {
          window.sendKeyMessage({ right: 'up' });
        }
        keyStates.rightIsDown = false;
      }

      if (this.hero.body.touching.down) {
        if (this.keys.up.isDown) {
          if (!keyStates.upIsDown) {
            window.sendKeyMessage({ up: 'down' });
            window.globalMyHero.jump();
          }
          keyStates.upIsDown = true;
        } else {
          if (keyStates.upIsDown) {
            window.sendKeyMessage({ up: 'up' });
          }
          keyStates.upIsDown = false;
        }
      }

      // Move local hero (keyboard OR touch)
      const moveLeft = this.keys.left.isDown || this._touchLeft;
      const moveRight = this.keys.right.isDown || this._touchRight;
      if (moveLeft) {
        this.hero.move(-1);
      } else if (moveRight) {
        this.hero.move(1);
      } else {
        this.hero.move(0);
      }

      // Stopped-message sync
      if (window.globalWasHeroMoving && this.hero.body.velocity.x === 0 && this.hero.body.velocity.y === 0 && this.hero.body.touching.down) {
        window.sendKeyMessage({ stopped: 'not moving' });
        window.globalWasHeroMoving = false;
      } else if (window.globalWasHeroMoving || this.hero.body.velocity.x !== 0 || this.hero.body.velocity.y !== 0 || !this.hero.body.touching.down) {
        window.globalWasHeroMoving = true;
      }

      // Remote player movement
      for (const uuid of window.globalOtherHeros.keys()) {
        const otherplayer = window.globalOtherHeros.get(uuid);
        this._moveRemotePlayer(otherplayer);
      }

      // Update touch button visual feedback
      this._updateTouchButtons();
    }
  },

  _moveRemotePlayer(otherplayer) {
    if (Date.now() + 10 <= otherplayer.jumpStart) {
    }
    if (otherplayer.goingLeft) {
      otherplayer.move(-1);
    } else if (otherplayer.goingRight) {
      otherplayer.move(1);
    } else {
      otherplayer.move(0);
    }
  },

  _createTouchButtons() {
    const isMobile = !this.game.device.desktop || this.game.device.touch;
    if (!isMobile) return;

    this.touchGroup = this.game.add.group();
    this.touchGroup.fixedToCamera = true;

    const btnSize = 56;
    const margin = 16;
    const btnY = this.game.height - btnSize - margin;

    // Create each button as a pair of Graphics objects: bg rect + arrow triangle
    // We create them once and only toggle alpha for visual feedback
    this._createBtn('left', margin, btnY, btnSize, -1);
    this._createBtn('right', margin + btnSize + 12, btnY, btnSize, 1);
  },

  _createBtn(side, x, y, size, direction) {
    // Background rectangle
    const bg = this.game.add.graphics(x, y);
    bg.beginFill(0x000000, 0.35);
    bg.drawRoundedRect(0, 0, size, size, 10);
    bg.endFill();
    this.touchGroup.add(bg);

    // Arrow triangle
    const arrow = this.game.add.graphics(x, y);
    arrow.beginFill(0xffffff, 0.8);
    if (direction < 0) {
      // Left arrow
      arrow.moveTo(size * 0.7, size * 0.15);
      arrow.lineTo(size * 0.2, size * 0.5);
      arrow.lineTo(size * 0.7, size * 0.85);
    } else {
      // Right arrow
      arrow.moveTo(size * 0.3, size * 0.15);
      arrow.lineTo(size * 0.8, size * 0.5);
      arrow.lineTo(size * 0.3, size * 0.85);
    }
    arrow.lineTo(size * 0.7, size * 0.15);
    arrow.endFill();
    this.touchGroup.add(arrow);

    if (side === 'left') {
      this._leftBtnBg = bg;
      this._leftBtnArrow = arrow;
    } else {
      this._rightBtnBg = bg;
      this._rightBtnArrow = arrow;
    }
  },

  _updateTouchButtons() {
    if (!this._leftBtnBg) return;
    this._leftBtnBg.alpha = this._touchLeft ? 0.7 : 0.35;
    if (this._rightBtnBg) {
      this._rightBtnBg.alpha = this._touchRight ? 0.7 : 0.35;
    }
  },

  _handleTouchInput() {
    if (this.game.device.desktop && !this.game.device.touch) return;

    const pointer = this.game.input.activePointer;

    if (!pointer.isDown) {
      if (this._touchLeft) {
        this._touchLeft = false;
        window.sendKeyMessage({ left: 'up' });
      }
      if (this._touchRight) {
        this._touchRight = false;
        window.sendKeyMessage({ right: 'up' });
      }
      if (this._touchJump) {
        this._touchJump = false;
        window.sendKeyMessage({ up: 'up' });
      }
      return;
    }

    const btnSize = 56;
    const margin = 16;
    const btnY = this.game.height - btnSize - margin;
    const x = pointer.x;
    const y = pointer.y;

    const onLeftBtn = x >= margin && x <= margin + btnSize && y >= btnY && y <= btnY + btnSize;
    const onRightBtn = x >= margin + btnSize + 12 && x <= margin + 2 * btnSize + 12 && y >= btnY && y <= btnY + btnSize;

    if (onLeftBtn) {
      if (!this._touchLeft) {
        this._touchLeft = true;
        window.sendKeyMessage({ left: 'down' });
      }
      if (this._touchRight) {
        this._touchRight = false;
        window.sendKeyMessage({ right: 'up' });
      }
      if (this._touchJump) {
        this._touchJump = false;
        window.sendKeyMessage({ up: 'up' });
      }
    } else if (onRightBtn) {
      if (!this._touchRight) {
        this._touchRight = true;
        window.sendKeyMessage({ right: 'down' });
      }
      if (this._touchLeft) {
        this._touchLeft = false;
        window.sendKeyMessage({ left: 'up' });
      }
      if (this._touchJump) {
        this._touchJump = false;
        window.sendKeyMessage({ up: 'up' });
      }
    } else {
      // Only trigger jump on a fresh press (not when sliding off a button)
      if (pointer.justPressed() && !this._touchJump && this.hero && this.hero.body.touching.down) {
        this._touchJump = true;
        window.sendKeyMessage({ up: 'down' });
        window.globalMyHero.jump();
      }
      if (this._touchLeft) {
        this._touchLeft = false;
        window.sendKeyMessage({ left: 'up' });
      }
      if (this._touchRight) {
        this._touchRight = false;
        window.sendKeyMessage({ right: 'up' });
      }
    }
  },

  _onHeroVsKey(hero, key) {
    // this.sfx.key.play();
    this.door.frame = 1;
    key.kill();
    keyCollected = true;
    window.sendKeyMessage({ keyCollected });
  },

  _onHeroVsCoin(hero, coin) {
    // this.sfx.coin.play();
    coin.kill();
    logCurrentStateCoin(this.game, coin);
    this.coinPickupCount++;
  },

  _onHeroVsDoor(hero, door) {
    if (this.isFinished || this._transitioning) return;
    this.isFinished = true;
    door.frame = 1;
    hero.freeze();

    this.game.add.tween(hero)
      .to({ x: this.door.x, alpha: 0 }, 500, null, true)
      .onComplete.addOnce(() => {
        hero.visible = false;
        // Check if there is another player to wait for
        if (window.globalOtherHeros && window.globalOtherHeros.size > 0) {
          window.setPlayerFinished(true);
          this._enterSpectatorMode();
        } else {
          window.setPlayerFinished(true);
          this._performTransition();
        }
      }, this);
  },

  _onOtherHeroVsDoor(hero, door) {
    door.frame = 1;
    hero.freeze();
    this.game.add.tween(hero)
      .to({ x: this.door.x, alpha: 0 }, 500, null, true);
  },

  _enterSpectatorMode() {
    this.spectatorMode = true;
    // Follow the other player with the camera
    if (window.globalOtherHeros && window.globalOtherHeros.size > 0) {
      const otherPlayer = window.globalOtherHeros.values().next().value;
      if (otherPlayer) {
        this.camera.follow(otherPlayer);
      }
    }
    // Show waiting text
    this.waitingText = this.game.add.text(
      this.game.width / 2, this.game.height / 2,
      'Waiting for your partner...',
      { font: '30px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 }
    );
    this.waitingText.anchor.set(0.5);
    this.waitingText.fixedToCamera = true;
  },

  _performTransition() {
    if (this._transitioning) return;
    this._transitioning = true;
    this._finishedTransition = false;
    if (this.waitingText) {
      this.waitingText.destroy();
      this.waitingText = null;
    }

    // Safety timeout: if fade or Firebase hangs, force the transition after 5s
    const safetyTimer = this.game.time.events.add(5000, function () {
      if (!this._finishedTransition) {
        this._forceTransition();
      }
    }, this);

    this.camera.fade(0x000000, 1000);
    this.camera.onFadeComplete.addOnce(function () {
      this.game.time.events.remove(safetyTimer);
      if (this._finishedTransition) return;
      const nextLevel = this.level >= 2 ? 0 : this.level + 1;
      window.resetPlayersFinished(function () {
        if (this._finishedTransition) return;
        this._finishedTransition = true;
        window.globalUnsubscribe();
        window.updateOccupancyCounter = false;
        window.createMyPubNub(nextLevel);
      }.bind(this));
    }, this);
  },

  _forceTransition() {
    if (this._finishedTransition) return;
    this._finishedTransition = true;
    window.globalUnsubscribe();
    window.updateOccupancyCounter = false;
    window.createMyPubNub(this.level >= 2 ? 0 : this.level + 1);
  },

  _loadLevel(data) {
    // console.log(data)
    // create all the groups/layers that we need
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();

    // spawn hero and enemies
    this._spawnCharacters({ hero: data.hero, spiders: data.spiders });

    // spawn level decoration
    data.decoration.forEach(function (deco) {
      this.bgDecoration.add(
        this.game.add.image(deco.x, deco.y, 'decoration', deco.frame));
    }, this);

    // spawn platforms
    data.platforms.forEach(this._spawnPlatform, this);

    // spawn important objects
    data.coins.forEach(this._spawnCoin, this);
    this._spawnKey(data.key.x, data.key.y);
    this._spawnDoor(data.door.x, data.door.y);

    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
  },

  _addOtherCharacter(uuid) {
    // console.log('Added another character to game');
    if (window.globalOtherHeros.has(uuid)) { return; }
    // console.log('_addOtherCharacter', uuid);
    this.hero2 = new window.Hero(this.game, 10, 10);
    this.hero2.lastKeyFrame = 0;
    const playerText = this.game.add.text(this.hero2.position.x - 10, this.hero2.position.y - 550, '', { fill: '#000000', fontSize: '15px' });
    playerText.anchor.set(0.5);
    this.hero2.addChild(playerText);
    this.game.add.existing(this.hero2);
    window.globalOtherHeros.set(uuid, this.hero2);
  },

  _removeOtherCharacter(uuid) {
    if (!window.globalOtherHeros.has(uuid)) { return; }
    window.globalOtherHeros.get(uuid).destroy();
    window.globalOtherHeros.delete(uuid);
  },

  _spawnCharacters(data) {
    this.hero = new window.Hero(this.game, 10, 10);
    this.hero.body.bounce.setTo(0);
    const playerText = this.game.add.text(this.hero.position.x - 10, this.hero.position.y - 550, 'me', { fill: '#000000', fontSize: '15px' });
    playerText.anchor.set(0.5);
    this.hero.addChild(playerText);
    // console.log(playerText.position.x, playerText.position.y);
    window.globalMyHero = this.hero;
    window.globalOtherHeros = this.otherHeros = new Map();
    this.game.add.existing(this.hero);
    // globalMyHero.alpha = 1; //compensating for lag
    window.sendKeyMessage({});
  },

  _spawnPlatform(platform) {
    const sprite = this.platforms.create(platform.x, platform.y, platform.image);
    // physics for platform sprites
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    // console.log("dank", sprite.body.overlapY)
  },

  _spawnCoin(coin) {
    const sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    // physics (so we can detect overlap with the hero)
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    // animations
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
  },

  _spawnKey(x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    // enable physics to detect collisions, so the hero can pick the key up
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;
    // add a small 'up & down' animation via a tween
    this.key.y -= 3;
    this.game.add.tween(this.key)
      .to({ y: this.key.y + 6 }, 800, window.Phaser.Easing.Sinusoidal.InOut)
      .yoyo(true)
      .loop()
      .start();
  },

  _spawnDoor(x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
  },

  _createHud() {
    const NUMBERS_STR = '0123456789X ';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);

    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    const coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
    const coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.add(coinScoreImg);
    this.hud.add(this.keyIcon);
    this.hud.position.set(10, 10);
  }
};
