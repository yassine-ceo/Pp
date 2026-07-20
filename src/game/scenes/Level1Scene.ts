'use client'

import * as Phaser from 'phaser'

export default class Level1Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private remotePlayer!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private playerLabel!: Phaser.GameObjects.Text
  private remoteLabel!: Phaser.GameObjects.Text

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }

  private moveLeft = false
  private moveRight = false
  private jumpPressed = false

  private remoteTarget = { x: 0, y: 0 }
  private remoteConnected = false

  private lastSyncTime = 0
  private syncInterval = 50
  private onStateUpdate: ((data: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number }) => void) | null = null

  constructor() {
    super({ key: 'Level1Scene' })
  }

  init(): void {
    this.remoteConnected = false
    this.remoteTarget = { x: 0, y: 0 }
    this.moveLeft = false
    this.moveRight = false
    this.jumpPressed = false
  }

  setCallbacks(
    onStateUpdate: (data: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number }) => void,
  ): void {
    this.onStateUpdate = onStateUpdate
  }

  create(): void {
    const w = Number(this.game.config.width)
    const h = Number(this.game.config.height)

    this.cameras.main.setBackgroundColor('#0a0a15')

    // Background gradient
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a20, 0x0a0a20, 0x1a1a30, 0x1a1a30, 1)
    bg.fillRect(0, 0, w, h)
    bg.setDepth(-10)

    // Platforms
    this.platforms = this.physics.add.staticGroup()

    // Ground
    for (let x = 0; x < w; x += 64) {
      this.platforms.create(x + 32, h - 16, 'platform')
    }

    // Floating platforms
    const platformLayout = [
      { x: w * 0.15, y: h * 0.6 },
      { x: w * 0.35, y: h * 0.45 },
      { x: w * 0.55, y: h * 0.55 },
      { x: w * 0.75, y: h * 0.4 },
      { x: w * 0.9, y: h * 0.3 },
    ]
    for (const p of platformLayout) {
      this.platforms.create(p.x, p.y, 'platform')
    }

    // Player
    this.player = this.physics.add.sprite(80, h - 60, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(2)
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    playerBody.setSize(20, 40)
    playerBody.setOffset(6, 8)
    playerBody.setGravityY(600)

    this.playerLabel = this.add.text(80, h - 90, 'You', {
      fontSize: '10px',
      color: '#d4a84b',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Remote player
    this.remotePlayer = this.physics.add.sprite(-100, -100, 'remotePlayer')
    this.remotePlayer.setVisible(false)
    this.remotePlayer.setDepth(2)
    const remoteBody = this.remotePlayer.body as Phaser.Physics.Arcade.Body
    remoteBody.setSize(20, 40)
    remoteBody.setOffset(6, 8)
    remoteBody.setGravityY(600)

    this.remoteLabel = this.add.text(-100, -100, '', {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Collisions
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.remotePlayer, this.platforms)

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
      callback: () => this.syncState(),
      loop: true,
    })
  }

  update(): void {
    const speed = 180
    const jumpForce = -380
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const grounded = body.blocked.down || body.touching.down

    let vx = 0
    if (this.cursors?.left.isDown || this.wasd?.A.isDown || this.moveLeft) vx = -speed
    else if (this.cursors?.right.isDown || this.wasd?.D.isDown || this.moveRight) vx = speed
    this.player.setVelocityX(vx)

    const jump = this.cursors?.up.isDown || this.wasd?.W.isDown || this.jumpPressed
    if (jump && grounded) {
      this.player.setVelocityY(jumpForce)
    }

    if (vx < 0) this.player.setFlipX(true)
    else if (vx > 0) this.player.setFlipX(false)

    this.playerLabel.setPosition(this.player.x, this.player.y - 36)

    // Interpolate remote
    if (this.remoteConnected) {
      const dx = this.remoteTarget.x - this.remotePlayer.x
      const dy = this.remoteTarget.y - this.remotePlayer.y
      this.remotePlayer.setVelocity(dx * 10, dy * 10)
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
    this.remotePlayer.setVisible(false)
    this.remotePlayer.setPosition(-100, -100)
  }

  setActiveControls(controls: { left: boolean; right: boolean; jump: boolean }): void {
    this.moveLeft = controls.left
    this.moveRight = controls.right
    this.jumpPressed = controls.jump
  }

  private syncState(): void {
    if (!this.onStateUpdate) return
    const now = Date.now()
    if (now - this.lastSyncTime < this.syncInterval) return
    this.lastSyncTime = now
    const body = this.player.body as Phaser.Physics.Arcade.Body
    this.onStateUpdate({
      x: this.player.x,
      y: this.player.y,
      vx: body.velocity.x,
      vy: body.velocity.y,
      grounded: body.blocked.down || body.touching.down,
      facing: this.player.flipX ? -1 : 1,
    })
  }

  shutdown(): void {
    this.remoteConnected = false
  }
}
