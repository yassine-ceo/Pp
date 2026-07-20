'use client'

import * as Phaser from 'phaser'

interface LobbyData {
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
}

export default class LobbyScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private remotePlayer!: Phaser.Physics.Arcade.Sprite
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private door!: Phaser.Physics.Arcade.Sprite
  private playerLabel!: Phaser.GameObjects.Text
  private remoteLabel!: Phaser.GameObjects.Text
  private roomCode: string = ''
  private playerId: string = ''
  private playerName: string = ''
  private isHost: boolean = false

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }

  private moveLeft = false
  private moveRight = false
  private moveUp = false
  private moveDown = false

  private remoteTarget = { x: 0, y: 0 }
  private remoteConnected = false
  private transitionStarted = false

  private lastSyncTime = 0
  private syncInterval = 50

  private onStateUpdate: ((data: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number }) => void) | null = null
  private onBothReady: (() => void) | null = null

  constructor() {
    super({ key: 'LobbyScene' })
  }

  init(data: LobbyData): void {
    this.roomCode = data.roomCode
    this.playerId = data.playerId
    this.playerName = data.playerName
    this.isHost = data.isHost
    this.remoteConnected = false
    this.transitionStarted = false
    this.moveLeft = false
    this.moveRight = false
    this.moveUp = false
    this.moveDown = false
    this.remoteTarget = { x: 0, y: 0 }
  }

  setCallbacks(
    onStateUpdate: (data: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number }) => void,
    onBothReady: () => void,
  ): void {
    this.onStateUpdate = onStateUpdate
    this.onBothReady = onBothReady
  }

  create(): void {
    const w = Number(this.game.config.width)
    const h = Number(this.game.config.height)

    // Background
    this.cameras.main.setBackgroundColor('#0d0806')

    // Floor tiles
    for (let x = 0; x < w; x += 32) {
      for (let y = 0; y < h; y += 32) {
        this.add.image(x + 16, y + 16, 'floor')
      }
    }

    // Walls
    this.walls = this.physics.add.staticGroup()

    // Top wall
    for (let x = 0; x < w; x += 32) {
      this.walls.create(x + 16, 16, 'wall')
    }
    // Bottom wall
    for (let x = 0; x < w; x += 32) {
      this.walls.create(x + 16, h - 16, 'wall')
    }
    // Left wall
    for (let y = 32; y < h - 32; y += 32) {
      this.walls.create(16, y + 16, 'wall')
    }
    // Right wall
    for (let y = 32; y < h - 32; y += 32) {
      this.walls.create(w - 16, y + 16, 'wall')
    }

    // Decorative pillars
    const pillarPositions = [
      { x: w * 0.25, y: h * 0.3 },
      { x: w * 0.75, y: h * 0.3 },
      { x: w * 0.25, y: h * 0.7 },
      { x: w * 0.75, y: h * 0.7 },
    ]
    for (const p of pillarPositions) {
      const pillar = this.add.rectangle(p.x, p.y, 24, 80, 0x3a2a2a)
      pillar.setStrokeStyle(1, 0x5c3a21)
      pillar.setAlpha(0.7)
      this.physics.add.existing(pillar, true)
      this.walls.add(pillar)
    }

    // Door (center top)
    this.door = this.physics.add.sprite(w / 2, h - 48, 'door')
    this.door.setImmovable(true)
    this.door.body!.enable = false
    this.door.setAlpha(0.4)

    // Torch glow effects
    const torchPositions = [
      { x: 60, y: 60 },
      { x: w - 60, y: 60 },
    ]
    for (const t of torchPositions) {
      const glow = this.add.circle(t.x, t.y, 40, 0xd4a84b, 0.08)
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.05, to: 0.12 },
        scale: { from: 1, to: 1.2 },
        duration: 1500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
      })
    }

    // Player
    this.player = this.physics.add.sprite(w / 2 - 40, h / 2, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(2)
    const pBody = this.player.body as Phaser.Physics.Arcade.Body
    pBody.setSize(20, 40)
    pBody.setOffset(6, 8)

    // Player label
    this.playerLabel = this.add.text(w / 2 - 40, h / 2 - 40, this.playerName, {
      fontSize: '10px',
      color: '#d4a84b',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Remote player (hidden initially)
    this.remotePlayer = this.physics.add.sprite(-100, -100, 'remotePlayer')
    this.remotePlayer.setVisible(false)
    this.remotePlayer.setDepth(2)
    const rpBody = this.remotePlayer.body as Phaser.Physics.Arcade.Body
    rpBody.setSize(20, 40)
    rpBody.setOffset(6, 8)

    this.remoteLabel = this.add.text(-100, -100, '', {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Collisions
    this.physics.add.collider(this.player, this.walls)
    this.physics.add.collider(this.remotePlayer, this.walls)

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
    }

    // Sync loop
    this.time.addEvent({
      delay: this.syncInterval,
      callback: () => this.syncPlayerState(),
      loop: true,
    })
  }

  update(): void {
    // Movement
    let vx = 0
    let vy = 0
    const speed = 160

    if (this.cursors?.left.isDown || this.wasd?.A.isDown || this.moveLeft) vx = -speed
    else if (this.cursors?.right.isDown || this.wasd?.D.isDown || this.moveRight) vx = speed

    if (this.cursors?.up.isDown || this.wasd?.W.isDown || this.moveUp) vy = -speed
    else if (this.cursors?.down.isDown || this.wasd?.S.isDown || this.moveDown) vy = speed

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707
      vy *= 0.707
    }

    this.player.setVelocity(vx, vy)

    // Face direction
    if (vx < 0) this.player.setFlipX(true)
    else if (vx > 0) this.player.setFlipX(false)

    // Update label position
    this.playerLabel.setPosition(this.player.x, this.player.y - 36)

    // Interpolate remote player
    if (this.remoteConnected) {
      const dx = this.remoteTarget.x - this.remotePlayer.x
      const dy = this.remoteTarget.y - this.remotePlayer.y
      this.remotePlayer.setVelocity(dx * 8, dy * 8)
      this.remoteLabel.setPosition(this.remotePlayer.x, this.remotePlayer.y - 36)
    }
  }

  setRemotePosition(x: number, y: number, facing: number): void {
    this.remoteTarget.x = x
    this.remoteTarget.y = y
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setFlipX(facing < 0)
    this.remoteConnected = true

    if (!this.transitionStarted) {
      this.transitionStarted = true
      this.time.delayedCall(1500, () => {
        this.onBothReady?.()
      })
    }
  }

  setRemoteDisconnected(): void {
    this.remoteConnected = false
    this.remotePlayer.setVisible(false)
    this.remotePlayer.setPosition(-100, -100)
    this.remoteLabel.setPosition(-100, -100)
    this.transitionStarted = false
  }

  setActiveControls(controls: { left: boolean; right: boolean; up: boolean; down: boolean }): void {
    this.moveLeft = controls.left
    this.moveRight = controls.right
    this.moveUp = controls.up
    this.moveDown = controls.down
  }

  private syncPlayerState(): void {
    if (!this.onStateUpdate) return
    const now = Date.now()
    if (now - this.lastSyncTime < this.syncInterval) return
    this.lastSyncTime = now

    const b = this.player.body as Phaser.Physics.Arcade.Body
    this.onStateUpdate({
      x: this.player.x,
      y: this.player.y,
      vx: b.velocity.x,
      vy: b.velocity.y,
      grounded: true,
      facing: this.player.flipX ? -1 : 1,
    })
  }

  shutdown(): void {
    this.remoteConnected = false
    this.transitionStarted = false
  }
}
