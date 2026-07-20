'use client'
import * as Phaser from 'phaser'

export class ObjectPool<T extends Phaser.GameObjects.GameObject> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn()
      ;(obj as any).setActive(false).setVisible(false)
      this.pool.push(obj)
    }
  }

  get(): T {
    const obj = this.pool.find((o) => !(o as any).active)
    if (obj) {
      this.resetFn(obj)
      ;(obj as any).setActive(true).setVisible(true)
      return obj
    }
    const newObj = this.createFn()
    this.resetFn(newObj)
    ;(newObj as any).setActive(true).setVisible(true)
    this.pool.push(newObj)
    return newObj
  }

  release(obj: T): void {
    ;(obj as any).setActive(false).setVisible(false)
  }

  releaseAll(): void {
    for (const obj of this.pool) {
      ;(obj as any).setActive(false).setVisible(false)
    }
  }

  destroy(): void {
    for (const obj of this.pool) {
      obj.destroy()
    }
    this.pool = []
  }
}
