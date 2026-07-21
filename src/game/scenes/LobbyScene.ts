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
  private remotePlayer!: Phaser.GameObjects.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private playerLabel!: Phaser.GameObjects.Text
  private remoteLabel!: Phaser.GameObjects.Text
  private roomCode: string = ''
  private playerId: string = ''
  private playerName: string = ''
  private isHost: boolean = false

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyA!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private keyW!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key

  private moveLeft = false
  private moveRight = false
  private jumpPressed = false

  private remoteTarget = { x: 0, y: 0 }
  private remoteConnected = false

  private lastSyncTime = 0
  private syncInterval = 50

  private onStateUpdate: ((data: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number }) => void) | null = null

  constructor() {
    super({ key: 'LobbyScene' })
  }

  init(data: LobbyData): void {
    this.roomCode = data.roomCode
    this.playerId = data.playerId
    this.playerName = data.playerName
    this.isHost = data.isHost
    this.remoteConnected = false
    this.moveLeft = false
    this.moveRight = false
    this.jumpPressed = false
    this.remoteTarget = { x: 0, y: 0 }
  }

  setCallbacks(
    onStateUpdate: (data: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number }) => void,
  ): void {
    this.onStateUpdate = onStateUpdate
  }

  create(): void {
    const w = Number(this.game.config.width)
    const h = Number(this.game.config.height)

    this.cameras.main.setBackgroundColor('#0d0806')
    try { (this.game.canvas as HTMLCanvasElement).style.backgroundColor = '#0d0806' } catch {}

    // Background wall
    for (let x = 0; x < w; x += 32) {
      for (let y = 0; y < h; y += 32) {
        this.add.image(x + 16, y + 16, 'wall').setAlpha(0.3)
      }
    }

    // Platforms / floor / ceiling / walls
    this.platforms = this.physics.add.staticGroup()

    // Floor
    for (let x = 0; x < w; x += 32) {
      const tile = this.platforms.create(x + 16, h - 16, 'floor')
      tile.setDisplaySize(32, 32)
      tile.refreshBody()
    }

    // Ceiling
    for (let x = 0; x < w; x += 32) {
      const tile = this.platforms.create(x + 16, 16, 'wall')
      tile.refreshBody()
    }

    // Left wall
    for (let y = 48; y < h - 32; y += 32) {
      const tile = this.platforms.create(16, y, 'wall')
      tile.refreshBody()
    }

    // Right wall
    for (let y = 48; y < h - 32; y += 32) {
      const tile = this.platforms.create(w - 16, y, 'wall')
      tile.refreshBody()
    }

    // Decorative pillars (static, non-colliding)
    const pillarStyle = { x: [w * 0.25, w * 0.75], y: h - 96 }
    for (const px of pillarStyle.x) {
      const p = this.add.rectangle(px, pillarStyle.y, 24, 80, 0x3a2a2a)
      p.setStrokeStyle(1, 0x5c3a21)
      p.setAlpha(0.5)
    }

    // Torch glows
    for (const tx of [60, w - 60]) {
      const glow = this.add.circle(tx, h - 80, 36, 0xd4a84b, 0.08)
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.04, to: 0.12 },
        scale: { from: 1, to: 1.25 },
        duration: 1500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
      })
    }

    // Player
    this.player = this.physics.add.sprite(w * 0.35, h - 60, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(2)
    const pBody = this.player.body as Phaser.Physics.Arcade.Body
    pBody.setSize(20, 40)
    pBody.setOffset(6, 8)
    pBody.setGravityY(500)

    this.playerLabel = this.add.text(this.player.x, this.player.y - 36, this.playerName, {
      fontSize: '10px',
      color: '#d4a84b',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Remote player — NO physics (visual-only)
    this.remotePlayer = this.add.sprite(-100, -100, 'remotePlayer')
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setDepth(2)

    this.remoteLabel = this.add.text(-100, -100, 'Player 2', {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Collisions (local player only)
    this.physics.add.collider(this.player, this.platforms)

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    }

    // Sync loop
    this.time.addEvent({
      delay: this.syncInterval,
      callback: () => this.syncPlayerState(),
      loop: true,
    })
  }

  update(): void {
    const pBody = this.player.body as Phaser.Physics.Arcade.Body
    const grounded = pBody.blocked.down || pBody.touching.down

    const speed = 180
    let vx = 0
    if (this.cursors?.left.isDown || this.keyA?.isDown || this.moveLeft) vx = -speed
    else if (this.cursors?.right.isDown || this.keyD?.isDown || this.moveRight) vx = speed
    this.player.setVelocityX(vx)

    const jumpRequested = this.cursors?.up.isDown || this.keyW?.isDown || this.keySpace?.isDown || this.jumpPressed
    if (jumpRequested && grounded) {
      this.player.setVelocityY(-380)
    }

    if (vx < 0) this.player.setFlipX(true)
    else if (vx > 0) this.player.setFlipX(false)

    this.playerLabel.setPosition(this.player.x, this.player.y - 36)

    // Remote player — smooth lerp (no physics, no velocity, no gravity)
    if (this.remoteConnected) {
      this.remotePlayer.x += (this.remoteTarget.x - this.remotePlayer.x) * 0.12
      this.remotePlayer.y += (this.remoteTarget.y - this.remotePlayer.y) * 0.12
      this.remoteLabel.setPosition(this.remotePlayer.x, this.remotePlayer.y - 36)
    }
  }

  setRemotePosition(x: number, y: number, facing: number): void {
    this.remoteTarget.x = x
    this.remoteTarget.y = y
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setFlipX(facing < 0)
    this.remoteConnected = true
  }

  setRemoteDisconnected(): void {
    this.remoteConnected = false
    this.remotePlayer.setPosition(-100, -100)
    this.remoteLabel.setPosition(-100, -100)
  }

  setActiveControls(controls: { left: boolean; right: boolean; jump: boolean }): void {
    this.moveLeft = controls.left
    this.moveRight = controls.right
    this.jumpPressed = controls.jump
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
      grounded: b.blocked.down || b.touching.down,
      facing: this.player.flipX ? -1 : 1,
    })
  }

  shutdown(): void {
    this.remoteConnected = false
  }
}
