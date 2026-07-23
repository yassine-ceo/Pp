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
    try {
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
        if (!levelData) {
          console.warn('[create] null JSON for level:', this.level, '- using fallback');
          levelData = { platforms: [], decoration: [], coins: [], hero: { x: 30, y: 510 }, key: { x: 100, y: 100 }, door: { x: 200, y: 100 }, spiders: [], crawlers: [], bombers: [], hpPickups: [] };
        }
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
    } catch (e) {
      console.error('[CRASH] PlayState.create() failed for level:', this.level, e);
      if (e.stack) console.error(e.stack);
    }
  },

  update() {
    window.frameCounter++;
    // Ground collide must run every frame, even during hurt/invincible
    if (this.hero && this.hero.body && this.platforms) {
      this.game.physics.arcade.collide(this.hero, this.platforms);
    }
    if (this.level === 3 && this.bombs && this.platforms) {
      this.game.physics.arcade.collide(this.bombs, this.platforms, this._onBombHitGround, null, this);
    }
    this._handleCollisions();
    this._handleInput();
    // update scoreboards
    if (this.coinFont) this.coinFont.text = `x${this.coinPickupCount}`;
    if (this.keyIcon) this.keyIcon.frame = keyCollected ? 1 : 0;
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
    var iterations = this.level === 3 ? 8 : 2;
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

      // Level 3: crawler collision (guarded)
      if (this.level === 3 && this.crawlers) {
        this.game.physics.arcade.overlap(this.hero, this.crawlers, this._onHeroVsCrawler, null, this);
      }

      // Level 3: bomb collision (guarded)
      if (this.level === 3 && this.bombs) {
        this.game.physics.arcade.overlap(this.hero, this.bombs, this._onHeroVsBomb, null, this);
        this.game.physics.arcade.collide(this.bombs, this.platforms, this._onBombHitGround, null, this);
      }

      // Level 3: HP pickup collision (guarded)
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
    // Unbind camera follow from any previous level (e.g. Level 3)
    if (this.game.camera && this.game.camera.unfollow) {
      this.game.camera.unfollow();
    }

    // Reset camera position for non-level-3 levels
    if (this.level !== 3 && this.game.camera) {
      this.game.camera.x = 0;
      this.game.camera.y = 0;
      // Reset camera deadzone if it was set
      if (this.game.camera.deadzone) {
        this.game.camera.deadzone = null;
      }
    }

    // Guard against null data (e.g. missing JSON or generator failure)
    if (!data) {
      console.error('[loadLevel] null data for level:', this.level);
      data = { platforms: [], decoration: [], coins: [], hero: { x: 30, y: 510 }, key: { x: 100, y: 100 }, door: { x: 200, y: 100 } };
    }

    // create all the groups/layers that we need
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();

    // spawn hero and enemies
    this._spawnCharacters({ hero: data.hero, spiders: data.spiders });

    // spawn level decoration (guarded)
    if (data.decoration && data.decoration.forEach) {
      data.decoration.forEach(function (deco) {
        if (!deco || deco.x === undefined || deco.y === undefined) return;
        this.bgDecoration.add(
          this.game.add.image(deco.x, deco.y, 'decoration', deco.frame || 0));
      }, this);
    }

    // spawn platforms (guarded)
    if (data.platforms && data.platforms.forEach) {
      data.platforms.forEach(this._spawnPlatform, this);
    }

    // spawn important objects (guarded)
    if (data.coins && data.coins.forEach) {
      data.coins.forEach(this._spawnCoin, this);
    }
    if (data.key) {
      this._spawnKey(data.key.x, data.key.y);
    }
    if (data.door) {
      this._spawnDoor(data.door.x, data.door.y);
    }

    // Level 3: horizontal side-scroller setup
    if (this.level === 3) {
      // Set world bounds for scrolling
      this.game.world.setBounds(0, 0, 15360, 600);
      this.game.camera.follow(this.hero, window.Phaser.Camera.FOLLOW_PLATFORMER);
      this.camera.deadzone = new window.Phaser.Rectangle(200, 100, 560, 200);

      // Spawn crawlers
      (data.crawlers || []).forEach(function (cd) {
        if (!this.crawlers) this.crawlers = this.game.add.group();
        this._spawnCrawler(cd);
      }, this);

      // Spawn bombers
      (data.bombers || []).forEach(function (bd) {
        if (!this.bombers) this.bombers = this.game.add.group();
        if (!this.bombs) this.bombs = this.game.add.group();
        this._spawnBomber(bd);
      }, this);

      // Spawn HP pickups
      (data.hpPickups || []).forEach(function (hd) {
        if (!this.hpPickups) this.hpPickups = this.game.add.group();
        this._spawnHpPickup(hd);
      }, this);

      // Set hero HP
      this.hero.hp = this._level3Hp || 100;
      this.hero.maxHp = 100;
    } else {
      // Reset world bounds for standard levels
      this.game.world.setBounds(0, 0, 960, 600);
      // Standard spiders for non-level-3
      (data.spiders || []).forEach(function (spiderData) {
        if (!this.spiders) this.spiders = this.game.add.group();
        this._spawnSpider(spiderData);
      }, this);
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
    if (!platform || !platform.image) return;
    const sprite = this.platforms.create(platform.x, platform.y, platform.image);
    // physics for platform sprites
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
  },

  _spawnCoin(coin) {
    if (!coin) return;
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
    var NUMBERS_STR = '0123456789X ';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);
    if (!this.coinFont) return;

    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    var coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
    var coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
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
    if (!spider.body) return;
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
    if (!crawler.body) return;
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
    if (!bomber.body) return;
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
    if (!bomb.body) return;
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
    if (!pickup.body) return;
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
  // Physics constants: SPEED=200, JUMP=-600, GRAVITY=1200
  //   Max jump height: 600^2/(2*1200) = 150px
  //   Max jump width:  200*(2*600/1200) = 200px
  //   Max safe gap:    200*0.8 = 160px
  //   Max safe climb:  150*0.9 = 135px
  // ===========================================================================
  _generateLevel3Data() {
    var ZW = 3840;
    var GY = 546;
    var MG = 160;
    var MH = 135;
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

    // Generate a chain of platforms from (startX, startY) left to right
    // Each platform is reachable from the previous (max gap MG, max climb MH)
    function genChain(startX, startY, count, zoneEnd) {
      var x = startX, y = startY;
      for (var i = 0; i < count; i++) {
        var gap = 90 + (i * 7) % 60;
        var climb = -60 + (i * 11) % (MH - 20);
        x += gap;
        y = Math.max(180, Math.min(520, y + climb));
        if (x + 80 > zoneEnd) break;
        var img = y > 450 ? 'grass:4x1' : (y > 350 ? 'grass:2x1' : 'grass:1x1');
        addPlat(x, y, img);
        addCoin(x + 20, y - 30);
        if (i > 0) addCoin(x + 60, y - 30);
      }
    }

    function genDecoRow(sx, ex) {
      for (var dx = sx + 84; dx < ex; dx += 84) {
        addDeco(dx, 504, (dx / 84 + 3) % 5 | 0);
      }
    }

    // ── Zone 0: Meadow (0–3840) ──────────────────────────────────
    addGround(0);
    genDecoRow(0, 960);
    // Tier 1 (low, 460-500): start → platforms reachable from ground
    genChain(120, 490, 4, 960);
    genChain(1000, 480, 4, 1920);
    genChain(2000, 490, 3, 2880);
    genChain(3000, 470, 3, 3840);
    // Bomber patrols across the zone
    addBomber(600, 80, 70, 4000);
    addBomber(2000, 100, -65, 3500);
    // Crawlers on ground
    addCrawler(400, 525, 200, 700, 50);
    addCrawler(1500, 525, 1200, 2000, 55);
    addCrawler(2600, 525, 2300, 3100, 50);
    // HP
    addHp(200, 470, 30);
    addHp(2000, 470, 30);

    // ── Zone 1: Cave (3840–7680) ─────────────────────────────────
    addGround(3840);
    genDecoRow(3840, 4800);
    genChain(3960, 480, 3, 4600);
    genChain(4700, 460, 4, 5500);
    genChain(5600, 470, 3, 6400);
    genChain(6600, 440, 4, 7680);
    addBomber(4500, 80, 85, 3500);
    addBomber(6500, 90, -75, 3000);
    addCrawler(4100, 525, 3900, 4600, 55);
    addCrawler(5100, 525, 4800, 5700, 60);
    addCrawler(6400, 525, 6100, 7000, 50);
    addHp(4000, 460, 30);
    addHp(6400, 450, 30);

    // ── Zone 2: Ruins (7680–11520) ───────────────────────────────
    addGround(7680);
    genDecoRow(7680, 9600);
    genChain(7800, 480, 4, 8700);
    genChain(8800, 460, 3, 9600);
    genChain(9700, 470, 4, 10600);
    genChain(10700, 440, 3, 11520);
    addBomber(8500, 80, 80, 3500);
    addBomber(10500, 85, -75, 3000);
    addCrawler(8000, 525, 7700, 8700, 55);
    addCrawler(9200, 525, 8900, 10000, 60);
    addCrawler(10400, 525, 10100, 11200, 55);
    addHp(8000, 460, 30);
    addHp(10000, 450, 30);

    // ── Zone 3: Summit (11520–15360) ─────────────────────────────
    addGround(11520);
    genDecoRow(11520, 13440);
    genChain(11650, 480, 4, 12600);
    genChain(12700, 460, 3, 13600);
    genChain(13700, 470, 4, 14600);
    genChain(14700, 440, 3, 15300);
    // Door at the very end on a high platform
    data.door = { x: 15020, y: 90 };
    // Key on a mid-height platform before the door
    data.key = { x: 14100, y: 100 };
    addBomber(12500, 80, 90, 3000);
    addBomber(14500, 85, -80, 2500);
    addCrawler(11800, 525, 11550, 12500, 55);
    addCrawler(13100, 525, 12800, 14000, 60);
    addCrawler(14300, 525, 14000, 15200, 55);
    addHp(12000, 460, 30);
    addHp(14000, 450, 30);

    return data;
  },

  // ===========================================================================
  // Level 3: Dynamic parallax background system (smooth color interpolation)
  // ===========================================================================
  _createParallaxBackground() {
    this._currentBgProgress = -1;
    this._bgColorStops = [
      { pos: 0,    sky: '#5b9bd5', mount: '#3a7cb3', ground: '#4a8c3a', tree: '#2d5a1e' },
      { pos: 0.25, sky: '#2a2a3a', mount: '#1a1a2a', ground: '#3a3a2a', tree: '#1a1a1a' },
      { pos: 0.5,  sky: '#c4884a', mount: '#a06830', ground: '#8a6a3a', tree: '#6a4a20' },
      { pos: 0.75, sky: '#7ab8d4', mount: '#5a8aa0', ground: '#6a7a5a', tree: '#3a5a3a' },
      { pos: 1,    sky: '#b088d8', mount: '#8a60a8', ground: '#6a4a7a', tree: '#3a2050' }
    ];

    // Create canvases for dynamic texture generation
    this._bgFarCanvas = document.createElement('canvas');
    this._bgFarCanvas.width = 960; this._bgFarCanvas.height = 600;
    this._bgFarCtx = this._bgFarCanvas.getContext('2d');
    this._bgMidCanvas = document.createElement('canvas');
    this._bgMidCanvas.width = 960; this._bgMidCanvas.height = 600;
    this._bgMidCtx = this._bgMidCanvas.getContext('2d');
    this._bgNearCanvas = document.createElement('canvas');
    this._bgNearCanvas.width = 960; this._bgNearCanvas.height = 600;
    this._bgNearCtx = this._bgNearCanvas.getContext('2d');

    // Initial render at progress 0
    var initColors = this._getBgColorsAt(0);
    this._drawBgFarLayer(this._bgFarCtx, initColors);
    this._drawBgMidLayer(this._bgMidCtx, initColors);
    this._drawBgNearLayer(this._bgNearCtx, initColors);

    // Add to cache and create tileSprites
    this.game.cache.addImage('_bgfar', '', this._bgFarCanvas);
    this.game.cache.addImage('_bgmid', '', this._bgMidCanvas);
    this.game.cache.addImage('_bgnear', '', this._bgNearCanvas);

    this._parallaxFar = this.game.add.tileSprite(0, 0, 15360, 600, '_bgfar');
    this._parallaxFar.fixedToCamera = false;
    this._parallaxMid = this.game.add.tileSprite(0, 0, 15360, 600, '_bgmid');
    this._parallaxMid.fixedToCamera = false;
    this._parallaxNear = this.game.add.tileSprite(0, 0, 15360, 600, '_bgnear');
    this._parallaxNear.fixedToCamera = false;

    // Decorative background birds (layer 4)
    this._spawnBgBirds();
  },

  _updateParallax() {
    if (!this._parallaxFar) return;
    var cx = this.game.camera.x;
    this._parallaxFar.tilePosition.x = cx * 0.1;
    this._parallaxMid.tilePosition.x = cx * 0.3;
    this._parallaxNear.tilePosition.x = cx * 0.6;

    // Smooth color interpolation based on camera progress across the map
    var progress = Math.min(1, Math.max(0, cx / 15360));
    if (Math.abs(progress - this._currentBgProgress) > 0.005) {
      this._currentBgProgress = progress;
      var colors = this._getBgColorsAt(progress);
      this._drawBgFarLayer(this._bgFarCtx, colors);
      this._drawBgMidLayer(this._bgMidCtx, colors);
      this._drawBgNearLayer(this._bgNearCtx, colors);
      // Mark textures dirty to force re-upload to WebGL
      this._parallaxFar.texture.baseTexture.dirty();
      this._parallaxMid.texture.baseTexture.dirty();
      this._parallaxNear.texture.baseTexture.dirty();
    }
  },

  // === Color interpolation helpers ===
  _getBgColorsAt(progress) {
    var stops = this._bgColorStops;
    progress = Math.max(0, Math.min(1, progress));
    for (var i = 0; i < stops.length - 1; i++) {
      if (progress >= stops[i].pos && progress <= stops[i + 1].pos) {
        var t = (progress - stops[i].pos) / (stops[i + 1].pos - stops[i].pos);
        return {
          sky: this._lerpColor(stops[i].sky, stops[i + 1].sky, t),
          mount: this._lerpColor(stops[i].mount, stops[i + 1].mount, t),
          ground: this._lerpColor(stops[i].ground, stops[i + 1].ground, t),
          tree: this._lerpColor(stops[i].tree, stops[i + 1].tree, t)
        };
      }
    }
    return stops[stops.length - 1];
  },

  _lerpColor(c1, c2, t) {
    var r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    var r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return '#' + [r, g, b].map(function (c) { return c.toString(16).padStart(2, '0'); }).join('');
  },

  // === Background layer drawing functions ===
  _drawBgFarLayer(ctx, colors) {
    var w = 960, h = 600;
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors.sky);
    grad.addColorStop(1, this._darken(colors.sky, 40));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Mountain silhouettes
    ctx.fillStyle = colors.mount;
    for (var i = 0; i < 10; i++) {
      var mx = i * 110 - 40;
      var mh = 90 + Math.sin(i * 2.1 + 1) * 45 + Math.sin(i * 0.7 + 2) * 25;
      ctx.beginPath();
      ctx.moveTo(mx, h); ctx.lineTo(mx + 55, h - mh); ctx.lineTo(mx + 110, h);
      ctx.closePath();
      ctx.fill();
    }
  },

  _drawBgMidLayer(ctx, colors) {
    var w = 960, h = 600;
    ctx.clearRect(0, 0, w, h);
    // Rolling hills
    ctx.fillStyle = colors.ground;
    ctx.globalAlpha = 0.35;
    for (var j = 0; j < 12; j++) {
      var hx = j * 90 - 40;
      var hh = 45 + Math.cos(j * 1.7 + 0.5) * 20;
      ctx.beginPath();
      ctx.moveTo(hx, h); ctx.quadraticCurveTo(hx + 45, h - hh, hx + 90, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 0.55;
    // Trees
    ctx.fillStyle = colors.tree;
    for (var t = 0; t < 14; t++) {
      var tx = t * 75 + Math.sin(t * 3.3 + 1) * 15;
      var th = 30 + Math.cos(t * 2.7 + 2) * 12;
      ctx.fillRect(tx - 2, h - th, 4, th);
      ctx.beginPath();
      ctx.moveTo(tx - 10, h - th); ctx.lineTo(tx, h - th - 18); ctx.lineTo(tx + 10, h - th);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  _drawBgNearLayer(ctx, colors) {
    var w = 960, h = 600;
    ctx.clearRect(0, 0, w, h);
    // Ground strip
    ctx.fillStyle = colors.ground;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, h - 60, w, 60);
    ctx.globalAlpha = 0.45;
    // Rocks and bushes
    ctx.fillStyle = colors.tree;
    for (var r = 0; r < 20; r++) {
      var rx = r * 50 + 5;
      var ry = h - 80 + Math.sin(r * 4.1 + 0.5) * 12;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5 + Math.sin(r * 2.3) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // === Decorative background birds (Layer 4, camera-fixed) ===
  _spawnBgBirds() {
    if (this._bgBirdTimer) this.game.time.events.remove(this._bgBirdTimer);
    this._bgBirdGroup = this.game.add.group();
    this._bgBirdGroup.fixedToCamera = true;
    this._bgBirdTimer = this.game.time.events.loop(2500, function () {
      if (!this._parallaxFar) return;
      var fromLeft = Math.random() > 0.5;
      var bird = this._bgBirdGroup.create(fromLeft ? -50 : 1010, 50 + Math.random() * 200, 'bomber');
      bird.anchor.setTo(0.5, 0.5);
      bird.scale.setTo(0.25, 0.25);
      bird.alpha = 0.3;
      bird.tint = 0x888888;
      if (fromLeft) bird.scale.x = -0.25;
      var targetX = fromLeft ? 1060 : -60;
      this.game.add.tween(bird)
        .to({ x: targetX, alpha: 0 }, 12000 + Math.random() * 4000, window.Phaser.Easing.Linear.None, true)
        .onComplete.addOnce(function () { bird.destroy(); });
    }, this);
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
      this.game.physics.enable(bird);
      if (!bird.body) return;
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
