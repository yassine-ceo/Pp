export class SoundManager {
  private ctx: AudioContext | null = null
  private muted = false

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  setMuted(m: boolean) {
    this.muted = m
  }

  playClick() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  }

  playPlaceX() {
    if (this.muted) return
    const ctx = this.getCtx()
    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate
      const env = Math.exp(-t * 30)
      data[i] = (Math.random() * 2 - 1) * env * 0.6 +
        Math.sin(2 * Math.PI * 80 * t) * env * 0.4
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    src.connect(filter).connect(ctx.destination)
    src.start()
  }

  playPlaceO() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1800, ctx.currentTime + 0.02)
    osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.22)
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.02)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc2.connect(gain2).connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.02)
    osc2.stop(ctx.currentTime + 0.22)
  }

  playWin() {
    if (this.muted) return
    const ctx = this.getCtx()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.3)
    })
  }

  playTie() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 150
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  }

  playDisconnect() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  }

  // === Chat Emoji Sounds ===

  playEmojiLaugh() {
    if (this.muted) return
    const ctx = this.getCtx()
    // Rapid ascending wobble — comedic laugh
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.08
      osc.frequency.setValueAtTime(400 + i * 150, t)
      osc.frequency.exponentialRampToValueAtTime(600 + i * 100, t + 0.06)
      gain.gain.setValueAtTime(0.18, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.09)
    }
  }

  playEmojiClown() {
    if (this.muted) return
    const ctx = this.getCtx()
    // Silly honk — low then high
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  playEmojiAngry() {
    if (this.muted) return
    const ctx = this.getCtx()
    // Deep buzzing rumble
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.15)
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  }

  playEmojiCry() {
    if (this.muted) return
    const ctx = this.getCtx()
    // Descending whine
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.45)
  }

  playEmojiShock() {
    if (this.muted) return
    const ctx = this.getCtx()
    // Quick zap — rising burst
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  playEmoji(id: string) {
    switch (id) {
      case 'laugh': this.playEmojiLaugh(); break
      case 'clown': this.playEmojiClown(); break
      case 'angry': this.playEmojiAngry(); break
      case 'cry': this.playEmojiCry(); break
      case 'shock': this.playEmojiShock(); break
      default: this.playClick(); break
    }
  }
}

export const soundManager = new SoundManager()
