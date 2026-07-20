'use client'

import * as Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    const g = this.add.graphics()

    // Player texture (32x48)
    g.clear()
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

    // Floor tile (32x32) — for LobbyScene
    g.fillStyle(0x3a2a1a)
    g.fillRect(0, 0, 32, 32)
    g.lineStyle(1, 0x2a1a0a, 0.3)
    g.strokeRect(0, 0, 32, 32)
    g.generateTexture('floor', 32, 32)
    g.clear()

    // Wall tile (32x32) — for LobbyScene
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
