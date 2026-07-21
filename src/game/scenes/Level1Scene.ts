'use client'

import * as Phaser from 'phaser'
import { updatePlayerPosition } from '../systems/NetworkSync'

const WORLD_W = 5000
const WORLD_H = 740
const LERP_FACTOR = 0.2
const TELEPORT_THRESHOLD = 150

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

  private parachuting = false
  private hasLanded = false
  private parachuteSprite: Phaser.GameObjects.Graphics | null = null
  private landingText: Phaser.GameObjects.Text | null = null
  private readonly PARACHUTE_GRAVITY = 80
  private readonly NORMAL_GRAVITY = 600
  private readonly PARACHUTE_DESCENT_SPEED = 70
  private readonly SPAWN_X = 80
  private readonly SPAWN_Y_AIR = 60

  private groundY = 0

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
    this.parachuting = true
    this.hasLanded = false
  }

  setCallbacks(
    onStateUpdate: (data: Record<string, any>) => void,
  ): void {
    this.onStateUpdate = onStateUpdate
  }

  create(): void {
    this.groundY = this.scale.height - 150
    const g = this.groundY

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.setBackgroundColor('#5c94fc')
    try { (this.game.canvas as HTMLCanvasElement).style.backgroundColor = '#5c94fc' } catch {}

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

    // Solid dirt fill below ground
    const dirtFill = this.add.graphics()
    dirtFill.fillStyle(0x8B4513)
    const fillTopY = g - 32
    for (const [start, end] of groundSegments) {
      dirtFill.fillRect(start, fillTopY, end - start, WORLD_H - fillTopY)
    }
    dirtFill.setDepth(-1)

    // Ground tiles
    for (const [start, end] of groundSegments) {
      for (let x = start; x < end; x += 32) {
        this.platforms.create(x + 16, g, 'ground')
      }
    }

    this.platforms.create(2300, 442, 'brick')
    this.platforms.create(2360, 442, 'brick')
    this.platforms.create(3580, 442, 'brick')
    this.platforms.create(3640, 362, 'brick')

    const brickPositions: [number, number][] = [
      [300, 422], [500, 342], [700, 422],
      [1000, 402], [1150, 302], [1300, 422],
      [1500, 342], [1700, 282], [1900, 402],
      [2100, 342], [2250, 422],
      [2550, 382], [2700, 302], [2850, 422],
      [3050, 342], [3200, 262], [3400, 402],
      [3550, 302],
      [3850, 422], [4000, 342], [4150, 262],
      [4350, 402], [4500, 322], [4650, 382],
      [4850, 302], [4950, 422],
    ]
    for (const [bx, by] of brickPositions) {
      this.platforms.create(bx, by, 'brick')
    }

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j <= i; j++) {
        this.platforms.create(850 + i * 32, g - 16 - j * 32, 'brick')
      }
    }

    for (let y = g - 16; y > g - 200; y -= 32) {
      this.platforms.create(4400, y, 'brick')
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4 - i; j++) {
        this.platforms.create(1550 + i * 32, g - 16 - j * 32, 'brick')
      }
    }

    // Bullet pool
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 30,
      allowGravity: false,
    })

    // Player
    this.player = this.physics.add.sprite(this.SPAWN_X, this.SPAWN_Y_AIR, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(2)
    const pBody = this.player.body as Phaser.Physics.Arcade.Body
    pBody.setSize(20, 40)
    pBody.setOffset(6, 8)
    pBody.setGravityY(this.PARACHUTE_GRAVITY)

    this.playerLabel = this.add.text(this.player.x, this.player.y - 36, 'You', {
      fontSize: '10px',
      color: '#d4a84b',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Parachute visual
    this.parachuteSprite = this.add.graphics().setDepth(6)
    this.landingText = this.add.text(WORLD_W / 2, 40, 'Parachuting...', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0)

    // Remote player — physics sprite with ALL physical interactions disabled
    // Body exists for overlap detection only; no gravity, no movement, no collision
    this.remotePlayer = this.physics.add.sprite(-100, -100, 'remotePlayer')
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setDepth(2)
    const rBody = this.remotePlayer.body as Phaser.Physics.Arcade.Body
    rBody.allowGravity = false
    rBody.moves = false
    rBody.immovable = true
    rBody.checkCollision.none = true

    this.remoteLabel = this.add.text(-100, -100, '', {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Colliders
    this.physics.add.collider(this.player, this.platforms, this.onPlayerLanded, undefined, this)
    this.physics.add.collider(this.bullets, this.platforms, this.onBulletHitPlatform, undefined, this)
    this.physics.add.overlap(this.bullets, this.player, this.onBulletHitLocal, undefined, this)
    this.physics.add.overlap(this.bullets, this.remotePlayer, this.onBulletHitRemote, undefined, this)

    // HUD
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

    this.game.events.emit('scene-ready', 'Level1Scene')
  }

  update(): void {
    const speed = 180
    const jumpForce = -380
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const grounded = body.blocked.down || body.touching.down
    const g = this.groundY

    // Parachute logic
    if (this.parachuting) {
      body.setGravityY(this.PARACHUTE_GRAVITY)
      if (body.velocity.y < this.PARACHUTE_DESCENT_SPEED) {
        body.setVelocityY(this.PARACHUTE_DESCENT_SPEED)
      }
      this.player.setVelocityX(0)
      this.drawParachute()
      if (this.landingText) {
        this.landingText.setPosition(this.cameras.main.scrollX + WORLD_W / 2, this.cameras.main.scrollY + 40)
      }
    } else {
      if (this.landingText) {
        this.landingText.setText('')
      }
      if (this.parachuteSprite) {
        this.parachuteSprite.clear()
      }

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
    }

    this.playerLabel.setPosition(this.player.x, this.player.y - 36)

    if (!this.parachuting && this.keyF && Phaser.Input.Keyboard.JustDown(this.keyF)) {
      this.fireBullet()
    }

    // Fall death zone
    if (this.player.y > WORLD_H + 50) {
      this.player.setPosition(this.SPAWN_X, this.SPAWN_Y_AIR)
      this.player.setVelocity(0, 0)
      this.parachuting = true
      this.hasLanded = false
      const pBody = this.player.body as Phaser.Physics.Arcade.Body
      pBody.setGravityY(this.PARACHUTE_GRAVITY)
      if (this.landingText) this.landingText.setText('Parachuting...')
    }

    // Remote player — delta-time lerp with teleport threshold
    // 100% visual ghost: body.checkCollision.none, allowGravity=false, moves=false
    if (this.remoteConnected && this.remotePlayer?.active) {
      const dist = Phaser.Math.Distance.Between(this.remotePlayer.x, this.remotePlayer.y, this.remoteTarget.x, this.remoteTarget.y)
      if (dist > TELEPORT_THRESHOLD) {
        this.remotePlayer.x = this.remoteTarget.x
        this.remotePlayer.y = this.remoteTarget.y
      } else {
        this.remotePlayer.x = Phaser.Math.Linear(this.remotePlayer.x, this.remoteTarget.x, LERP_FACTOR)
        this.remotePlayer.y = Phaser.Math.Linear(this.remotePlayer.y, this.remoteTarget.y, LERP_FACTOR)
      }
      this.remoteLabel.setPosition(this.remotePlayer.x, this.remotePlayer.y - 36)
    }

    // Bullet out-of-bounds cleanup
    this.bullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (!bullet.active) return
      if (bullet.x < -50 || bullet.x > WORLD_W + 50 || bullet.y < -50 || bullet.y > WORLD_H + 50) {
        this.bullets.killAndHide(bullet)
        bullet.body!.enable = false
      }
    })

    this.drawHUD()
  }

  // ---- Landing callback ----

  private onPlayerLanded(): void {
    if (this.parachuting) {
      this.parachuting = false
      this.hasLanded = true
      const pBody = this.player.body as Phaser.Physics.Arcade.Body
      pBody.setGravityY(this.NORMAL_GRAVITY)
      if (this.parachuteSprite) this.parachuteSprite.clear()
      if (this.landingText) this.landingText.setText('')
      this.spawnLandingEffect(this.player.x, this.player.y)
    }
  }

  // ---- Parachute visual ----

  private drawParachute(): void {
    if (!this.parachuteSprite) return
    this.parachuteSprite.clear()
    const px = this.player.x
    const py = this.player.y
    this.parachuteSprite.fillStyle(0xd4a84b, 0.6)
    this.parachuteSprite.beginPath()
    this.parachuteSprite.arc(px, py - 42, 20, Math.PI, 0, false)
    this.parachuteSprite.fillPath()
    this.parachuteSprite.lineStyle(1, 0xffdd88, 0.4)
    this.parachuteSprite.beginPath()
    this.parachuteSprite.moveTo(px - 18, py - 42)
    this.parachuteSprite.lineTo(px - 10, py - 24)
    this.parachuteSprite.moveTo(px - 9, py - 42)
    this.parachuteSprite.lineTo(px - 5, py - 24)
    this.parachuteSprite.moveTo(px + 9, py - 42)
    this.parachuteSprite.lineTo(px + 5, py - 24)
    this.parachuteSprite.moveTo(px + 18, py - 42)
    this.parachuteSprite.lineTo(px + 10, py - 24)
    this.parachuteSprite.strokePath()
  }

  // ---- Landing effect ----

  private spawnLandingEffect(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const p = this.add.circle(x, y, 2 + Math.random() * 3, 0xeedd99, 1)
      p.setDepth(5)
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8
      const dist = 12 + Math.random() * 20
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 250 + Math.random() * 200,
        onComplete: () => p.destroy(),
      })
    }
  }

  // ---- Shooting ----

  fireBullet(): void {
    if (this.shootCooldown || this.parachuting) return
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

    this.player.setTint(0xffffff)
    this.time.delayedCall(60, () => this.player.clearTint())

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

    this.hudHP.clear()
    this.hudHP.fillStyle(0x333333)
    this.hudHP.fillRect(barX, 26, barW, barH)
    const localPct = this.localHP / this.localMaxHP
    this.hudHP.fillStyle(localPct > 0.3 ? 0xff3333 : 0xff8800)
    this.hudHP.fillRect(barX, 26, barW * localPct, barH)
    this.hudHP.lineStyle(1, 0xffffff, 0.2)
    this.hudHP.strokeRect(barX, 26, barW, barH)

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
    if (!this.remotePlayer) { this.remoteConnected = true; return }
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setFlipX(facing < 0)
    this.remoteConnected = true

    if (hp !== undefined) this.remoteHP = hp
    if (name !== undefined) {
      this.remoteName = name
      if (this.remoteLabel) this.remoteLabel.setText(name)
      if (this.hudRemoteName) this.hudRemoteName.setText(name)
    }
    if (remoteId !== undefined) this.remotePlayerId = remoteId

    if (lastShootTime && lastShootTime > this.lastShootTimeProcessed) {
      this.lastShootTimeProcessed = lastShootTime
      this.spawnRemoteBullet(x, y, shootFacing ?? facing)
    }
  }

  setRemoteDisconnected(): void {
    this.remoteConnected = false
    if (!this.remotePlayer) return
    this.remotePlayer.setPosition(-100, -100)
    if (this.remoteLabel) this.remoteLabel.setPosition(-100, -100)
    if (this.hudRemoteName) this.hudRemoteName.setText('')
  }

  setActiveControls(controls: { left: boolean; right: boolean; jump: boolean }): void {
    if (this.parachuting) return
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
