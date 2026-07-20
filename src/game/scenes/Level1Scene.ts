'use client'

import * as Phaser from 'phaser'

const WORLD_W = 5000
const WORLD_H = 600
const GROUND_Y = 568

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
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.setBackgroundColor('#5c94fc')

    // --- Parallax hills (far background) ---
    const hills = this.add.graphics()
    hills.fillStyle(0x3a8c2e, 0.3)
    for (let x = 0; x < WORLD_W; x += 200) {
      const h = 80 + Math.random() * 120
      hills.fillEllipse(x + 100, WORLD_H - h / 2, 240, h)
    }
    hills.setDepth(-8)

    // --- Clouds (mid background) ---
    const cloudPositions = [
      [180, 80], [520, 130], [900, 60], [1280, 140], [1650, 90],
      [2000, 120], [2400, 70], [2750, 140], [3100, 80], [3450, 110],
      [3800, 60], [4200, 130], [4600, 90], [4900, 50],
    ]
    for (const [cx, cy] of cloudPositions) {
      this.add.image(cx, cy, 'cloud').setAlpha(0.9).setDepth(-5)
    }

    // --- Small background clouds ---
    const smallCloudPositions = [
      [350, 160], [1100, 170], [1900, 150], [2550, 180], [3350, 160], [4050, 170], [4750, 150],
    ]
    for (const [cx, cy] of smallCloudPositions) {
      this.add.image(cx, cy, 'cloud').setAlpha(0.5).setScale(0.5).setDepth(-5)
    }

    // --- Platforms ---
    this.platforms = this.physics.add.staticGroup()

    // Ground segments with gaps
    const groundSegments = [
      [0, 2240],
      [2420, 3520],
      [3700, WORLD_W],
    ] as [number, number][]

    for (const [start, end] of groundSegments) {
      for (let x = start; x < end; x += 32) {
        this.platforms.create(x + 16, GROUND_Y, 'ground')
      }
    }

    // Gap 1 stepping stones
    this.platforms.create(2300, 440, 'brick')
    this.platforms.create(2360, 440, 'brick')

    // Gap 2 stepping stones (ascending)
    this.platforms.create(3580, 440, 'brick')
    this.platforms.create(3640, 360, 'brick')

    // Scattered brick platforms
    const brickPositions: [number, number][] = [
      [300, 420], [500, 340], [700, 420],
      [1000, 400], [1150, 300], [1300, 420],
      [1500, 340], [1700, 280], [1900, 400],
      [2100, 340], [2250, 420],
      [2550, 380], [2700, 300], [2850, 420],
      [3050, 340], [3200, 260], [3400, 400],
      [3550, 300],
      [3850, 420], [4000, 340], [4150, 260],
      [4350, 400], [4500, 320], [4650, 380],
      [4850, 300], [4950, 420],
    ]
    for (const [bx, by] of brickPositions) {
      this.platforms.create(bx, by, 'brick')
    }

    // Staircase up (x=850 area)
    const stairBaseX = 850
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j <= i; j++) {
        this.platforms.create(stairBaseX + i * 32, GROUND_Y - 16 - j * 32, 'brick')
      }
    }

    // Tall column at x=4400
    for (let y = GROUND_Y - 16; y > GROUND_Y - 200; y -= 32) {
      this.platforms.create(4400, y, 'brick')
    }

    // Brick staircase descending (x=1550)
    const stairBaseX2 = 1550
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4 - i; j++) {
        this.platforms.create(stairBaseX2 + i * 32, GROUND_Y - 16 - j * 32, 'brick')
      }
    }

    // --- Player ---
    this.player = this.physics.add.sprite(80, GROUND_Y - 60, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(2)
    const pBody = this.player.body as Phaser.Physics.Arcade.Body
    pBody.setSize(20, 40)
    pBody.setOffset(6, 8)
    pBody.setGravityY(600)

    this.playerLabel = this.add.text(this.player.x, this.player.y - 36, 'You', {
      fontSize: '10px',
      color: '#d4a84b',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // --- Remote player ---
    this.remotePlayer = this.physics.add.sprite(-100, -100, 'remotePlayer')
    this.remotePlayer.setVisible(false)
    this.remotePlayer.setDepth(2)
    const rBody = this.remotePlayer.body as Phaser.Physics.Arcade.Body
    rBody.setSize(20, 40)
    rBody.setOffset(6, 8)
    rBody.setGravityY(600)

    this.remoteLabel = this.add.text(-100, -100, '', {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // --- Collisions ---
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.remotePlayer, this.platforms)

    // --- Camera ---
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setDeadzone(80, 40)

    // --- Input ---
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
    }

    // --- Sync loop ---
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

    // Fall death zone
    if (this.player.y > WORLD_H + 50) {
      this.player.setPosition(80, GROUND_Y - 60)
      this.player.setVelocity(0, 0)
    }

    // Remote interpolate
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
