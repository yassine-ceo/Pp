'use strict';

window.syncOtherPlayerFrameDelay = 0;
window.currentChannelName = '';
window.currentFireChannelName = '';
window.globalCurrentLevel = 0;
window.globalLevelState = null;
window.globalWasHeroMoving = true;
window.updateOccupancyCounter = false;
window.keyMessages = [];

// Parse room code, player credentials, and host flag from URL params
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('roomCode') || 'LOCAL';
const playerId = urlParams.get('playerId') || 'localPlayer';
const playerName = urlParams.get('playerName') || 'Ninja';
const isHost = urlParams.get('isHost') === '1';

window.UniqueID = playerId;

window.createMyPubNub = function (currentLevel) {
  window.globalCurrentLevel = currentLevel;
  console.log('[createMyPubNub] level:', currentLevel, 'gameStarted:', window.gameStarted);

  // Clean up any previous listeners
  if (window.currentFirebaseUnsubscribe) {
    window.currentFirebaseUnsubscribe();
  }

  // Access the parent window's database and references
  const parentDb = window.parent.__dungeonRunDb;
  const refs = window.parent.__dungeonRunRefs;

  if (!parentDb || !refs) {
    console.warn("Parent window Firebase references not found. Running in standalone local mode.");
    window.StartLoading();
    return;
  }

  const { ref, set, update, onValue, off, onDisconnect } = refs;

  // Paths in Firebase RTDB
  const roomPlayersRef = ref(parentDb, `platformerRooms/${roomCode}/players`);
  const myPlayerRef = ref(parentDb, `platformerRooms/${roomCode}/players/${window.UniqueID}`);
  const levelStateRef = ref(parentDb, `platformerRooms/${roomCode}/levelState`);

  // 1. Establish player presence and cleanup on disconnect
  onDisconnect(myPlayerRef).remove();

  update(myPlayerRef, {
    uuid: window.UniqueID,
    name: playerName,
    lastUpdated: Date.now()
  });

  // 2. Fetch or initialize the Level State (coinCache)
  onValue(levelStateRef, (snap) => {
    const val = snap.val();
    if (val && val.currentLevel === currentLevel) {
      window.globalLevelState = val;
    } else {
      if (isHost) {
        // Host will initialize the level state when the game starts (in window.fireCoins)
      }
    }

    // Trigger game load once
    if (!window.gameStarted) {
      window.gameStarted = true;
      console.log('[createMyPubNub] calling StartLoading for level:', currentLevel);
      window.StartLoading();
    } else {
      console.log('[createMyPubNub] gameStarted already true, skipping StartLoading');
    }
  }, { onlyOnce: true });

  // 3. Setup real-time listeners for other players' movements, joining, and leaving
  const playersUnsubscribe = onValue(roomPlayersRef, (snap) => {
    const players = snap.val() || {};

    // Update Room & Player info text indicators on the screen
    var playerCount = Object.keys(players).length;
    try { window.parent.postMessage({ action: 'PLAYER_COUNT', count: playerCount }, '*'); } catch (e) {}

    // Remove characters of players who left
    if (window.globalOtherHeros) {
      for (const uuid of window.globalOtherHeros.keys()) {
        if (!players[uuid]) {
          window.globalGameState._removeOtherCharacter(uuid);
        }
      }
    }

    // Add or update other players
    for (const uuid in players) {
      if (uuid === window.UniqueID) continue;

      const pData = players[uuid];
      if (!pData.position) continue;

      if (window.globalOtherHeros) {
        if (!window.globalOtherHeros.has(uuid)) {
          window.globalGameState._addOtherCharacter(uuid);
          // Send our state to notify them we exist
          window.sendKeyMessage({});
        }

        // Set remote player's name above their head if available
        const otherPlayer = window.globalOtherHeros.get(uuid);
        if (otherPlayer && otherPlayer.children[0]) {
          otherPlayer.children[0].text = pData.name || 'Player';
        }

        // If the remote player finished (entered door), hide their sprite
        if (otherPlayer && pData.isFinished && otherPlayer.visible) {
          otherPlayer.visible = false;
          if (otherPlayer.body) otherPlayer.body.enable = false;
        }

        // Chat message bubble for remote player
        if (otherPlayer && pData.chatMessage && pData.chatMessage.text) {
          if (window.globalGameState) {
            window.globalGameState._showSpeechBubble(otherPlayer, pData.chatMessage.text, pData.chatMessage.id);
          }
        }

        // Typing indicator for remote player
        if (otherPlayer && window.globalGameState) {
          if (pData.isTyping) {
            window.globalGameState._showTypingIndicator(otherPlayer);
          } else {
            window.globalGameState._hideTypingIndicator(otherPlayer);
          }
        }

        // Format update message to feed into the game's native interpolation queue
        const messageEvent = {
          channel: window.currentChannelName,
          message: {
            uuid: uuid,
            keyMessage: pData.keyMessage || {},
            position: pData.position,
            frameCounter: pData.frameCounter || 0
          }
        };
        window.keyMessages.push(messageEvent);
      }
    }
  });

  // 4. Listen for both players finishing to transition the level
  let finishedUnsubscribe = onValue(roomPlayersRef, (snap) => {
    const players = snap.val() || {};
    const uuids = Object.keys(players);
    if (uuids.length >= 2) {
      const allFinished = uuids.every(uuid => players[uuid].isFinished === true);
      if (allFinished && typeof window.onBothPlayersFinished === 'function') {
        window.onBothPlayersFinished();
      }
    }
  });

  window.currentFirebaseUnsubscribe = () => {
    playersUnsubscribe();
    if (finishedUnsubscribe) finishedUnsubscribe();
  };
};

window.globalUnsubscribe = function () {
  if (window.currentFirebaseUnsubscribe) {
    window.currentFirebaseUnsubscribe();
  }
};

window.setPlayerFinished = (finished) => {
  const parentDb = window.parent.__dungeonRunDb;
  const refs = window.parent.__dungeonRunRefs;
  if (parentDb && refs) {
    const { ref, update } = refs;
    const myPlayerRef = ref(parentDb, `platformerRooms/${roomCode}/players/${window.UniqueID}`);
    update(myPlayerRef, { isFinished: finished });
  }
};

window.resetPlayersFinished = (callback) => {
  const parentDb = window.parent.__dungeonRunDb;
  const refs = window.parent.__dungeonRunRefs;
  if (!parentDb || !refs) {
    if (callback) callback();
    return;
  }
  const { ref, update } = refs;
  const roomPlayersRef = ref(parentDb, `platformerRooms/${roomCode}/players`);
  const updates = {};
  // Reset isFinished for local player
  updates[`${window.UniqueID}/isFinished`] = false;
  // Reset isFinished for all known remote players
  if (window.globalOtherHeros) {
    for (const uuid of window.globalOtherHeros.keys()) {
      updates[`${uuid}/isFinished`] = false;
    }
  }
  try {
    const result = update(roomPlayersRef, updates);
    if (result && typeof result.then === 'function') {
      result.then(function () { if (callback) callback(); })
            .catch(function () { if (callback) callback(); });
    } else {
      if (callback) callback();
    }
  } catch (e) {
    if (callback) callback();
  }
};

window.sendKeyMessage = (keyMessage) => {
  try {
    if (window.globalMyHero) {
      const parentDb = window.parent.__dungeonRunDb;
      const refs = window.parent.__dungeonRunRefs;
      if (parentDb && refs) {
        const { ref, update } = refs;
        const myPlayerRef = ref(parentDb, `platformerRooms/${roomCode}/players/${window.UniqueID}`);
        update(myPlayerRef, {
          keyMessage: keyMessage || {},
          position: {
            x: window.globalMyHero.body.position.x,
            y: window.globalMyHero.body.position.y
          },
          frameCounter: window.frameCounter,
          lastUpdated: Date.now()
        });
      }
    }
  } catch (err) {
    console.error("Error sending key message:", err);
  }
};

window.sendChatMessage = (text) => {
  try {
    const parentDb = window.parent.__dungeonRunDb;
    const refs = window.parent.__dungeonRunRefs;
    if (parentDb && refs) {
      const { ref, update } = refs;
      const myPlayerRef = ref(parentDb, `platformerRooms/${roomCode}/players/${window.UniqueID}`);
      const chatId = Date.now().toString();
      update(myPlayerRef, {
        chatMessage: { text, id: chatId, timestamp: Date.now() }
      });
      // Also show bubble on local player immediately
      if (window.globalGameState && window.globalMyHero) {
        window.globalGameState._showSpeechBubble(window.globalMyHero, text, chatId);
      }
      // Clear after 5s
      setTimeout(() => {
        update(myPlayerRef, { chatMessage: null });
      }, 5000);
    }
  } catch (err) {
    console.error("Error sending chat message:", err);
  }
};

window.setTyping = (isTyping) => {
  try {
    const parentDb = window.parent.__dungeonRunDb;
    const refs = window.parent.__dungeonRunRefs;
    if (parentDb && refs) {
      const { ref, update } = refs;
      const myPlayerRef = ref(parentDb, `platformerRooms/${roomCode}/players/${window.UniqueID}`);
      update(myPlayerRef, { isTyping: isTyping || null });
    }
    // Update local player indicator immediately (Firebase listener skips self)
    if (window.globalGameState && window.globalMyHero) {
      if (isTyping) {
        window.globalGameState._showTypingIndicator(window.globalMyHero);
      } else {
        window.globalGameState._hideTypingIndicator(window.globalMyHero);
      }
    }
  } catch (err) {
    console.error("Error setting typing status:", err);
  }
};

window.fireCoins = () => {
  try {
    const parentDb = window.parent.__dungeonRunDb;
    const refs = window.parent.__dungeonRunRefs;
    if (parentDb && refs && window.globalLevelState) {
      const { ref, set } = refs;
      const levelStateRef = ref(parentDb, `platformerRooms/${roomCode}/levelState`);
      set(levelStateRef, {
        currentLevel: window.globalCurrentLevel,
        coinCache: window.globalLevelState.coinCache,
        time: Date.now()
      });
    }
  } catch (err) {
    console.error("Error syncing coin collections:", err);
  }
};

// Listen for movement commands from the parent React component (outside iframe)
window.addEventListener('message', function (e) {
  var data = e.data || {};
  if (data.action === 'MOVE_LEFT') {
    window._htmlLeft = data.isDown;
    if (window.sendKeyMessage) window.sendKeyMessage({ left: data.isDown ? 'down' : 'up' });
  } else if (data.action === 'MOVE_RIGHT') {
    window._htmlRight = data.isDown;
    if (window.sendKeyMessage) window.sendKeyMessage({ right: data.isDown ? 'down' : 'up' });
  } else if (data.action === 'CHAT_MESSAGE') {
    if (window.sendChatMessage) window.sendChatMessage(data.text);
  } else if (data.action === 'TYPING') {
    if (window.setTyping) window.setTyping(data.isTyping);
  }
});

// Load External state scripts dynamically to start the Phaser game loop
const loadHeroScript = document.createElement('script');
loadHeroScript.src = './js/heroScript.js';
document.head.appendChild(loadHeroScript);

const loadLoadingState = document.createElement('script');
loadLoadingState.src = './js/loadingState.js';
document.head.appendChild(loadLoadingState);

const loadPlaystate = document.createElement('script');
loadPlaystate.src = './js/playState.js';
document.head.appendChild(loadPlaystate);

window.addEventListener('load', () => {
  const game = new window.Phaser.Game(960, 600, window.Phaser.AUTO, 'game');
  game.state.disableVisibilityChange = true;
  game.state.add('play', window.PlayState);
  game.state.add('loading', window.LoadingState);
  
  window.createMyPubNub(0); // Initialize first level (index 0)

  window.StartLoading = function () {
    game.state.start('loading');
    window.initChatEngine();
  };

  // Global DOM audio unlock for browser autoplay policy
  const unlockAudio = () => {
    if (game && game.sound && game.sound.context) {
      if (game.sound.context.state === 'suspended') {
        game.sound.context.resume().then(() => {
          console.log('AudioContext unlocked');
        });
      }
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
});
