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

    // Floor tile
    g.fillStyle(0x3a2a1a)
    g.fillRect(0, 0, 32, 32)
    g.lineStyle(1, 0x2a1a0a, 0.3)
    g.strokeRect(0, 0, 32, 32)
    g.generateTexture('floor', 32, 32)
    g.clear()

    // Wall tile
    g.fillStyle(0x2a1a1a)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x3a2a2a)
    g.fillRect(2, 2, 28, 4)
    g.fillRect(2, 14, 28, 4)
    g.fillRect(2, 26, 28, 4)
    g.generateTexture('wall', 32, 32)
    g.clear()

    // Door texture
    g.fillStyle(0x8b6508)
    g.fillRect(8, 0, 16, 64)
    g.fillStyle(0x6b4c1a)
    g.fillRect(10, 2, 12, 60)
    g.fillStyle(0xd4a84b)
    g.fillCircle(20, 32, 3)
    g.generateTexture('door', 32, 64)
    g.clear()

    // Platform
    g.fillStyle(0x4a3a2a)
    g.fillRect(0, 0, 64, 16)
    g.lineStyle(1, 0x6b4c1a, 0.5)
    g.strokeRect(0, 0, 64, 16)
    g.generateTexture('platform', 64, 16)
    g.clear()

    g.destroy()
    this.scene.start('LobbyScene', this.scene.settings.data)
  }
}
