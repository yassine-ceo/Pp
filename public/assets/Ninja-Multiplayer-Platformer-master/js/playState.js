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
    // HP system (used in level 3)
    this.hp = 100;
    this.maxHp = 100;
    this._bombGroups = [];
  },

  create() {
    window.globalGameState = this;
    // HP system setup for level 3
    if (this.level === 3) {
      this._level3Hp = 100;
    }
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
    this._createBackground();
    if (window.globalLevelState === null) {
      var levelData = this.game.cache.getJSON(`level:${this.level}`);
      if (this.level === 3) {
        levelData = this._generateLevel3Data();
      }
      window.globalLevelState = {
        time: 0,
        coinCache: levelData
      };
    }
    this._loadLevel(window.globalLevelState.coinCache);
    // this._loadLevel(window.globalLevelState.value);
    // create UI score boards
    this._createHud();

    // Mobile touch controls are handled via HTML overlay buttons in index.html
    // (No Phaser-rendered buttons needed)

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
    // update HP bar (level 3)
    this._updateHpBar();
    // update parallax background (level 3)
    if (this.level === 3) {
      this._updateParallax();
      this._checkBirds();
    }
  },

  shutdown() {
    window.onBothPlayersFinished = null;
  },

  _canHeroEnterDoor(hero) {
    return keyCollected && hero.body.touching.down;
  },

  _handleCollisions() {
    var iterations = this.level === 3 ? 4 : 2;
    for (let i = 0; i < iterations; i++) { // prevent collisions for pushing thru
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

      // hero vs spider (death/respawn)
      if (this.spiders) {
        this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsSpider, null, this);
      }

      // Level 3: crawler collision
      if (this.level === 3 && this.crawlers) {
        this.game.physics.arcade.overlap(this.hero, this.crawlers, this._onHeroVsCrawler, null, this);
      }

      // Level 3: bomb collision
      if (this.level === 3 && this.bombs) {
        this.game.physics.arcade.overlap(this.hero, this.bombs, this._onHeroVsBomb, null, this);
        this.game.physics.arcade.collide(this.bombs, this.platforms, this._onBombHitGround, null, this);
      }

      // Level 3: HP pickup collision
      if (this.level === 3 && this.hpPickups) {
        this.game.physics.arcade.overlap(this.hero, this.hpPickups, this._onHeroVsHpPickup, null, this);
      }
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
            this.sfx.jump.play();
          }
          keyStates.upIsDown = true;
        } else {
          if (keyStates.upIsDown) {
            window.sendKeyMessage({ up: 'up' });
          }
          keyStates.upIsDown = false;
        }
      }

      // Move local hero (keyboard OR HTML overlay buttons)
      const moveLeft = this.keys.left.isDown || window._htmlLeft;
      const moveRight = this.keys.right.isDown || window._htmlRight;
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
    // Replaced by HTML overlay buttons in index.html
  },

  _updateTouchButtons() {
    // Replaced by HTML overlay buttons in index.html
    // Visual feedback handled via CSS :active/.active on the HTML buttons
  },

  _handleTouchInput() {
    if (this.game.device.desktop && !this.game.device.touch) return;

    // HTML overlay buttons in index.html handle left/right via window._htmlLeft/_htmlRight.
    // This method only handles jump via canvas tap.
    const pointer = this.game.input.activePointer;

    if (pointer.justPressed() && !this._touchJump && this.hero && this.hero.body.touching.down) {
      this._touchJump = true;
      window.sendKeyMessage({ up: 'down' });
      window.globalMyHero.jump();
      this.sfx.jump.play();
    }

    if (!pointer.isDown) {
      if (this._touchJump) {
        this._touchJump = false;
        window.sendKeyMessage({ up: 'up' });
      }
    }
  },

  _onHeroVsKey(hero, key) {
    this.sfx.key.play();
    this.door.frame = 1;
    key.kill();
    keyCollected = true;
    window.sendKeyMessage({ keyCollected });
  },

  _onHeroVsCoin(hero, coin) {
    this.sfx.coin.play();
    coin.kill();
    logCurrentStateCoin(this.game, coin);
    this.coinPickupCount++;
  },

  _onHeroVsDoor(hero, door) {
    if (this.isFinished || this._transitioning) return;
    this.isFinished = true;
    this.sfx.door.play();
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
    this.sfx.door.play();
    this.game.add.tween(hero)
      .to({ x: this.door.x, alpha: 0 }, 500, null, true)
      .onComplete.addOnce(() => {
        hero.visible = false;
        if (hero.body) hero.body.enable = false;
      }, this);
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
    console.log('[transition] performTransition called, level:', this.level);
    this._transitioning = true;
    this._finishedTransition = false;
    if (this.waitingText) {
      this.waitingText.destroy();
      this.waitingText = null;
    }

    // Safety timeout: if fade or Firebase hangs, force the transition after 5s
    const safetyTimer = this.game.time.events.add(5000, function () {
      if (!this._finishedTransition) {
        console.warn('[transition] safety timer fired, forcing transition');
        this._forceTransition();
      }
    }, this);

    this.camera.fade(0x000000, 1000);
    this.camera.onFadeComplete.addOnce(function () {
      console.log('[transition] camera fade complete');
      this.game.time.events.remove(safetyTimer);
      if (this._finishedTransition) return;
      this._finishedTransition = true;

      const nextLevel = this.level >= 4 ? 0 : this.level + 1;
      console.log('[transition] next level:', nextLevel);

      window.globalUnsubscribe();
      window.updateOccupancyCounter = false;

      window.resetPlayersFinished(function () {
        console.log('[transition] resetPlayersFinished done');
        window.gameStarted = false;
        window.globalLevelState = null;
        window.createMyPubNub(nextLevel);
      });
    }, this);
  },

  _forceTransition() {
    if (this._finishedTransition) return;
    console.warn('[transition] forceTransition, level:', this.level);
    this._finishedTransition = true;
    window.globalUnsubscribe();
    window.updateOccupancyCounter = false;
    window.resetPlayersFinished(function () {
      window.gameStarted = false;
      window.globalLevelState = null;
      window.createMyPubNub(this.level >= 4 ? 0 : this.level + 1);
    }.bind(this));
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

    // Level 3: horizontal side-scroller setup
    if (this.level === 3) {
      // Set world bounds for scrolling
      this.game.world.setBounds(0, 0, 15360, 600);
      this.game.camera.follow(this.hero, window.Phaser.Camera.FOLLOW_PLATFORMER);
      this.camera.deadzone = new window.Phaser.Rectangle(200, 100, 560, 200);

      // Spawn crawlers
      if (data.crawlers && data.crawlers.length > 0) {
        this.crawlers = this.game.add.group();
        data.crawlers.forEach(function (cd) {
          this._spawnCrawler(cd);
        }, this);
      }

      // Spawn bombers
      if (data.bombers && data.bombers.length > 0) {
        this.bombers = this.game.add.group();
        this.bombs = this.game.add.group();
        data.bombers.forEach(function (bd) {
          this._spawnBomber(bd);
        }, this);
      }

      // Spawn HP pickups
      if (data.hpPickups && data.hpPickups.length > 0) {
        this.hpPickups = this.game.add.group();
        data.hpPickups.forEach(function (hd) {
          this._spawnHpPickup(hd);
        }, this);
      }

      // Set hero HP
      this.hero.hp = this._level3Hp || 100;
      this.hero.maxHp = 100;
    } else {
      // Standard spiders for non-level-3
      if (data.spiders && data.spiders.length > 0) {
        this.spiders = this.game.add.group();
        data.spiders.forEach(function (spiderData) {
          this._spawnSpider(spiderData);
        }, this);
      }
    }

    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
  },

  _createBackground() {
    if (this.level === 3) {
      this._createParallaxBackground();
      this._spawnBirds();
      this._createWaterfall();
      return;
    }

    if (this.level === 4) {
      var bg4 = this.game.add.image(0, 0, 'background');
      bg4.width = this.game.width;
      bg4.height = this.game.height;
      return;
    }

    if (this.level === 0) {
      var bg = this.game.add.image(0, 0, 'background');
      bg.width = this.game.width;
      bg.height = this.game.height;
      return;
    }

    if (this.level === 1) {
      var sunset = this.game.add.image(0, 0, 'bg1');
      sunset.width = this.game.width;
      sunset.height = this.game.height;
      var day = this.game.add.image(0, 0, 'background');
      day.width = this.game.width;
      day.height = this.game.height;
      this.game.add.tween(day).to({ alpha: 0 }, 15000, window.Phaser.Easing.Linear.None, true);
      return;
    }

    if (this.level === 2) {
      var night = this.game.add.image(0, 0, 'bg2');
      night.width = this.game.width;
      night.height = this.game.height;
      var sunset2 = this.game.add.image(0, 0, 'bg1');
      sunset2.width = this.game.width;
      sunset2.height = this.game.height;
      this.game.add.tween(sunset2).to({ alpha: 0 }, 15000, window.Phaser.Easing.Linear.None, true);
    }
  },

  _showSpeechBubble(hero, text, msgId) {
    if (!hero) return;
    if (hero._chatMsgId === msgId) return;
    hero._chatMsgId = msgId;

    if (hero._chatBubble) {
      hero._chatBubble.destroy();
      hero._chatBubble = null;
    }
    if (hero._chatBubbleTimer) {
      clearTimeout(hero._chatBubbleTimer);
    }

    var padding = 8;
    var maxWidth = 160;
    var bubbleText = this.game.add.text(0, 0, text, {
      font: '13px Arial', fill: '#ffffff', wordWrap: true, wordWrapWidth: maxWidth
    });
    bubbleText.anchor.set(0.5, 1);

    var bw = Math.min(bubbleText.width + padding * 2, maxWidth + padding * 2);
    var bh = bubbleText.height + padding * 2;

    var bg = this.game.add.graphics(0, 0);
    bg.beginFill(0x000000, 0.85);
    bg.drawRoundedRect(-bw / 2, -bh, bw, bh, 6);
    bg.endFill();
    bg.beginFill(0xffffff, 0.15);
    bg.drawRoundedRect(-bw / 2, -bh, bw, bh, 6);
    bg.endFill();

    var group = this.game.add.group();
    group.add(bg);
    group.add(bubbleText);

    group.y = -80;
    hero.addChild(group);
    hero._chatBubble = group;

    hero._chatBubbleTimer = setTimeout(function () {
      if (hero._chatBubble) {
        hero._chatBubble.destroy();
        hero._chatBubble = null;
      }
      hero._chatMsgId = null;
    }, 5000);
  },

  _showTypingIndicator(hero) {
    if (!hero || hero._typingVisible) return;
    hero._typingVisible = true;

    if (hero._typingText) {
      hero._typingText.destroy();
      hero._typingText = null;
    }
    if (hero._typingBg) {
      hero._typingBg.destroy();
      hero._typingBg = null;
    }

    var dots = this.game.add.text(0, 0, '...', {
      font: 'bold 16px Arial', fill: '#ffffff'
    });
    dots.anchor.set(0.5, 0.5);

    var pillW = dots.width + 16;
    var pillH = dots.height + 8;
    var bg = this.game.add.graphics(0, 0);
    bg.beginFill(0x000000, 0.8);
    bg.drawRoundedRect(-pillW / 2, -pillH / 2, pillW, pillH, 10);
    bg.endFill();

    var group = this.game.add.group();
    group.add(bg);
    group.add(dots);
    group.y = -65;
    hero.addChild(group);
    hero._typingText = group;

    this.game.add.tween(dots)
      .to({ alpha: 0.3 }, 500, null, true)
      .yoyo(true)
      .loop()
      .start();
  },

  _hideTypingIndicator(hero) {
    if (!hero) return;
    hero._typingVisible = false;
    if (hero._typingText) {
      hero._typingText.destroy();
      hero._typingText = null;
    }
  },

  _nameTextStyle() {
    if (this.level === 2) {
      return { fill: '#ffffff', stroke: '#000000', strokeThickness: 3, fontSize: '15px' };
    }
    return { fill: '#000000', stroke: '#ffffff', strokeThickness: 3, fontSize: '15px' };
  },

  _addOtherCharacter(uuid) {
    // console.log('Added another character to game');
    if (window.globalOtherHeros.has(uuid)) { return; }
    // console.log('_addOtherCharacter', uuid);
    this.hero2 = new window.Hero(this.game, 10, 10);
    this.hero2.lastKeyFrame = 0;
    const playerText = this.game.add.text(0, -45, '', this._nameTextStyle());
    playerText.anchor.set(0.5);
    this.hero2.addChild(playerText);
    this.hero2.nameText = playerText;
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
    const playerText = this.game.add.text(0, -45, 'me', this._nameTextStyle());
    playerText.anchor.set(0.5);
    this.hero.addChild(playerText);
    this.hero.nameText = playerText;
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

    // HP bar (level 3 only)
    if (this.level === 3) {
      var barY = 42;
      var barW = 120;
      var barH = 12;
      // Background
      this.hpBarBg = this.game.add.graphics(10, barY);
      this.hpBarBg.beginFill(0x333333, 0.8);
      this.hpBarBg.drawRoundedRect(0, 0, barW, barH, 3);
      this.hpBarBg.endFill();
      // Border
      this.hpBarBg.lineStyle(1, 0xffffff, 0.6);
      this.hpBarBg.drawRoundedRect(0, 0, barW, barH, 3);
      this.hpBarBg.fixedToCamera = true;

      // Fill bar
      this.hpBarFill = this.game.add.graphics(10, barY);
      this.hpBarFill.fixedToCamera = true;
      this._updateHpBar();

      // HP text
      this.hpText = this.game.add.text(10 + barW + 6, barY, 'HP', {
        font: '11px Arial', fill: '#ffffff'
      });
      this.hpText.fixedToCamera = true;
    }
  },

  _updateHpBar() {
    if (!this.hpBarFill || !this.hero) return;
    var barW = 120;
    var barH = 12;
    var ratio = this.hero.hp / this.hero.maxHp;
    this.hpBarFill.clear();
    // Color: green > yellow > red
    var color = ratio > 0.6 ? 0x44cc44 : (ratio > 0.3 ? 0xcccc44 : 0xcc4444);
    this.hpBarFill.beginFill(color, 0.9);
    this.hpBarFill.drawRoundedRect(0, 0, barW * ratio, barH, 3);
    this.hpBarFill.endFill();
  },

  _spawnSpider(spiderData) {
    const spider = this.spiders.create(spiderData.x, spiderData.y, 'spider');
    spider.anchor.setTo(0.5, 0.5);
    this.game.physics.enable(spider);
    spider.body.allowGravity = false;
    spider.body.immovable = true;

    const speed = 60;
    spider.patrolMinX = spiderData.minX;
    spider.patrolMaxX = spiderData.maxX;
    spider.patrolDirection = 1;

    // Create patrol tween - ping-pong between minX and maxX
    const patrolDuration = Math.abs(spider.patrolMaxX - spider.patrolMinX) / speed * 1000;
    const targetX = spider.patrolMaxX;
    spider.patrolTween = this.game.add.tween(spider.body.velocity)
      .to({ x: targetX > spiderData.x ? speed : -speed }, 100)
    spider.body.velocity.x = speed;
    spider.patrolTween = null;

    // Use a timed event for patrol
    spider.patrolTimer = this.game.time.events.loop(patrolDuration, function () {
      spider.patrolDirection *= -1;
      spider.body.velocity.x = speed * spider.patrolDirection;
      spider.scale.x = -spider.patrolDirection;
    }, this);
  },

  _onHeroVsSpider(hero, spider) {
    if (!hero.alive) return;
    hero.alive = false;
    hero.visible = false;
    hero.body.velocity.y = 0;
    hero.body.velocity.x = 0;
    hero.body.allowGravity = false;

    this.game.time.events.add(1000, function () {
      hero.reset(30, 510);
      hero.body.allowGravity = true;
      hero.alive = true;
      hero.visible = true;
    }, this);
  },

  // ===========================================================================
  // Level 3: Crawler enemy
  // ===========================================================================
  _spawnCrawler(data) {
    var crawler = this.crawlers.create(data.x, data.y, 'crawler', 0);
    crawler.anchor.setTo(0.5, 0.5);
    this.game.physics.enable(crawler);
    crawler.body.allowGravity = false;
    crawler.body.immovable = true;

    var speed = data.speed || 50;
    var patrolDuration = Math.abs(data.maxX - data.minX) / speed * 1000;

    // Patrol velocity switching
    crawler.body.velocity.x = speed;
    crawler.patrolDir = 1;
    crawler.patrolTimer = this.game.time.events.loop(patrolDuration, function () {
      crawler.patrolDir *= -1;
      crawler.body.velocity.x = speed * crawler.patrolDir;
      crawler.scale.x = -crawler.patrolDir;
    }, this);

    // 2-frame animation
    crawler.animFrame = 0;
    crawler.animTimer = this.game.time.events.loop(250, function () {
      crawler.animFrame = crawler.animFrame === 0 ? 1 : 0;
      crawler.frame = crawler.animFrame;
    }, this);
  },

  _onHeroVsCrawler(hero, crawler) {
    if (!hero.alive || hero.isInvincible) return;
    hero.takeDamage(15, hero.x < crawler.x ? -1 : 1);
    // Check death
    if (hero.hp <= 0) {
      this._restartLevel3();
    }
  },

  // ===========================================================================
  // Level 3: Bomber enemy (aerial bird)
  // ===========================================================================
  _spawnBomber(data) {
    var bomber = this.bombers.create(data.x, data.y, 'bomber');
    bomber.anchor.setTo(0.5, 0.5);
    this.game.physics.enable(bomber);
    bomber.body.allowGravity = false;
    bomber.body.immovable = true;
    bomber.body.velocity.x = data.speedX || 80;

    // Flip sprite based on direction
    if (bomber.body.velocity.x < 0) {
      bomber.scale.x = -1;
    }

    // Drop bombs on interval
    bomber.dropInterval = data.dropInterval || 3000;
    bomber.dropTimer = this.game.time.events.loop(bomber.dropInterval, function () {
      if (this.hero && this.hero.alive) {
        this._spawnBomb(bomber.x, bomber.y + 12);
      }
    }, this);
  },

  _spawnBomb(x, y) {
    var bomb = this.bombs.create(x, y, 'bomb');
    bomb.anchor.setTo(0.5, 0.5);
    this.game.physics.enable(bomb);
    bomb.body.gravity.y = 400;
    bomb.body.velocity.x = this.game.rnd.realInRange(-30, 30);
    bomb.checkWorldBounds = true;
    bomb.outOfBoundsKill = true;
  },

  _onHeroVsBomb(hero, bomb) {
    if (!hero.alive || hero.isInvincible) return;
    this._spawnExplosion(bomb.x, bomb.y);
    bomb.kill();
    hero.takeDamage(25, hero.x < bomb.x ? -1 : 1);
    if (hero.hp <= 0) {
      this._restartLevel3();
    }
  },

  _onBombHitGround(bomb, platform) {
    if (!bomb.alive) return;
    this._spawnExplosion(bomb.x, bomb.y);
    bomb.kill();
  },

  _spawnExplosion(x, y) {
    // Simple flash effect
    var flash = this.game.add.graphics(x - 16, y - 16);
    flash.beginFill(0xff6600, 0.7);
    flash.drawCircle(16, 16, 32);
    flash.endFill();
    flash.beginFill(0xffcc00, 0.5);
    flash.drawCircle(16, 16, 20);
    flash.endFill();

    this.game.add.tween(flash)
      .to({ alpha: 0 }, 300, null, true)
      .onComplete.addOnce(function () {
        flash.destroy();
      });
  },

  // ===========================================================================
  // Level 3: Health pickups
  // ===========================================================================
  _spawnHpPickup(data) {
    var pickup = this.hpPickups.create(data.x, data.y, 'hpPickup');
    pickup.anchor.setTo(0.5, 0.5);
    this.game.physics.enable(pickup);
    pickup.body.allowGravity = false;
    pickup.healAmount = data.amount || 25;

    // Floating animation
    pickup.origY = data.y;
    this.game.add.tween(pickup)
      .to({ y: pickup.origY - 6 }, 1000, window.Phaser.Easing.Sinusoidal.InOut)
      .yoyo(true)
      .loop()
      .start();
  },

  _onHeroVsHpPickup(hero, pickup) {
    if (!pickup.alive) return;
    hero.hp = Math.min(hero.maxHp, hero.hp + pickup.healAmount);
    pickup.kill();
  },

  // ===========================================================================
  // Level 3: Death / Restart
  // ===========================================================================
  _restartLevel3() {
    if (this._transitioning) return;
    this._transitioning = true;

    // Death screen
    this.camera.fade(0x000000, 800);
    this.camera.onFadeComplete.addOnce(function () {
      this._level3Hp = 100;
      window.globalLevelState = null;
      window.gameStarted = false;
      window.globalUnsubscribe();
      window.resetPlayersFinished(function () {
        window.createMyPubNub(3);
      });
    }, this);
  },

  // ===========================================================================
  // Level 3: Programmatic 15360px world generator (4 zones)
  // ===========================================================================
  _generateLevel3Data() {
    var ZW = 3840;
    var GY = 546;
    var data = { platforms: [], decoration: [], coins: [], crawlers: [], bombers: [], hpPickups: [], hero: {x: 30, y: 510}, key: null, door: null };

    function addGround(sx) {
      for (var gx = sx; gx < sx + ZW; gx += 960) {
        data.platforms.push({ image: 'ground', x: gx, y: GY });
      }
    }
    function addPlat(x, y, w) { data.platforms.push({ image: w, x: x, y: y }); }
    function addDeco(x, y, f) { data.decoration.push({ x: x, y: y, frame: f }); }
    function addCoin(x, y) { data.coins.push({ x: x, y: y }); }
    function addCrawler(x, y, minX, maxX, spd) { data.crawlers.push({ x: x, y: y, minX: minX, maxX: maxX, speed: spd || 55 }); }
    function addBomber(x, y, spd, interval) { data.bombers.push({ x: x, y: y || 80, speedX: spd || 80, dropInterval: interval || 3000 }); }
    function addHp(x, y, amt) { data.hpPickups.push({ x: x, y: y, amount: amt || 30 }); }
    function addDecoRow(sx, ex) {
      for (var dx = sx + 84; dx < ex; dx += 84) {
        addDeco(dx, 504, (dx / 84 + 3) % 5 | 0);
      }
    }

    // ── Zone 0: Meadow (0–3840) ──────────────────────────────────
    addGround(0);
    addDecoRow(0, 960);
    addPlat(80, 460, 'grass:4x1'); addPlat(500, 370, 'grass:2x1');
    addPlat(1000, 460, 'grass:6x1'); addPlat(1500, 290, 'grass:2x1');
    addPlat(2000, 460, 'grass:4x1'); addPlat(2600, 370, 'grass:4x1');
    addPlat(3200, 460, 'grass:2x1'); addPlat(3400, 200, 'grass:1x1');
    addCoin(120, 440); addCoin(160, 440); addCoin(200, 440);
    addCoin(540, 350); addCoin(580, 350);
    addCoin(1050, 440); addCoin(1100, 440); addCoin(1150, 440); addCoin(1200, 440);
    addCoin(1540, 270); addCoin(1580, 270);
    addCoin(2050, 440); addCoin(2100, 440); addCoin(2650, 350); addCoin(2700, 350);
    addCoin(3250, 440); addCoin(3450, 180);
    addCrawler(400, 525, 250, 650, 50); addCrawler(1200, 525, 1000, 1550, 55); addCrawler(2200, 525, 1950, 2500, 50);
    addBomber(500, 80, 70, 3500);
    addHp(1050, 440, 30); addHp(2100, 440, 30);

    // ── Zone 1: Cave (3840–7680) ─────────────────────────────────
    addGround(3840);
    addDecoRow(3840, 4800);
    addPlat(3900, 460, 'grass:2x1'); addPlat(4200, 370, 'grass:4x1'); addPlat(4500, 290, 'grass:2x1');
    addPlat(4900, 460, 'grass:6x1'); addPlat(5200, 370, 'grass:4x1'); addPlat(5600, 290, 'grass:2x1');
    addPlat(6000, 460, 'grass:4x1'); addPlat(6300, 370, 'grass:2x1'); addPlat(6600, 290, 'grass:4x1');
    addPlat(7000, 460, 'grass:2x1'); addPlat(7200, 200, 'grass:1x1');
    addCoin(3950, 440); addCoin(4250, 350); addCoin(4550, 270);
    addCoin(4950, 440); addCoin(5000, 440); addCoin(5250, 350); addCoin(5650, 270);
    addCoin(6050, 440); addCoin(6350, 350); addCoin(6650, 270);
    addCoin(7050, 440); addCoin(7250, 180);
    addCrawler(4100, 525, 3900, 4400, 55); addCrawler(5100, 525, 4800, 5500, 60); addCrawler(6200, 525, 5900, 6600, 50);
    addBomber(5000, 80, 90, 3000);
    addHp(4500, 270, 30); addHp(5600, 270, 30);

    // ── Zone 2: Ruins (7680–11520) ───────────────────────────────
    addGround(7680);
    addDecoRow(7680, 9600);
    addPlat(7750, 460, 'grass:4x1'); addPlat(8000, 370, 'grass:2x1'); addPlat(8300, 290, 'grass:4x1');
    addPlat(8700, 460, 'grass:6x1'); addPlat(9000, 370, 'grass:4x1'); addPlat(9300, 290, 'grass:2x1');
    addPlat(9600, 460, 'grass:4x1'); addPlat(9900, 370, 'grass:2x1'); addPlat(10200, 290, 'grass:4x1');
    addPlat(10600, 460, 'grass:2x1'); addPlat(10800, 200, 'grass:1x1'); addPlat(11000, 120, 'grass:1x1');
    addCoin(7800, 440); addCoin(8050, 350); addCoin(8350, 270);
    addCoin(8750, 440); addCoin(8800, 440); addCoin(9050, 350); addCoin(9350, 270);
    addCoin(9650, 440); addCoin(9950, 350); addCoin(10250, 270);
    addCoin(10650, 440); addCoin(10850, 180); addCoin(11050, 100);
    addCrawler(7900, 525, 7700, 8300, 55); addCrawler(8900, 525, 8600, 9400, 60); addCrawler(9800, 525, 9500, 10400, 50); addCrawler(10700, 525, 10500, 11200, 55);
    addBomber(8500, 80, 85, 3000); addBomber(10500, 80, -75, 2500);
    addHp(8300, 270, 30); addHp(9300, 270, 30); addHp(10800, 180, 30);

    // ── Zone 3: Summit (11520–15360) ─────────────────────────────
    addGround(11520);
    addDecoRow(11520, 13440);
    addPlat(11600, 460, 'grass:4x1'); addPlat(11900, 370, 'grass:2x1'); addPlat(12200, 290, 'grass:4x1');
    addPlat(12600, 460, 'grass:6x1'); addPlat(12900, 370, 'grass:4x1'); addPlat(13200, 290, 'grass:2x1');
    addPlat(13500, 460, 'grass:4x1'); addPlat(13800, 370, 'grass:2x1'); addPlat(14100, 290, 'grass:4x1');
    addPlat(14500, 460, 'grass:2x1'); addPlat(14800, 200, 'grass:1x1');
    addPlat(15000, 120, 'grass:1x1'); // door platform
    addCoin(11650, 440); addCoin(11950, 350); addCoin(12250, 270);
    addCoin(12650, 440); addCoin(12700, 440); addCoin(12950, 350); addCoin(13250, 270);
    addCoin(13550, 440); addCoin(13850, 350); addCoin(14150, 270);
    addCoin(14550, 440); addCoin(14850, 180); addCoin(15050, 100);
    addCrawler(11750, 525, 11600, 12200, 55); addCrawler(12800, 525, 12500, 13300, 60); addCrawler(13700, 525, 13400, 14200, 55);
    addBomber(12500, 80, 90, 2500); addBomber(14500, 80, -80, 2000);
    addHp(12200, 270, 30); addHp(13200, 270, 30); addHp(14800, 180, 30);

    // Place key and door
    data.key = { x: 11000, y: 100 };
    data.door = { x: 15020, y: 90 };

    return data;
  },

  // ===========================================================================
  // Level 3: Parallax background system
  // ===========================================================================
  _createParallaxBackground() {
    this._currentZone = -1;
    this._parallaxLayers = [];

    // Create 3 scroll layers (far, mid, near) as tileSprites
    this._parallaxFar = this.game.add.tileSprite(0, 0, 15360, 600, 'pfar_forest');
    this._parallaxFar.fixedToCamera = false;

    this._parallaxMid = this.game.add.tileSprite(0, 0, 15360, 600, 'pmid_forest');
    this._parallaxMid.fixedToCamera = false;

    this._parallaxNear = this.game.add.tileSprite(0, 0, 15360, 600, 'pnear_forest');
    this._parallaxNear.fixedToCamera = false;

    // Determine initial zone
    this._setParallaxZone(0);
  },

  _updateParallax() {
    if (!this._parallaxFar) return;
    var cx = this.game.camera.x;
    this._parallaxFar.tilePosition.x = cx * 0.1;
    this._parallaxMid.tilePosition.x = cx * 0.3;
    this._parallaxNear.tilePosition.x = cx * 0.6;

    // Zone switching based on camera position
    var newZone = Math.floor(cx / 3840);
    if (newZone !== this._currentZone && newZone >= 0 && newZone < 4) {
      this._setParallaxZone(newZone);
    }
  },

  _setParallaxZone(zoneIdx) {
    var keys = ['forest', 'cave', 'ruins', 'cliff'];
    if (zoneIdx < 0 || zoneIdx >= keys.length) return;
    this._currentZone = zoneIdx;
    var k = keys[zoneIdx];

    // Swap textures
    try {
      this._parallaxFar.loadTexture('pfar_' + k);
      this._parallaxMid.loadTexture('pmid_' + k);
      this._parallaxNear.loadTexture('pnear_' + k);
      console.log('[parallax] switched to zone', zoneIdx, k);
    } catch (e) {
      console.warn('[parallax] zone switch failed:', e);
    }
  },

  // ===========================================================================
  // Level 3: Interactive birds
  // ===========================================================================
  _spawnBirds() {
    this.birds = this.game.add.group();
    var birdPositions = [
      { x: 600, y: 500 }, { x: 1400, y: 510 }, { x: 2800, y: 490 },
      { x: 4500, y: 505 }, { x: 6000, y: 495 },
      { x: 8500, y: 500 }, { x: 10000, y: 510 },
      { x: 12500, y: 495 }, { x: 14000, y: 505 }
    ];
    birdPositions.forEach(function (pos) {
      var bird = this.birds.create(pos.x, pos.y, 'bomber');
      bird.anchor.setTo(0.5, 0.5);
      bird.body.allowGravity = false;
      bird.body.immovable = true;
      bird.scale.setTo(0.5, 0.5);
      bird.origX = pos.x;
      bird.origY = pos.y;
      bird.isFlyingAway = false;
      // Ground pecking animation
      bird.peckTimer = this.game.time.events.loop(1200, function () {
        if (!bird.isFlyingAway) {
          bird.scale.y = bird.scale.y === 0.5 ? 0.55 : 0.5;
          bird.y = bird.y === bird.origY ? bird.origY - 2 : bird.origY;
        }
      }, this);
    }, this);
  },

  _checkBirds() {
    if (!this.birds || !this.hero) return;
    this.birds.forEachAlive(function (bird) {
      if (bird.isFlyingAway) return;
      var dist = Math.abs(this.hero.x - bird.x);
      if (dist < 250) {
        bird.isFlyingAway = true;
        if (bird.peckTimer) {
          this.game.time.events.remove(bird.peckTimer);
        }
        // Fly away tween
        var flyDir = this.hero.x < bird.x ? 1 : -1;
        this.game.add.tween(bird)
          .to({ x: bird.x + flyDir * 400, y: bird.y - 300, alpha: 0 }, 1500, null, true)
          .onComplete.addOnce(function () {
            bird.kill();
          });
        // Play flap animation via scale
        var flapTimer = this.game.time.events.loop(80, function () {
          bird.scale.y = bird.scale.y === 0.5 ? -0.5 : 0.5;
        }, this);
      }
    }, this);
  },

  // ===========================================================================
  // Level 3: Animated waterfall
  // ===========================================================================
  _createWaterfall() {
    // Place 2 waterfalls in zone 3 (summit area)
    this.waterfalls = this.game.add.group();
    var wfPositions = [
      { x: 11700, y: 400, h: 200, w: 48 },
      { x: 14300, y: 350, h: 250, w: 48 }
    ];
    wfPositions.forEach(function (wf) {
      var wfSprite = this.game.add.tileSprite(wf.x, wf.y, wf.w, wf.h, 'waterfall');
      this.waterfalls.add(wfSprite);
    }, this);

    // Animate waterfall flow
    this._waterfallAnimTimer = this.game.time.events.loop(100, function () {
      this.waterfalls.forEachAlive(function (ws) {
        ws.tilePosition.y -= 2;
      });
    }, this);
  }
};
