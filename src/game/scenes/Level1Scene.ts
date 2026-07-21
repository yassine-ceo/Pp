'use client'

import * as Phaser from 'phaser'
import { updatePlayerPosition } from '../systems/NetworkSync'

const WORLD_W = 5000
const WORLD_H = 600
const GROUND_Y = 568

interface Level1InitData {
  roomCode?: string
}

export default class Level1Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private remotePlayer!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private bullets!: Phaser.Physics.Arcade.Group
  private playerLabel!: Phaser.GameObjects.Text
  private remoteLabel!: Phaser.GameObjects.Text
  private hudName!: Phaser.GameObjects.Text
  private hudHP!: Phaser.GameObjects.Graphics
  private hudRemoteName!: Phaser.GameObjects.Text
  private hudRemoteHP!: Phaser.GameObjects.Graphics

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private keyF!: Phaser.Input.Keyboard.Key

  private moveLeft = false
  private moveRight = false
  private jumpPressed = false

  private remoteTarget = { x: 0, y: 0 }
  private remoteConnected = false

  private localHP = 100
  private localMaxHP = 100
  private remoteHP = 100
  private remoteName = ''
  private remotePlayerId = ''

  private lastShootTimeSent = 0
  private lastShootTimeProcessed = 0

  private shootCooldown = false

  private roomCode = ''

  private lastSyncTime = 0
  private syncInterval = 50
  private onStateUpdate: ((data: Record<string, any>) => void) | null = null

  constructor() {
    super({ key: 'Level1Scene' })
  }

  init(data: Level1InitData): void {
    this.remoteConnected = false
    this.remoteTarget = { x: 0, y: 0 }
    this.moveLeft = false
    this.moveRight = false
    this.jumpPressed = false
    this.localHP = 100
    this.remoteHP = 100
    this.remoteName = ''
    this.remotePlayerId = ''
    this.lastShootTimeSent = 0
    this.lastShootTimeProcessed = 0
    this.shootCooldown = false
    this.roomCode = data?.roomCode ?? ''
  }

  setCallbacks(
    onStateUpdate: (data: Record<string, any>) => void,
  ): void {
    this.onStateUpdate = onStateUpdate
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.setBackgroundColor('#5c94fc')

    // Parallax hills (far background)
    const hills = this.add.graphics()
    hills.fillStyle(0x3a8c2e, 0.3)
    for (let x = 0; x < WORLD_W; x += 200) {
      const h = 80 + Math.random() * 120
      hills.fillEllipse(x + 100, WORLD_H - h / 2, 240, h)
    }
    hills.setDepth(-8)

    // Clouds (mid background)
    const cloudPositions: [number, number][] = [
      [180, 80], [520, 130], [900, 60], [1280, 140], [1650, 90],
      [2000, 120], [2400, 70], [2750, 140], [3100, 80], [3450, 110],
      [3800, 60], [4200, 130], [4600, 90], [4900, 50],
    ]
    for (const [cx, cy] of cloudPositions) {
      this.add.image(cx, cy, 'cloud').setAlpha(0.9).setDepth(-5)
    }

    const smallCloudPositions: [number, number][] = [
      [350, 160], [1100, 170], [1900, 150], [2550, 180], [3350, 160], [4050, 170], [4750, 150],
    ]
    for (const [cx, cy] of smallCloudPositions) {
      this.add.image(cx, cy, 'cloud').setAlpha(0.5).setScale(0.5).setDepth(-5)
    }

    // Platforms
    this.platforms = this.physics.add.staticGroup()

    const groundSegments: [number, number][] = [
      [0, 2240], [2420, 3520], [3700, WORLD_W],
    ]
    for (const [start, end] of groundSegments) {
      for (let x = start; x < end; x += 32) {
        this.platforms.create(x + 16, GROUND_Y, 'ground')
      }
    }

    this.platforms.create(2300, 440, 'brick')
    this.platforms.create(2360, 440, 'brick')
    this.platforms.create(3580, 440, 'brick')
    this.platforms.create(3640, 360, 'brick')

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

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j <= i; j++) {
        this.platforms.create(850 + i * 32, GROUND_Y - 16 - j * 32, 'brick')
      }
    }

    for (let y = GROUND_Y - 16; y > GROUND_Y - 200; y -= 32) {
      this.platforms.create(4400, y, 'brick')
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4 - i; j++) {
        this.platforms.create(1550 + i * 32, GROUND_Y - 16 - j * 32, 'brick')
      }
    }

    // Bullet pool
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 30,
      allowGravity: false,
    })

    // Player
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

    // Remote player — physics sprite, immovable, no gravity (for overlap detection only)
    this.remotePlayer = this.physics.add.sprite(-100, -100, 'remotePlayer')
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setDepth(2)
    const rBody = this.remotePlayer.body as Phaser.Physics.Arcade.Body
    rBody.allowGravity = false
    rBody.immovable = true
    rBody.setSize(20, 40)
    rBody.setOffset(6, 8)

    this.remoteLabel = this.add.text(-100, -100, '', {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Colliders
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.bullets, this.platforms, this.onBulletHitPlatform, undefined, this)
    this.physics.add.overlap(this.bullets, this.player, this.onBulletHitLocal, undefined, this)
    this.physics.add.overlap(this.bullets, this.remotePlayer, this.onBulletHitRemote, undefined, this)

    // HUD — fixed to camera
    this.hudName = this.add.text(12, 12, 'You', {
      fontSize: '11px',
      color: '#000000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(100)

    this.hudHP = this.add.graphics().setScrollFactor(0).setDepth(100)

    this.hudRemoteName = this.add.text(12, 48, '', {
      fontSize: '11px',
      color: '#000000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(100)

    this.hudRemoteHP = this.add.graphics().setScrollFactor(0).setDepth(100)

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setDeadzone(80, 40)

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
      this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
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

    // Keyboard shoot
    if (this.keyF && Phaser.Input.Keyboard.JustDown(this.keyF)) {
      this.fireBullet()
    }

    // Fall death zone
    if (this.player.y > WORLD_H + 50) {
      this.player.setPosition(80, GROUND_Y - 60)
      this.player.setVelocity(0, 0)
    }

    // Remote player — smooth lerp (direct position, no velocity)
    if (this.remoteConnected) {
      this.remotePlayer.x += (this.remoteTarget.x - this.remotePlayer.x) * 0.12
      this.remotePlayer.y += (this.remoteTarget.y - this.remotePlayer.y) * 0.12
      this.remoteLabel.setPosition(this.remotePlayer.x, this.remotePlayer.y - 36)
    }

    // Clean up out-of-bounds bullets
    this.bullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (!bullet.active) return
      if (bullet.x < -50 || bullet.x > WORLD_W + 50 || bullet.y < -50 || bullet.y > WORLD_H + 50) {
        this.bullets.killAndHide(bullet)
        bullet.body!.enable = false
      }
    })

    // HUD
    this.drawHUD()
  }

  // ---- Shooting ----

  fireBullet(): void {
    if (this.shootCooldown) return
    this.shootCooldown = true
    this.time.delayedCall(300, () => { this.shootCooldown = false })

    const dir = this.player.flipX ? -1 : 1
    const bullet = this.bullets.get(this.player.x + dir * 20, this.player.y - 8) as Phaser.Physics.Arcade.Sprite
    if (!bullet) return

    bullet.setActive(true).setVisible(true)
    bullet.body!.enable = true
    bullet.body!.setSize(8, 8)
    bullet.setVelocityX(dir * 700)
    bullet.setData('firedBy', 'local')

    // Recoil flash
    this.player.setTint(0xffffff)
    this.time.delayedCall(60, () => this.player.clearTint())

    // Sync shoot action via next state push
    this.lastShootTimeSent = Date.now()
  }

  private spawnRemoteBullet(x: number, y: number, facing: number): void {
    const bullet = this.bullets.get(x + facing * 20, y - 8) as Phaser.Physics.Arcade.Sprite
    if (!bullet) return

    bullet.setActive(true).setVisible(true)
    bullet.body!.enable = true
    bullet.body!.setSize(8, 8)
    bullet.setVelocityX(facing * 700)
    bullet.setData('firedBy', 'remote')
  }

  // ---- Collision callbacks ----

  private onBulletHitPlatform(obj1: any): void {
    const bullet = obj1 as Phaser.Physics.Arcade.Sprite
    if (!bullet.active) return
    this.spawnImpact(bullet.x, bullet.y)
    this.bullets.killAndHide(bullet)
    bullet.body!.enable = false
  }

  private onBulletHitLocal(obj1: any): void {
    const bullet = obj1 as Phaser.Physics.Arcade.Sprite
    if (!bullet.active || bullet.getData('firedBy') !== 'remote') return
    this.localHP = Math.max(0, this.localHP - 10)
    this.spawnImpact(bullet.x, this.player.y)
    this.bullets.killAndHide(bullet)
    bullet.body!.enable = false
    this.player.setTint(0xff4444)
    this.time.delayedCall(150, () => this.player.clearTint())
  }

  private onBulletHitRemote(obj1: any): void {
    const bullet = obj1 as Phaser.Physics.Arcade.Sprite
    if (!bullet.active || bullet.getData('firedBy') !== 'local') return
    this.remoteHP = Math.max(0, this.remoteHP - 10)
    this.spawnImpact(bullet.x, this.remotePlayer.y)
    this.bullets.killAndHide(bullet)
    bullet.body!.enable = false

    // Sync remote HP to Firebase
    if (this.remotePlayerId && this.roomCode) {
      updatePlayerPosition(this.roomCode, this.remotePlayerId, { hp: this.remoteHP }).catch(() => {})
    }
  }

  // ---- Visual effects ----

  private spawnImpact(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(x, y, 2 + Math.random() * 3, 0xffdd44, 1)
      p.setDepth(5)
      const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.4
      const dist = 18 + Math.random() * 28
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 180 + Math.random() * 150,
        onComplete: () => p.destroy(),
      })
    }
  }

  // ---- HUD ----

  private drawHUD(): void {
    const barX = 12
    const barH = 10
    const barW = 100

    // Local HP bar
    this.hudHP.clear()
    this.hudHP.fillStyle(0x333333)
    this.hudHP.fillRect(barX, 26, barW, barH)
    const localPct = this.localHP / this.localMaxHP
    this.hudHP.fillStyle(localPct > 0.3 ? 0xff3333 : 0xff8800)
    this.hudHP.fillRect(barX, 26, barW * localPct, barH)
    this.hudHP.lineStyle(1, 0xffffff, 0.2)
    this.hudHP.strokeRect(barX, 26, barW, barH)

    // Remote HP bar (only when connected)
    this.hudRemoteHP.clear()
    if (this.remoteConnected) {
      this.hudRemoteHP.fillStyle(0x333333)
      this.hudRemoteHP.fillRect(barX, 62, barW, barH)
      const remotePct = this.remoteHP / this.localMaxHP
      this.hudRemoteHP.fillStyle(remotePct > 0.3 ? 0xff3333 : 0xff8800)
      this.hudRemoteHP.fillRect(barX, 62, barW * remotePct, barH)
      this.hudRemoteHP.lineStyle(1, 0xffffff, 0.2)
      this.hudRemoteHP.strokeRect(barX, 62, barW, barH)
    }
  }

  // ---- Remote state ----

  setRemotePosition(x: number, y: number, facing: number, hp?: number, name?: string, lastShootTime?: number, shootFacing?: number, remoteId?: string): void {
    this.remoteTarget.x = x
    this.remoteTarget.y = y
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setFlipX(facing < 0)
    this.remoteConnected = true

    if (hp !== undefined) this.remoteHP = hp
    if (name !== undefined) {
      this.remoteName = name
      this.remoteLabel.setText(name)
      this.hudRemoteName.setText(name)
    }
    if (remoteId !== undefined) this.remotePlayerId = remoteId

    // Handle remote shoot action
    if (lastShootTime && lastShootTime > this.lastShootTimeProcessed) {
      this.lastShootTimeProcessed = lastShootTime
      this.spawnRemoteBullet(x, y, shootFacing ?? facing)
    }
  }

  setRemoteDisconnected(): void {
    this.remoteConnected = false
    this.remotePlayer.setPosition(-100, -100)
    this.remoteLabel.setPosition(-100, -100)
    this.hudRemoteName.setText('')
  }

  setActiveControls(controls: { left: boolean; right: boolean; jump: boolean }): void {
    this.moveLeft = controls.left
    this.moveRight = controls.right
    this.jumpPressed = controls.jump
  }

  // ---- Sync ----

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
      hp: this.localHP,
      lastShootTime: this.lastShootTimeSent,
      shootFacing: this.player.flipX ? -1 : 1,
    })
  }

  shutdown(): void {
    this.remoteConnected = false
  }
}
