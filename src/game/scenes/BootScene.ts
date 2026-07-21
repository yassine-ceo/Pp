'use client'

import * as Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    const gfx = this.add.graphics()
    const barW = 200
    const barH = 20
    const cx = 360 / 2 - barW / 2
    const cy = 740 / 2 - barH / 2
    gfx.fillStyle(0x222222, 1)
    gfx.fillRoundedRect(cx, cy, barW, barH, 6)

    const pct = this.add.text(360 / 2, 740 / 2 + 30, '0%', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.load.on('progress', (v: number) => {
      pct.setText(v >= 0.99 ? 'Generating world...' : Math.round(v * 99) + '%')
      gfx.clear()
      gfx.fillStyle(0x222222, 1)
      gfx.fillRoundedRect(cx, cy, barW, barH, 6)
      gfx.fillStyle(0xffffff, 1)
      gfx.fillRoundedRect(cx + 2, cy + 2, (barW - 4) * v, barH - 4, 4)
    })
    this.load.on('complete', () => { gfx.destroy(); pct.destroy() })

    const base = 'assets/FullGame/assets'

    this.load.spritesheet('mario', `${base}/entities/mario.png`, { frameWidth: 18, frameHeight: 16 })
    this.load.spritesheet('mario-grown', `${base}/entities/mario-grown.png`, { frameWidth: 18, frameHeight: 32 })
    this.load.spritesheet('mario-fire', `${base}/entities/mario-fire.png`, { frameWidth: 18, frameHeight: 32 })
    this.load.spritesheet('goomba', `${base}/entities/overworld/goomba.png`, { frameWidth: 16, frameHeight: 16 })
    this.load.spritesheet('koopa', `${base}/entities/koopa.png`, { frameWidth: 16, frameHeight: 24 })
    this.load.spritesheet('shell', `${base}/entities/shell.png`, { frameWidth: 16, frameHeight: 15 })
    this.load.spritesheet('fireball', `${base}/entities/fireball.png`, { frameWidth: 8, frameHeight: 8 })
    this.load.spritesheet('fireball-explosion', `${base}/entities/fireball-explosion.png`, { frameWidth: 16, frameHeight: 16 })

    this.load.image('cloud1', `${base}/scenery/overworld/cloud1.png`)
    this.load.image('cloud2', `${base}/scenery/overworld/cloud2.png`)
    this.load.image('mountain1', `${base}/scenery/overworld/mountain1.png`)
    this.load.image('mountain2', `${base}/scenery/overworld/mountain2.png`)
    this.load.image('fence', `${base}/scenery/overworld/fence.png`)
    this.load.image('bush1', `${base}/scenery/overworld/bush1.png`)
    this.load.image('bush2', `${base}/scenery/overworld/bush2.png`)
    this.load.image('castle', `${base}/scenery/castle.png`)
    this.load.image('flag-mast', `${base}/scenery/flag-mast.png`)
    this.load.image('final-flag', `${base}/scenery/final-flag.png`)
    this.load.image('sign', `${base}/scenery/sign.png`)
    this.load.image('horizontal-tube', `${base}/scenery/horizontal-tube.png`)
    this.load.image('horizontal-final-tube', `${base}/scenery/horizontal-final-tube.png`)
    this.load.image('vertical-small-tube', `${base}/scenery/vertical-small-tube.png`)
    this.load.image('vertical-medium-tube', `${base}/scenery/vertical-medium-tube.png`)
    this.load.image('vertical-large-tube', `${base}/scenery/vertical-large-tube.png`)

    this.load.image('floorbricks', `${base}/scenery/overworld/floorbricks.png`)
    this.load.image('start-floorbricks', `${base}/scenery/overworld/floorbricks.png`)
    this.load.image('block', `${base}/blocks/overworld/block.png`)
    this.load.image('emptyBlock', `${base}/blocks/overworld/emptyBlock.png`)
    this.load.image('immovableBlock', `${base}/blocks/overworld/immovableBlock.png`)
    this.load.spritesheet('brick-debris', `${base}/blocks/overworld/brick-debris.png`, { frameWidth: 8, frameHeight: 8 })
    this.load.spritesheet('mistery-block', `${base}/blocks/overworld/misteryBlock.png`, { frameWidth: 16, frameHeight: 16 })
    this.load.spritesheet('custom-block', `${base}/blocks/overworld/customBlock.png`, { frameWidth: 16, frameHeight: 16 })

    this.load.spritesheet('coin', `${base}/collectibles/coin.png`, { frameWidth: 16, frameHeight: 16 })
    this.load.spritesheet('ground-coin', `${base}/collectibles/underground/ground-coin.png`, { frameWidth: 10, frameHeight: 14 })
    this.load.image('live-mushroom', `${base}/collectibles/live-mushroom.png`)
    this.load.image('super-mushroom', `${base}/collectibles/super-mushroom.png`)
    this.load.spritesheet('fire-flower', `${base}/collectibles/overworld/fire-flower.png`, { frameWidth: 16, frameHeight: 16 })

    this.load.bitmapFont('carrier_command', `${base}/fonts/carrier_command.png`, `${base}/fonts/carrier_command.xml`)
  }

  create(): void {
    const g = this.add.graphics()

    // Keep procedural textures for lobby scene compatibility
    // Player texture (32x48)
    g.fillStyle(0xd4a84b)
    g.fillRoundedRect(4, 0, 24, 32, 4)
    g.fillStyle(0xf5e6c8)
    g.fillCircle(16, 12, 8)
    g.fillStyle(0xd4a84b)
    g.fillRect(8, 32, 6, 16)
    g.fillRect(18, 32, 6, 16)
    g.generateTexture('player', 32, 48)
    g.clear()

    // Remote player texture
    g.fillStyle(0x4a90d9)
    g.fillRoundedRect(4, 0, 24, 32, 4)
    g.fillStyle(0xc8e6f5)
    g.fillCircle(16, 12, 8)
    g.fillStyle(0x4a90d9)
    g.fillRect(8, 32, 6, 16)
    g.fillRect(18, 32, 6, 16)
    g.generateTexture('remotePlayer', 32, 48)
    g.clear()

    // Bullet texture (8x8)
    g.fillStyle(0xffdd44)
    g.fillCircle(4, 4, 4)
    g.fillStyle(0xffffff)
    g.fillCircle(3, 3, 2)
    g.generateTexture('bullet', 8, 8)
    g.clear()

    // Floor tile (32x32) for LobbyScene
    g.fillStyle(0x3a2a1a)
    g.fillRect(0, 0, 32, 32)
    g.lineStyle(1, 0x2a1a0a, 0.3)
    g.strokeRect(0, 0, 32, 32)
    g.generateTexture('floor', 32, 32)
    g.clear()

    // Wall tile (32x32) for LobbyScene
    g.fillStyle(0x2a1a1a)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x3a2a2a)
    g.fillRect(2, 2, 28, 4)
    g.fillRect(2, 14, 28, 4)
    g.fillRect(2, 26, 28, 4)
    g.generateTexture('wall', 32, 32)
    g.clear()

    // Ground tile (32x64) — green grass on brown dirt
    g.fillStyle(0x8B4513)
    g.fillRect(0, 0, 32, 64)
    g.fillStyle(0x4a7c2e)
    g.fillRect(0, 0, 32, 8)
    g.fillStyle(0x5c9e3a)
    g.fillRect(0, 0, 32, 4)
    g.lineStyle(1, 0x6B3A1F, 0.3)
    g.lineBetween(0, 20, 32, 20)
    g.lineBetween(0, 40, 32, 40)
    g.generateTexture('ground', 32, 64)
    g.clear()

    // Brick tile (32x32)
    g.fillStyle(0xc87c2e)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0xd48c3e)
    g.fillRect(2, 2, 12, 12)
    g.fillRect(18, 2, 12, 12)
    g.fillRect(10, 18, 12, 12)
    g.lineStyle(1, 0x8a5a2a, 0.4)
    g.strokeRect(0, 0, 32, 32)
    g.lineBetween(16, 0, 16, 14)
    g.lineBetween(0, 16, 32, 16)
    g.lineBetween(8, 16, 8, 32)
    g.lineBetween(24, 16, 24, 32)
    g.generateTexture('brick', 32, 32)
    g.clear()

    // Cloud texture (128x64)
    g.fillStyle(0xffffff)
    g.fillCircle(32, 40, 24)
    g.fillCircle(64, 32, 28)
    g.fillCircle(96, 40, 24)
    g.fillStyle(0xf0f0f0)
    g.fillCircle(48, 28, 20)
    g.fillCircle(80, 28, 20)
    g.generateTexture('cloud', 128, 64)
    g.clear()
    g.destroy()

    this.scene.start('LobbyScene', this.scene.settings.data)
  }
}
