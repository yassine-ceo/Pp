'use client'

import * as Phaser from 'phaser'
import { updatePlayerPosition } from '../systems/NetworkSync'

const W = 360
const H = 740
const GROUND_TOP = 590
const PLATFORM_H = H - GROUND_TOP
const WORLD_W = 3960
const VEL_X = 80
const VEL_Y = 643
const LERP_FACTOR = 0.2
const TELEPORT_THRESHOLD = 150

const S = 2
const PS = 2
const BLOCK_S = H / 345
const TUBE_S = H / 345

interface Level1InitData {
  roomCode?: string
  playerState?: { x: number; y: number }
}

export default class Level1Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private remotePlayer!: Phaser.Physics.Arcade.Sprite
  private remoteLabel!: Phaser.GameObjects.Text
  private bullets!: Phaser.Physics.Arcade.Group
  private playerLabel!: Phaser.GameObjects.Text

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private keyF!: Phaser.Input.Keyboard.Key

  private moveLeft = false
  private moveRight = false
  private jumpPressed = false

  private remoteTarget = { x: 0, y: 0 }
  private remoteConnected = false
  private localHP = 100
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

  private parachuting = true
  private hasLanded = false
  private parachuteSprite: Phaser.GameObjects.Graphics | null = null
  private landingText: Phaser.GameObjects.Text | null = null
  private readonly PARACHUTE_GRAVITY = 80
  private readonly NORMAL_GRAVITY = 1000

  private playerStateVal: number = 0
  private score: number = 0
  private timeLeft: number = 300
  private levelStarted = false
  private gameOver = false
  private gameWinned = false
  private playerBlocked = false
  private playerInvulnerable = false
  private playerFiring = false
  private fireInCooldown = false
  private flagRaised = false
  private reachedLevelEnd = false

  private platformGroup!: Phaser.GameObjects.Group
  private blocksGroup!: Phaser.GameObjects.Group
  private misteryBlocksGroup!: Phaser.GameObjects.Group
  private immovableBlocksGroup!: Phaser.GameObjects.Group
  private constructionBlocksGroup!: Phaser.GameObjects.Group
  private goombasGroup!: Phaser.GameObjects.Group
  private groundCoinsGroup!: Phaser.GameObjects.Group
  private fallProtectionGroup!: Phaser.GameObjects.Group

  private worldHolesCoords: { start: number; end: number }[] = []
  private emptyBlocksList: Phaser.GameObjects.Sprite[] = []
  private furthestPlayerPos = 0

  private scoreText!: Phaser.GameObjects.BitmapText
  private timeLeftText!: Phaser.GameObjects.BitmapText
  private highScoreText!: Phaser.GameObjects.BitmapText
  private startScreenTrigger!: Phaser.GameObjects.TileSprite
  private finalFlagMast!: Phaser.GameObjects.TileSprite
  private finalFlag!: Phaser.GameObjects.Image
  private undergroundRoof: Phaser.GameObjects.TileSprite | null = null
  private verticalTube: Phaser.GameObjects.TileSprite | null = null
  private finalTrigger: Phaser.GameObjects.TileSprite | null = null
  private tpTube: Phaser.GameObjects.TileSprite | null = null
  private customBlock!: Phaser.GameObjects.Sprite

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

    this.playerStateVal = 0
    this.score = 0
    this.timeLeft = 300
    this.levelStarted = false
    this.gameOver = false
    this.gameWinned = false
    this.playerBlocked = false
    this.playerInvulnerable = false
    this.playerFiring = false
    this.fireInCooldown = false
    this.flagRaised = false
    this.reachedLevelEnd = false
    this.worldHolesCoords = []
    this.emptyBlocksList = []
    this.furthestPlayerPos = 0

    const ps = data?.playerState
    this.parachuting = !ps
    this.hasLanded = !!ps
  }

  setCallbacks(onStateUpdate: (data: Record<string, any>) => void): void {
    this.onStateUpdate = onStateUpdate
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_W, H)
    this.cameras.main.setBounds(0, 0, WORLD_W, H)
    this.cameras.main.setBackgroundColor('#5c94fc')
    try { (this.game.canvas as HTMLCanvasElement).style.backgroundColor = '#5c94fc' } catch {}

    this.createAnimations()
    this.createPlayerInternal()
    this.generateLevel()
    this.drawWorld()
    this.drawStartScreen()
    this.createGoombas()
    this.setupBulletColliders()
    this.createHUD()
    this.setupMultiplayer()
  }

  // ========== ANIMATIONS ==========

  private createAnimations(): void {
    this.anims.create({ key: 'idle', frames: [{ key: 'mario', frame: 0 }] })
    this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('mario', { start: 3, end: 1 }), frameRate: 12, repeat: -1 })
    this.anims.create({ key: 'hurt', frames: [{ key: 'mario', frame: 4 }] })
    this.anims.create({ key: 'jump', frames: [{ key: 'mario', frame: 5 }] })

    this.anims.create({ key: 'grown-mario-idle', frames: [{ key: 'mario-grown', frame: 0 }] })
    this.anims.create({ key: 'grown-mario-run', frames: this.anims.generateFrameNumbers('mario-grown', { start: 3, end: 1 }), frameRate: 12, repeat: -1 })
    this.anims.create({ key: 'grown-mario-crouch', frames: [{ key: 'mario-grown', frame: 4 }] })
    this.anims.create({ key: 'grown-mario-jump', frames: [{ key: 'mario-grown', frame: 5 }] })

    this.anims.create({ key: 'fire-mario-idle', frames: [{ key: 'mario-fire', frame: 0 }] })
    this.anims.create({ key: 'fire-mario-run', frames: this.anims.generateFrameNumbers('mario-fire', { start: 3, end: 1 }), frameRate: 12, repeat: -1 })
    this.anims.create({ key: 'fire-mario-crouch', frames: [{ key: 'mario-fire', frame: 4 }] })
    this.anims.create({ key: 'fire-mario-jump', frames: [{ key: 'mario-fire', frame: 5 }] })
    this.anims.create({ key: 'fire-mario-throw', frames: [{ key: 'mario-fire', frame: 6 }] })

    this.anims.create({ key: 'goomba-walk', frames: this.anims.generateFrameNumbers('goomba', { start: 0, end: 1 }), frameRate: 8, repeat: -1 })
    this.anims.create({ key: 'goomba-hurt', frames: [{ key: 'goomba', frame: 2 }] })
    this.anims.create({ key: 'goomba-idle', frames: [{ key: 'goomba', frame: 1 }] })

    this.anims.create({ key: 'coin-default', frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 3 }), frameRate: 10, repeat: -1 })
    this.anims.create({ key: 'mistery-block-default', frames: this.anims.generateFrameNumbers('mistery-block', { start: 2, end: 0 }), frameRate: 5, repeat: -1, repeatDelay: 5 })
    this.anims.create({ key: 'custom-block-default', frames: this.anims.generateFrameNumbers('custom-block', { start: 2, end: 0 }), frameRate: 5, repeat: -1, repeatDelay: 5 })
    this.anims.create({ key: 'brick-debris-default', frames: this.anims.generateFrameNumbers('brick-debris', { start: 0, end: 3 }), frameRate: 4, repeat: -1 })
    this.anims.create({ key: 'ground-coin-default', frames: this.anims.generateFrameNumbers('ground-coin', { start: 2, end: 0 }), frameRate: 5, repeat: -1, repeatDelay: 5 })
    this.anims.create({ key: 'fire-flower-default', frames: this.anims.generateFrameNumbers('fire-flower', { start: 0, end: 3 }), frameRate: 10, repeat: -1 })

    this.anims.create({ key: 'fireball-left-down', frames: [{ key: 'fireball', frame: 0 }] })
    this.anims.create({ key: 'fireball-left-up', frames: [{ key: 'fireball', frame: 1 }] })
    this.anims.create({ key: 'fireball-right-down', frames: [{ key: 'fireball', frame: 2 }] })
    this.anims.create({ key: 'fireball-right-up', frames: [{ key: 'fireball', frame: 3 }] })
    this.anims.create({ key: 'fireball-explosion-1', frames: [{ key: 'fireball-explosion', frame: 0 }] })
    this.anims.create({ key: 'fireball-explosion-2', frames: [{ key: 'fireball-explosion', frame: 1 }] })
    this.anims.create({ key: 'fireball-explosion-3', frames: [{ key: 'fireball-explosion', frame: 2 }] })
  }

  // ========== WORLD GENERATION ==========

  private generateLevel(): void {
    this.platformGroup = this.add.group()
    this.fallProtectionGroup = this.add.group()
    this.blocksGroup = this.add.group()
    this.constructionBlocksGroup = this.add.group()
    this.misteryBlocksGroup = this.add.group()
    this.immovableBlocksGroup = this.add.group()
    this.groundCoinsGroup = this.add.group()

    const pieceCount = 100
    const pieceW = (WORLD_W - W) / pieceCount
    let pieceStart = W
    let lastWasHole = 0
    let lastWasStructure = 0

    for (let i = 0; i <= pieceCount; i++) {
      const num = Phaser.Math.Between(0, 100)
      const isHole = num < 10 && pieceStart > W * 2 && pieceStart < WORLD_W - W * 2
      const forcedNoHole = lastWasHole > 0 || lastWasStructure > 0 || pieceStart >= WORLD_W - pieceW * 4

      if (!isHole || forcedNoHole) {
        lastWasHole--
        const np = this.add.tileSprite(pieceStart, H, pieceW, PLATFORM_H, 'floorbricks').setScale(S).setOrigin(0, 0.5)
        this.physics.add.existing(np)
        ;(np.body as Phaser.Physics.Arcade.Body).immovable = true
        ;(np.body as Phaser.Physics.Arcade.Body).allowGravity = false
        np.setDepth(2)
        this.platformGroup.add(np)
        this.physics.add.collider(this.player, np)

        if (!(pieceStart >= WORLD_W - W * 1.5) && pieceStart > W + pieceW * 2 && lastWasHole < 1 && lastWasStructure < 1) {
          lastWasStructure = this.generateStructure(pieceStart, pieceW)
        } else {
          lastWasStructure--
        }
      } else {
        this.worldHolesCoords.push({ start: pieceStart, end: pieceStart + pieceW * 2 })
        lastWasHole = 2
      }
      pieceStart += pieceW * 2
    }

    this.fallProtectionGroup.getChildren().forEach((c: any) => {
      this.physics.add.existing(c)
      const cb = c.body as Phaser.Physics.Arcade.Body
      cb.allowGravity = false
      cb.immovable = true
    })

    const misteryBlocks = this.misteryBlocksGroup.getChildren()
    for (const mb of misteryBlocks) {
      this.physics.add.existing(mb as any)
      ;(mb as any).body.allowGravity = false
      ;(mb as any).body.immovable = true
      ;(mb as any).setDepth(2)
      ;(mb as any).anims.play('mistery-block-default', true)
      this.physics.add.collider(this.player, mb as any, this.revealHiddenBlock, undefined, this)
    }

    const blocks = this.blocksGroup.getChildren()
    for (const b of blocks) {
      this.physics.add.existing(b as any)
      ;(b as any).body.allowGravity = false
      ;(b as any).body.immovable = true
      ;(b as any).setDepth(2)
      this.physics.add.collider(this.player, b as any, this.destroyBlock, undefined, this as any)
    }

    const constructionBlocks = this.constructionBlocksGroup.getChildren()
    for (const cb of constructionBlocks) {
      this.physics.add.existing(cb as any)
      ;(cb as any).isImmovable = true
      ;(cb as any).body.allowGravity = false
      ;(cb as any).body.immovable = true
      ;(cb as any).setDepth(2)
      this.physics.add.collider(this.player, cb as any, this.destroyBlock, undefined, this as any)
    }

    const immovableBlocks = this.immovableBlocksGroup.getChildren()
    for (const ib of immovableBlocks) {
      this.physics.add.existing(ib as any)
      ;(ib as any).body.allowGravity = false
      ;(ib as any).body.immovable = true
      ;(ib as any).setDepth(2)
      this.physics.add.collider(this.player, ib as any)
    }

    const groundCoins = this.groundCoinsGroup.getChildren()
    for (const gc of groundCoins) {
      this.physics.add.existing(gc as any)
      ;(gc as any).anims.play('ground-coin-default', true)
      ;(gc as any).body.allowGravity = false
      ;(gc as any).body.immovable = true
      ;(gc as any).setDepth(2)
      this.physics.add.overlap(this.player, gc as any, this.collectCoin, undefined, this)
    }

    // Start screen trigger
    this.startScreenTrigger = this.add.tileSprite(W, GROUND_TOP, 32, 28, 'horizontal-tube').setScale(TUBE_S).setOrigin(1, 1)
    this.startScreenTrigger.setDepth(4)
    this.physics.add.existing(this.startScreenTrigger)
    ;(this.startScreenTrigger.body as Phaser.Physics.Arcade.Body).allowGravity = false
    ;(this.startScreenTrigger.body as Phaser.Physics.Arcade.Body).immovable = true
    this.physics.add.collider(this.player, this.startScreenTrigger, () => this.startLevel(), undefined, this)

    const invisibleWall = this.add.rectangle(W, GROUND_TOP, 1, H).setOrigin(0.5, 1)
    this.physics.add.existing(invisibleWall)
    ;(invisibleWall.body as Phaser.Physics.Arcade.Body).allowGravity = false
    ;(invisibleWall.body as Phaser.Physics.Arcade.Body).immovable = true
    this.physics.add.collider(this.player, invisibleWall)
    this.fallProtectionGroup.add(invisibleWall)
  }

  private generateStructure(pieceStart: number, pieceW: number): number {
    const rnd = Phaser.Math.Between(0, 5)
    switch (rnd) {
      case 0:
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(2.5, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(1.5, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-0.5, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-1.5, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 48, 16, 16, 'block').setScale(BLOCK_S).setOrigin(3.6, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 48, 16, 16, 'block').setScale(BLOCK_S).setOrigin(5.6, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 48, 'mistery-block').setScale(BLOCK_S).setOrigin(4.6, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 48, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-2.6, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 48, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-4.6, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 48, 'mistery-block').setScale(BLOCK_S).setOrigin(-3.6, 0.5))
        return Phaser.Math.Between(1, 3)
      case 1:
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(2.8, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(4.8, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(3.8, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-1.9, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-3.9, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-2.9, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 48, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-0.5, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 48, 16, 16, 'block').setScale(BLOCK_S).setOrigin(1.5, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 48, 'mistery-block').setScale(BLOCK_S))
        return Phaser.Math.Between(1, 3)
      case 2:
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(2.5, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-1.5, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 48, 'mistery-block').setScale(BLOCK_S))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(1.5, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-0.5, 0.5))
        return Phaser.Math.Between(1, 3)
      case 3:
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(0, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(1, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 32, 16, 16, 'block').setScale(BLOCK_S).setOrigin(2, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 32, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-1, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 32, 'mistery-block').setScale(BLOCK_S).setOrigin(0, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 32, 'mistery-block').setScale(BLOCK_S).setOrigin(1, 0.5))
        return Phaser.Math.Between(1, 3)
      case 4: {
        const r = Phaser.Math.Between(0, 4)
        if (r === 0) {
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 48, 'mistery-block').setScale(BLOCK_S))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-3, 0.5))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(4, 0.5))
        } else if (r === 1) {
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-3, 0.5))
        } else if (r === 2) {
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S))
        } else if (r === 3) {
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(1.5, 0.5))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-0.5, 0.5))
        } else {
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(1.75, 0.5))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(0.75, 0.5))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-0.25, 0.5))
          this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-1.25, 0.5))
        }
        return Phaser.Math.Between(1, 2)
      }
      default:
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(1.5, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(0.5, 0.5))
        this.blocksGroup.add(this.add.tileSprite(pieceStart, GROUND_TOP - 16, 16, 16, 'block').setScale(BLOCK_S).setOrigin(-1.5, 0.5))
        this.misteryBlocksGroup.add(this.add.sprite(pieceStart, GROUND_TOP - 16, 'mistery-block').setScale(BLOCK_S).setOrigin(-0.5, 0.5))
        return Phaser.Math.Between(1, 2)
    }
  }

  private drawWorld(): void {
    const propsY = GROUND_TOP
    this.add.rectangle(W, 0, WORLD_W, H, 0x8585FF).setOrigin(0).setDepth(-1)

    for (let i = 0; i < Phaser.Math.Between(Math.trunc(WORLD_W / 760), Math.trunc(WORLD_W / 380)); i++) {
      const x = this.randomCoord(false)
      const y = Phaser.Math.Between(H / 80, H / 2.2)
      this.add.image(x, y, Phaser.Math.Between(0, 10) < 5 ? 'cloud1' : 'cloud2').setOrigin(0).setScale(H / 1725)
    }
    for (let i = 0; i < Phaser.Math.Between(Math.trunc(WORLD_W / 6400), Math.trunc(WORLD_W / 3800)); i++) {
      const x = this.randomCoord()
      this.add.image(x, propsY, Phaser.Math.Between(0, 10) < 5 ? 'mountain1' : 'mountain2').setOrigin(0, 1).setScale(H / 517)
    }
    for (let i = 0; i < Phaser.Math.Between(Math.trunc(WORLD_W / 960), Math.trunc(WORLD_W / 760)); i++) {
      const x = this.randomCoord()
      this.add.image(x, propsY, Phaser.Math.Between(0, 10) < 5 ? 'bush1' : 'bush2').setOrigin(0, 1).setScale(H / 609)
    }
    for (let i = 0; i < Phaser.Math.Between(Math.trunc(WORLD_W / 4000), Math.trunc(WORLD_W / 2000)); i++) {
      const x = this.randomCoord()
      this.add.tileSprite(x, propsY, Phaser.Math.Between(100, 250), 35, 'fence').setOrigin(0, 1).setScale(H / 863)
    }

    this.finalFlagMast = this.add.tileSprite(WORLD_W - WORLD_W / 30, propsY, 16, 167, 'flag-mast').setOrigin(0, 1).setScale(H / 400)
    this.physics.add.existing(this.finalFlagMast)
    ;(this.finalFlagMast.body as Phaser.Physics.Arcade.Body).immovable = true
    ;(this.finalFlagMast.body as Phaser.Physics.Arcade.Body).allowGravity = false
    ;(this.finalFlagMast.body as Phaser.Physics.Arcade.Body).setSize(3, 167)
    this.physics.add.overlap(this.player, this.finalFlagMast, () => this.raiseFlag(), undefined, this)
    this.physics.add.collider(this.platformGroup.getChildren(), this.finalFlagMast)

    this.finalFlag = this.add.image(WORLD_W - WORLD_W / 30, propsY * 0.93, 'final-flag').setOrigin(0.5, 1).setScale(H / 400)
    this.add.image(WORLD_W - WORLD_W / 75, propsY, 'castle').setOrigin(0.5, 1).setScale(H / 300)
  }

  private randomCoord(entitie = false): number {
    const startPos = entitie ? W * 1.5 : W
    const endPos = entitie ? WORLD_W - W * 3 : WORLD_W
    let coord = Phaser.Math.Between(startPos, endPos)
    for (const hole of this.worldHolesCoords) {
      if (coord >= hole.start - 36 * 1.5 && coord <= hole.end) return this.randomCoord(entitie)
    }
    return coord
  }

  private drawStartScreen(): void {
    const cx = this.cameras.main.worldView.x + this.cameras.main.width / 2
    this.add.rectangle(0, 0, W, H, 0x8585FF).setOrigin(0).setDepth(-1)

    const platform = this.add.tileSprite(0, H, W / 2, PLATFORM_H, 'start-floorbricks').setScale(S).setOrigin(0, 0.5)
    this.physics.add.existing(platform)
    ;(platform.body as Phaser.Physics.Arcade.Body).immovable = true
    ;(platform.body as Phaser.Physics.Arcade.Body).allowGravity = false
    this.physics.add.collider(this.player, platform)

    this.add.image(W / 50, H / 3, 'cloud1').setScale(H / 1725)
    this.add.image(W / 1.25, H / 2, 'cloud1').setScale(H / 1725)
    this.add.image(W / 1.05, H / 6.5, 'cloud2').setScale(H / 1725)
    this.add.image(W / 3, H / 3.5, 'cloud2').setScale(H / 1725)
    this.add.image(W / 2.65, H / 2.8, 'cloud2').setScale(H / 1725)
    this.add.image(W / 25, H / 10, 'sign').setOrigin(0).setScale(H / 350)

    const propsY = GROUND_TOP
    this.add.image(W / 50, propsY, 'mountain2').setOrigin(0, 1).setScale(H / 517)
    this.add.image(W / 300, propsY, 'mountain1').setOrigin(0, 1).setScale(H / 517)
    this.add.image(W / 4, propsY, 'bush1').setOrigin(0, 1).setScale(H / 609)
    this.add.image(W / 1.55, propsY, 'bush2').setOrigin(0, 1).setScale(H / 609)
    this.add.image(W / 1.5, propsY, 'bush2').setOrigin(0, 1).setScale(H / 609)
    this.add.tileSprite(W / 15, propsY, 350, 35, 'fence').setOrigin(0, 1).setScale(H / 863)

    this.customBlock = this.add.sprite(cx, GROUND_TOP - 48, 'custom-block').setScale(BLOCK_S)
    this.customBlock.anims.play('custom-block-default')
    this.physics.add.collider(this.player, this.customBlock, () => {
      if ((this.player.body as Phaser.Physics.Arcade.Body).blocked.up) this.startLevel()
    }, undefined, this)
    this.physics.add.existing(this.customBlock)
    ;(this.customBlock.body as Phaser.Physics.Arcade.Body).allowGravity = false
    ;(this.customBlock.body as Phaser.Physics.Arcade.Body).immovable = true
  }

  // ========== PLAYER ==========

  private createPlayerInternal(): void {
    const spawnX = W / 2.5
    const spawnY = H - PLATFORM_H
    const hydX = this.parachuting ? spawnX : (this as any).hydrateX ?? spawnX
    const hydY = this.parachuting ? 60 : ((this as any).hydrateY ?? spawnY) - 5

    this.player = this.physics.add.sprite(hydX, hydY, 'mario').setOrigin(1).setBounce(0).setCollideWorldBounds(true).setScale(PS)
    this.player.setDepth(3)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setSize(14, 16)
    body.setOffset(1.3, 0.5)

    if (this.parachuting) {
      body.setGravityY(this.PARACHUTE_GRAVITY)
      this.parachuteSprite = this.add.graphics().setDepth(6)
      this.landingText = this.add.text(WORLD_W / 2, 40, 'Parachuting...', {
        fontSize: '12px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10).setScrollFactor(0)
    } else {
      body.setGravityY(this.NORMAL_GRAVITY)
    }

    this.playerLabel = this.add.text(this.player.x, this.player.y - 36, 'You', {
      fontSize: '10px', color: '#d4a84b', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    // Bullet pool
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet', maxSize: 30, allowGravity: false,
    })

    // Remote player
    this.remotePlayer = this.physics.add.sprite(-100, -100, 'remotePlayer')
    this.remotePlayer.setVisible(true)
    this.remotePlayer.setDepth(2)
    const rBody = this.remotePlayer.body as Phaser.Physics.Arcade.Body
    rBody.allowGravity = false
    rBody.moves = false
    rBody.immovable = true
    rBody.checkCollision.none = true

    this.remoteLabel = this.add.text(-100, -100, '', {
      fontSize: '10px', color: '#4a90d9', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3)

    this.physics.add.overlap(this.bullets, this.player, this.onBulletHitLocal, undefined, this)
    this.physics.add.overlap(this.bullets, this.remotePlayer, this.onBulletHitRemote, undefined, this)
  }

  // ========== ENEMIES ==========

  private createGoombas(): void {
    this.goombasGroup = this.add.group()
    const goombaSpeed = W / 19
    for (let i = 0; i < Math.trunc(WORLD_W / 960); i++) {
      const x = this.randomCoord(true)
      const goomba = this.physics.add.sprite(x, GROUND_TOP, 'goomba').setOrigin(0.5, 1).setBounce(1, 0).setScale(PS)
      goomba.anims.play('goomba-walk', true)
      goomba.setDepth(2)
      goomba.setVelocityX(Phaser.Math.Between(0, 10) <= 4 ? goombaSpeed : -goombaSpeed)
      goomba.setMaxVelocity(goombaSpeed, VEL_Y * 2)
      this.goombasGroup.add(goomba)

      this.physics.add.collider(goomba, this.platformGroup.getChildren())
      this.physics.add.collider(goomba, this.blocksGroup.getChildren())
      this.physics.add.collider(goomba, this.misteryBlocksGroup.getChildren())
      this.physics.add.collider(goomba, this.goombasGroup.getChildren())
      this.physics.add.collider(goomba, this.finalFlagMast)
      this.physics.add.overlap(this.player, goomba, this.checkGoombaCollision, undefined, this)
    }

    this.physics.add.collider(this.goombasGroup.getChildren(), this.immovableBlocksGroup.getChildren())
    this.physics.add.collider(this.goombasGroup.getChildren(), this.fallProtectionGroup.getChildren())
  }

  // ========== BULLET COLLIDERS ==========

  private setupBulletColliders(): void {
    if (!this.platformGroup) return
    this.physics.add.collider(this.bullets, this.platformGroup.getChildren(), this.onBulletHitPlatform, undefined, this)
  }

  // ========== HUD ==========

  private createHUD(): void {
    const posY = W / 23
    this.scoreText = this.add.bitmapText(W / 40, posY, 'carrier_command', '', W / 65).setScrollFactor(0).setDepth(5)
    this.highScoreText = this.add.bitmapText(W / 2, posY, 'carrier_command', 'HIGH SCORE\n 000000', W / 65).setOrigin(0.5, 0).setScrollFactor(0).setDepth(5)
    this.timeLeftText = this.add.bitmapText(W * 0.925, posY, 'carrier_command', 'TIME\n' + this.timeLeft.toString().padStart(3, '0'), W / 65).setOrigin(0.5, 0).setScrollFactor(0).setDepth(5)

    const hs = localStorage.getItem('high-score')
    if (hs) this.highScoreText.setText('HIGH SCORE\n' + hs.padStart(6, '0'))
    this.updateScore()
    this.updateTimer()
  }

  private updateScore(): void {
    if (!this.scoreText) return
    this.scoreText.setText('MARIO\n' + this.score.toString().padStart(6, '0'))
  }

  private updateTimer(): void {
    if (!this.timeLeftText || this.timeLeft <= 0 || (this.timeLeftText as any).stopped || this.playerBlocked) return
    if (!(this.timeLeftText as any).stopped) {
      this.timeLeft--
      this.timeLeftText.setText('TIME\n' + this.timeLeft.toString().padStart(3, '0'))
    }
    this.time.delayedCall(500, () => this.updateTimer())
  }

  private addToScore(num: number, origin?: any): void {
    for (let i = 1; i <= num; i++) {
      this.time.delayedCall(i, () => { this.score++; this.updateScore() })
    }
    if (!origin) return
    const te = this.add.bitmapText(origin.getBounds().x, origin.getBounds().y, 'carrier_command', '' + num, W / 150).setOrigin(0).setDepth(5)
    this.tweens.add({
      targets: te, duration: 600, y: te.y - H / 6.5,
      onComplete: () => { this.tweens.add({ targets: te, duration: 100, alpha: 0, onComplete: () => te.destroy() }) }
    })
  }

  // ========== LEVEL FLOW ==========

  private startLevel(): void {
    if (this.levelStarted) return
    this.levelStarted = true
    this.playerBlocked = true
    this.player.setVelocityX(5)
    this.player.anims.play('run', true)
    this.player.setFlipX(false)
    this.cameras.main.fadeOut(900, 0, 0, 0)

    this.time.delayedCall(1100, () => {
      this.player.x = W * 1.1
      this.player.y = GROUND_TOP - 20
      this.cameras.main.pan(W * 1.5, 0, 0)
      this.playerBlocked = false
      this.cameras.main.fadeIn(500, 0, 0, 0)
      this.startScreenTrigger.destroy()
      this.createHUD()
    })
  }

  private raiseFlag(): boolean {
    if (this.flagRaised) return false
    this.flagRaised = true
    this.playerBlocked = true
    this.cameras.main.stopFollow()
    ;(this.timeLeftText as any).stopped = true

    this.tweens.add({
      targets: this.finalFlag, duration: 1000, y: H / 2.2,
    })
    this.addToScore(2000, this.player)
    return false
  }

  // ========== BLOCK INTERACTIONS ==========

  private revealHiddenBlock(player: any, block: any): void {
    if (!player.body.blocked.up) return
    if (this.emptyBlocksList.includes(block)) return
    this.emptyBlocksList.push(block)
    block.anims.stop()
    block.setTexture('emptyBlock')
    this.tweens.add({
      targets: block, duration: 75, y: block.y - H / 34.5,
      onComplete: () => { this.tweens.add({ targets: block, duration: 75, y: block.y + H / 34.5 }) }
    })

    const rnd = Phaser.Math.Between(0, 100)
    if (rnd < 90) {
      this.addToScore(200, block)
      const coin = this.physics.add.sprite(block.getBounds().x, block.getBounds().y, 'coin').setScale(H / 357).setOrigin(0) as Phaser.Physics.Arcade.Sprite
      coin.anims.play('coin-default')
      ;(coin.body as Phaser.Physics.Arcade.Body).immovable = true
      coin.setDepth(0)
      this.tweens.add({
        targets: coin, duration: 250, y: coin.y - H / 8.25,
        onComplete: () => { this.tweens.add({ targets: coin, duration: 250, y: coin.y + H / 10.35, onComplete: () => coin.destroy() }) }
      })
    } else if (rnd < 96) {
      const mushroom = this.physics.add.sprite(block.getBounds().x, block.getBounds().y, 'super-mushroom').setScale(BLOCK_S).setOrigin(0).setBounce(1, 0)
      this.tweens.add({
        targets: mushroom, duration: 300, y: mushroom.y - H / 20,
        onComplete: () => {
          if (!mushroom) return
          mushroom.setVelocityX(Phaser.Math.Between(0, 10) <= 4 ? W / 15 : -W / 15)
        }
      })
      this.physics.add.overlap(this.player, mushroom, this.consumeMushroom, undefined, this)
      this.physics.add.collider(mushroom, this.misteryBlocksGroup.getChildren())
      this.physics.add.collider(mushroom, this.blocksGroup.getChildren())
      this.physics.add.collider(mushroom, this.platformGroup.getChildren())
      this.physics.add.collider(mushroom, this.immovableBlocksGroup.getChildren())
      this.physics.add.collider(mushroom, this.constructionBlocksGroup.getChildren())
    } else {
      const ff = this.physics.add.sprite(block.getBounds().x, block.getBounds().y, 'fire-flower').setScale(BLOCK_S).setOrigin(0)
      ;(ff.body as Phaser.Physics.Arcade.Body).immovable = true
      ;(ff.body as Phaser.Physics.Arcade.Body).allowGravity = false
      ff.anims.play('fire-flower-default', true)
      this.tweens.add({ targets: ff, duration: 300, y: ff.y - H / 23 })
      this.physics.add.overlap(this.player, ff, this.consumeFireflower, undefined, this)
    }
  }

  private destroyBlock(player: any, block: any): void {
    if (!player.body.blocked.up) return
    if (this.playerStateVal === 0 && !block.isImmovable) {
      this.tweens.add({
        targets: block, duration: 75, y: block.y - H / 69,
        onComplete: () => { this.tweens.add({ targets: block, duration: 75, y: block.y + H / 69 }) }
      })
    }
    if (this.playerStateVal > 0 && !(this.cursors?.down.isDown || this.moveLeft === undefined)) {
      this.addToScore(50)
      this.drawDestroyedBlockParticles(block)
      block.destroy()
    }
  }

  private drawDestroyedBlockParticles(block: any): void {
    const pb = this.player.getBounds()
    const bb = block.getBounds()
    const coords: [number, number][] = [
      [pb.left, bb.y], [pb.right, bb.y],
      [pb.left, bb.y + bb.height * 2.35], [pb.right, bb.y + bb.height * 2.35],
    ]
    for (const [cx, cy] of coords) {
      const p = this.physics.add.sprite(cx, cy, 'brick-debris') as Phaser.Physics.Arcade.Sprite
      p.anims.play('brick-debris-default', true)
      p.setVelocityY(cy === bb.y ? -(H / 3.45) : -(H / 2.6))
      p.setVelocityX(cx === pb.left ? -(W / 25.6) : W / 25.6)
      p.setScale(H / 517).setDepth(4)
    }
  }

  // ========== COLLECTIBLES ==========

  private consumeMushroom(player: any, mushroom: any): void {
    if (this.gameOver || this.gameWinned) return
    this.addToScore(1000, mushroom)
    mushroom.destroy()
    if (this.playerStateVal > 0) return
    this.growPlayer()
  }

  private consumeFireflower(player: any, ff: any): void {
    if (this.gameOver || this.gameWinned) return
    this.addToScore(1000, ff)
    ff.destroy()
    if (this.playerStateVal > 1) return
    if (this.playerStateVal === 0) this.growPlayer()
    this.playerStateVal = 2
  }

  private growPlayer(): void {
    this.playerBlocked = true
    this.anims.pauseAll()
    this.physics.pause()
    this.player.setTint(0xfefefe).anims.play('grown-mario-idle')
    let i = 0
    const interval = this.time.addEvent({
      delay: 100, repeat: 5,
      callback: () => {
        i++
        this.player.anims.play(i % 2 === 0 ? 'grown-mario-idle' : 'idle')
        if (i > 5) {
          this.player.clearTint()
          this.physics.resume()
          this.anims.resumeAll()
          this.playerBlocked = false
          this.playerStateVal = 1;
          (this.player.body as Phaser.Physics.Arcade.Body).setSize(14, 32).setOffset(2, 0)
        }
      }
    })
  }

  private collectCoin(player: any, coin: any): void {
    this.addToScore(200)
    coin.destroy()
  }

  // ========== ENEMY COLLISION ==========

  private checkGoombaCollision(player: any, goomba: any): void {
    if (goomba.dead || this.flagRaised) return
    const stomped = player.body.touching.down && goomba.body.touching.up
    if (this.playerInvulnerable && !stomped) return
    if (stomped) {
      goomba.anims.play('goomba-hurt', true)
      goomba.body.enable = false
      ;(goomba as any).dead = true
      this.goombasGroup.remove(goomba)
      this.player.setVelocityY(-VEL_Y / 1.5)
      this.addToScore(100, goomba)
      this.time.delayedCall(200, () => {
        this.tweens.add({ targets: goomba, duration: 300, alpha: 0 })
      })
      this.time.delayedCall(500, () => goomba.destroy())
      return
    }
    this.decreasePlayerState()
  }

  private decreasePlayerState(): void {
    if (this.playerStateVal <= 0) {
      this.gameOver = true
      this.gameOverFunc()
      return
    }
    this.playerBlocked = true
    this.physics.pause()
    this.anims.pauseAll()
    const anim1 = this.playerStateVal === 2 ? 'fire-mario-idle' : 'grown-mario-idle'
    const anim2 = this.playerStateVal === 2 ? 'grown-mario-idle' : 'idle'
    this.applyPlayerInvulnerability(3000)
    this.player.anims.play(anim2)
    let i = 0
    const interval = this.time.addEvent({
      delay: 100, repeat: 5,
      callback: () => {
        i++
        this.player.anims.play(i % 2 === 0 ? anim2 : anim1)
        if (i > 5) {
          this.physics.resume()
          this.anims.resumeAll()
          this.playerBlocked = false
        }
      }
    })
    this.playerStateVal--;
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(14, this.playerStateVal > 0 ? 32 : 16).setOffset(2, this.playerStateVal > 0 ? 0 : 0.5)
  }

  private applyPlayerInvulnerability(time: number): void {
    const blink = this.tweens.add({
      targets: this.player, duration: 100, alpha: { from: 1, to: 0.2 }, ease: 'Linear', repeat: -1, yoyo: true,
    })
    this.playerInvulnerable = true
    this.time.delayedCall(time, () => {
      this.playerInvulnerable = false
      blink.stop()
      this.player.alpha = 1
    })
  }

  // ========== GAME OVER / WIN ==========

  private gameOverFunc(): void {
    ;(this.timeLeftText as any).stopped = true;
    this.player.anims.play('hurt', true);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false
    ;(this.finalFlagMast.body as Phaser.Physics.Arcade.Body).enable = false
    this.goombasGroup.getChildren().forEach((g: any) => { g.anims.stop(); g.body.enable = false });
    this.platformGroup.getChildren().forEach((p: any) => p.body.enable = false);
    this.blocksGroup.getChildren().forEach((b: any) => b.body.enable = false);
    this.misteryBlocksGroup.getChildren().forEach((m: any) => m.body.enable = false);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(16, 16).setOffset(0)
    this.player.setVelocityX(0)
    this.time.delayedCall(500, () => {
      (this.player.body as Phaser.Physics.Arcade.Body).enable = true
      this.player.setVelocityY(-VEL_Y * 1.1)
    })
    this.time.delayedCall(3000, () => {
      this.player.setDepth(0)
      this.gameOverScreen()
      this.physics.pause()
    })
  }

  private gameOverScreen(outOfTime = false): void {
    const cx = this.cameras.main.worldView.x + this.cameras.main.width / 2
    const overlay = this.add.rectangle(0, H / 2, WORLD_W, H, 0x000000).setScrollFactor(0)
    overlay.alpha = 0
    overlay.setDepth(4)
    this.tweens.add({ targets: overlay, duration: 200, alpha: 1 })
    this.add.bitmapText(cx, H / 3, 'carrier_command', outOfTime ? 'TIME UP' : 'GAME OVER', W / 30).setOrigin(0.5).setDepth(5)
    this.add.bitmapText(cx, H / 2, 'carrier_command', '> PLAY AGAIN', W / 50).setOrigin(0.5).setInteractive().on('pointerdown', () => location.reload()).setDepth(5)
  }

  // ========== MULTIPLAYER SETUP ==========

  private setupMultiplayer(): void {
    this.game.events.emit('scene-ready', 'Level1Scene')

    // Auto-start level for reconnecting players (no parachute)
    if (!this.parachuting) {
      this.time.delayedCall(200, () => { this.startLevel() })
    }

    // Sync loop
    this.time.addEvent({
      delay: this.syncInterval,
      callback: () => this.syncState(),
      loop: true,
    })
  }

  // ========== UPDATE LOOP ==========

  update(): void {
    if (this.gameOver || this.gameWinned) return

    this.updatePlayerState()

    const body = this.player.body as Phaser.Physics.Arcade.Body
    const grounded = body.blocked.down || body.touching.down
    const g = GROUND_TOP

    // Fall death / parachute
    if (this.parachuting) {
      body.setGravityY(this.PARACHUTE_GRAVITY)
      if (body.velocity.y < 70) body.setVelocityY(70)
      this.player.setVelocityX(0)
      this.drawParachute()
      if (this.landingText) {
        this.landingText.setPosition(this.cameras.main.scrollX + WORLD_W / 2, this.cameras.main.scrollY + 40)
      }
      if (body.touching.down || body.blocked.down) {
        this.onPlayerLanded()
      }
    } else {
      if (this.landingText) this.landingText.setText('')
      if (this.parachuteSprite) this.parachuteSprite.clear()

      this.updatePlayerControls()
      this.playerLabel.setPosition(this.player.x, this.player.y - 36)
    }

    // Fall death
    if (this.player.y > H + 50) {
      this.player.setPosition(W / 2.5, 60)
      this.player.setVelocity(0, 0)
      this.parachuting = true
      this.hasLanded = false
      body.setGravityY(this.PARACHUTE_GRAVITY)
      if (this.landingText) this.landingText.setText('Parachuting...')
    }

    // Camera follow
    const pvx = body.velocity.x
    const cam = this.cameras.main
    if (pvx > 0 && this.levelStarted && !this.reachedLevelEnd && !(cam as any).isFollowing &&
        this.player.x >= W * 1.5 && this.player.x >= cam.worldView.x + cam.width / 2) {
      cam.startFollow(this.player, true, 0.1, 0.05)
      ;(cam as any).isFollowing = true
    }
    if (pvx < 0 && this.furthestPlayerPos < this.player.x && this.levelStarted && !this.reachedLevelEnd && (cam as any).isFollowing) {
      this.furthestPlayerPos = this.player.x
      this.physics.world.setBounds(cam.worldView.x, 0, WORLD_W, H)
      cam.setBounds(cam.worldView.x, 0, WORLD_W, H)
      cam.stopFollow()
      ;(cam as any).isFollowing = false
    }

    // Remote player lerp
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

    // Bullet cleanup
    this.bullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (!bullet.active) return
      if (bullet.x < -50 || bullet.x > WORLD_W + 50 || bullet.y < -50 || bullet.y > H + 50) {
        this.bullets.killAndHide(bullet)
        bullet.body!.enable = false
      }
    })
  }

  private updatePlayerState(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const grounded = body.blocked.down || body.touching.down

    // Win walking
    if (this.playerBlocked && this.flagRaised) {
      this.player.setVelocityX(W / 8.5)
      const anim = this.playerStateVal === 0 ? 'run' : this.playerStateVal === 1 ? 'grown-mario-run' : 'fire-mario-run'
      this.player.anims.play(anim, true)
      this.player.setFlipX(false)
      if (this.player.x >= WORLD_W - WORLD_W / 75) {
        this.tweens.add({ targets: this.player, duration: 75, alpha: 0 })
      }
      this.time.delayedCall(5000, () => {
        this.gameWinned = true
        this.player.destroy()
        this.winScreen()
      })
      return
    }

    if (body.blocked.up) this.player.setVelocityY(0)
    if (body.blocked.left || body.blocked.right) this.player.setVelocityX(0)

    if (this.player.y > H - 10 || this.timeLeft <= 0) {
      this.gameOver = true
      this.gameOverFunc()
      return
    }

    if (this.playerBlocked) return
  }

  private updatePlayerControls(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body

    // Jump
    if ((this.cursors?.up.isDown || this.wasd?.W.isDown || this.jumpPressed) && body.touching.down) {
      const down = this.cursors?.down.isDown || false
      this.player.setVelocityY(this.playerStateVal > 0 && down ? -VEL_Y / 1.25 : -VEL_Y)
    }

    // Horizontal
    if (this.cursors?.left.isDown || this.wasd?.A.isDown || this.moveLeft) {
      const a = this.playerStateVal === 0 ? 'run' : this.playerStateVal === 1 ? 'grown-mario-run' : 'fire-mario-run'
      this.player.anims.play(a, true)
      this.player.setFlipX(true)
      this.player.setVelocityX(-VEL_X)
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown || this.moveRight) {
      const a = this.playerStateVal === 0 ? 'run' : this.playerStateVal === 1 ? 'grown-mario-run' : 'fire-mario-run'
      this.player.anims.play(a, true)
      this.player.setFlipX(false)
      this.player.setVelocityX(VEL_X)
    } else {
      if (body.touching.down) this.player.setVelocityX(0)
      if (!(this.cursors?.up.isDown || this.wasd?.W.isDown || this.jumpPressed)) {
        const a = this.playerStateVal === 0 ? 'idle' : this.playerStateVal === 1 ? 'grown-mario-idle' : 'fire-mario-idle'
        this.player.anims.play(a, true)
      }
    }

    // Crouch (big mario only)
    if (this.playerStateVal > 0 && (this.cursors?.down.isDown || false)) {
      const a = this.playerStateVal === 1 ? 'grown-mario-crouch' : 'fire-mario-crouch'
      this.player.anims.play(a, true)
      if (body.touching.down) this.player.setVelocityX(0)
      body.setSize(14, 22).setOffset(2, 10)
    } else if (this.playerStateVal > 0) {
      body.setSize(14, 32).setOffset(2, 0)
    } else {
      body.setSize(14, 16).setOffset(1.3, 0.5)
    }

    // Fire shooting (F key -> fireball if Fire Mario, else bullet)
    if (this.keyF && Phaser.Input.Keyboard.JustDown(this.keyF)) {
      if (this.playerStateVal === 2) this.throwFireball()
      else this.fireBullet()
    }

    // Jump animation
    if (!body.touching.down) {
      const a = this.playerStateVal === 0 ? 'jump' : this.playerStateVal === 1 ? 'grown-mario-jump' : 'fire-mario-jump'
      this.player.anims.play(a, true)
    }
  }

  // ========== PARACHUTE ==========

  private onPlayerLanded(): void {
    if (this.parachuting) {
      this.parachuting = false
      this.hasLanded = true
      const body = this.player.body as Phaser.Physics.Arcade.Body
      body.setGravityY(this.NORMAL_GRAVITY)
      if (this.parachuteSprite) this.parachuteSprite.clear()
      if (this.landingText) this.landingText.setText('')
      this.spawnLandingEffect(this.player.x, this.player.y)
      this.startLevel()
    }
  }

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

  private spawnLandingEffect(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const p = this.add.circle(x, y, 2 + Math.random() * 3, 0xeedd99, 1)
      p.setDepth(5)
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8
      const dist = 12 + Math.random() * 20
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.2, duration: 250 + Math.random() * 200,
        onComplete: () => p.destroy(),
      })
    }
  }

  // ========== FIREBALL ==========

  private throwFireball(): void {
    this.player.anims.play('fire-mario-throw')
    this.playerFiring = true
    this.fireInCooldown = true
    this.time.delayedCall(100, () => { this.playerFiring = false })
    this.time.delayedCall(350, () => { this.fireInCooldown = false })

    const dir = this.player.flipX ? -1 : 1
    const fb = this.physics.add.sprite(
      this.player.getBounds().x + this.player.width * 1.15 * (dir > 0 ? 1 : -1),
      this.player.getBounds().y + this.player.height / 1.25,
      'fireball'
    ).setScale(H / 345)
    ;(fb as any).allowGravity = true
    ;(fb as any).dead = false
    fb.setVelocityX(VEL_X * 1.3 * dir)
    ;(fb as any).isVelocityPositive = dir > 0
    fb.anims.play(dir > 0 ? 'fireball-right-down' : 'fireball-left-down')
    this.updateFireballAnim(fb)

    this.physics.add.collider(fb, this.blocksGroup.getChildren(), this.fireballBounce, undefined, this)
    this.physics.add.collider(fb, this.misteryBlocksGroup.getChildren(), this.fireballBounce, undefined, this)
    this.physics.add.collider(fb, this.platformGroup.getChildren(), this.fireballBounce, undefined, this)
    this.physics.add.overlap(fb, this.goombasGroup.getChildren(), this.fireballCollides, undefined, this)
    this.physics.add.collider(fb, this.immovableBlocksGroup.getChildren(), this.fireballBounce, undefined, this)
    this.physics.add.collider(fb, this.constructionBlocksGroup.getChildren(), this.fireballBounce, undefined, this)

    this.time.delayedCall(3000, () => {
      ;(fb as any).dead = true
      this.tweens.add({ targets: fb, duration: 100, alpha: { from: 1, to: 0 } })
      this.time.delayedCall(100, () => fb.destroy())
    })
  }

  private updateFireballAnim(fireball: any): void {
    if (fireball.exploded || fireball.dead) return
    if (fireball.body.velocity.y > 0) {
      fireball.anims.play(fireball.isVelocityPositive ? 'fireball-right-up' : 'fireball-left-up')
    } else {
      fireball.anims.play(fireball.isVelocityPositive ? 'fireball-right-down' : 'fireball-left-down')
    }
    this.time.delayedCall(250, () => this.updateFireballAnim(fireball))
  }

  private fireballCollides(fireball: any, entitie: any): void {
    if (fireball.exploded || fireball.dead) return
    fireball.exploded = true
    fireball.dead = true
    fireball.body.moves = false
    this.explodeFireball(fireball)
    entitie.anims.play('goomba-idle', true)
    entitie.flipY = true
    entitie.dead = true
    this.goombasGroup.remove(entitie)
    entitie.setVelocityX(0)
    entitie.setVelocityY(-VEL_Y * 0.4)
    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: entitie, duration: 750, y: H * 1.1 })
    })
    this.addToScore(100, entitie)
    this.time.delayedCall(1250, () => entitie.destroy())
  }

  private explodeFireball(fireball: any): void {
    fireball.anims.play('fireball-explosion-1', true)
    this.time.delayedCall(50, () => {
      if (!fireball) return
      fireball.anims.play('fireball-explosion-2', true)
    })
    this.time.delayedCall(85, () => {
      if (!fireball) return
      fireball.anims.play('fireball-explosion-3', true)
    })
    this.time.delayedCall(130, () => { if (fireball) fireball.destroy() })
  }

  private fireballBounce(fireball: any, collider: any): void {
    if ((collider.isPlatform && (fireball.body.blocked.left || fireball.body.blocked.right)) ||
        (!collider.isPlatform && (fireball.body.blocked.left || fireball.body.blocked.right))) {
      fireball.exploded = true
      fireball.dead = true
      fireball.body.moves = false
      this.explodeFireball(fireball)
      return
    }
    if (fireball.body.blocked.down) fireball.setVelocityY(-VEL_Y * 2 / 3.45)
    if (fireball.body.blocked.up) fireball.setVelocityY(VEL_Y * 2 / 3.45)
    if (fireball.body.blocked.left) { fireball.isVelocityPositive = false; fireball.setVelocityX(VEL_X * 1.3) }
    if (fireball.body.blocked.right) { fireball.isVelocityPositive = true; fireball.setVelocityX(-VEL_X * 1.3) }
  }

  // ========== BULLET SHOOTING (multiplayer) ==========

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

  // ========== BULLET COLLISIONS ==========

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

  private spawnImpact(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(x, y, 2 + Math.random() * 3, 0xffdd44, 1)
      p.setDepth(5)
      const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.4
      const dist = 18 + Math.random() * 28
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.2, duration: 180 + Math.random() * 150,
        onComplete: () => p.destroy(),
      })
    }
  }

  // ========== WIN SCREEN ==========

  private winScreen(): void {
    const hs = localStorage.getItem('high-score')
    if (!hs || parseInt(hs) < this.score) {
      localStorage.setItem('high-score', '' + this.score)
    }
    const cx = this.cameras.main.worldView.x + this.cameras.main.width / 2
    const overlay = this.add.rectangle(0, H / 2, WORLD_W, H, 0x000000).setScrollFactor(0)
    overlay.alpha = 0
    overlay.setDepth(4)
    this.tweens.add({ targets: overlay, duration: 300, alpha: 1 })
    this.add.bitmapText(cx, H / 3, 'carrier_command', 'YOU WON!', W / 30).setOrigin(0.5).setDepth(5)
    this.add.bitmapText(cx, H / 2, 'carrier_command', '> PLAY AGAIN', W / 50).setOrigin(0.5).setInteractive().on('pointerdown', () => location.reload()).setDepth(5)
  }

  // ========== REMOTE STATE ==========

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
  }

  setActiveControls(controls: { left: boolean; right: boolean; jump: boolean; shoot?: boolean }): void {
    if (this.parachuting) return
    this.moveLeft = controls.left
    this.moveRight = controls.right
    this.jumpPressed = controls.jump
    if (controls.shoot) {
      if (this.playerStateVal === 2) this.throwFireball()
      else this.fireBullet()
    }
  }

  // ========== SYNC ==========

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
