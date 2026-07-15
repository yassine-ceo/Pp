'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { sendChatMessage, sendChatBubble } from '@/lib/firebase'
import { soundManager } from '@/lib/sound'
import { CHAT_EMOJIS } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

function EmojiIcon({ type, size = 32 }: { type: string; size?: number }) {
  const s = size
  switch (type) {
    case 'laugh':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id="laugh-grad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
            <filter id="laugh-shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" /></filter>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#laugh-grad)" filter="url(#laugh-shadow)" />
          <circle cx="24" cy="24" r="22" fill="none" stroke="#D97706" strokeWidth="1" opacity="0.4" />
          <ellipse cx="16" cy="19" rx="3" ry="3.5" fill="#78350F" />
          <ellipse cx="32" cy="19" rx="3" ry="3.5" fill="#78350F" />
          <path d="M13 27 C18 35, 30 35, 35 27" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="#DC2626" opacity="0.9" />
          <path d="M15 17 C14 13, 17 12, 18 15" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M33 17 C34 13, 31 12, 30 15" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <ellipse cx="11" cy="23" rx="2" ry="2.5" fill="#60A5FA" opacity="0.6" />
          <ellipse cx="37" cy="23" rx="2" ry="2.5" fill="#60A5FA" opacity="0.6" />
        </svg>
      )
    case 'clown':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id="clown-grad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#DC2626" />
            </radialGradient>
            <filter id="clown-shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" /></filter>
          </defs>
          <circle cx="24" cy="26" r="20" fill="url(#clown-grad)" filter="url(#clown-shadow)" />
          <ellipse cx="24" cy="24" rx="12" ry="11" fill="white" opacity="0.95" />
          <circle cx="18" cy="22" r="2.5" fill="#1a0a00" />
          <circle cx="30" cy="22" r="2.5" fill="#1a0a00" />
          <circle cx="24" cy="28" r="5" fill="#F97316" />
          <circle cx="24" cy="28" r="2.5" fill="#DC2626" />
          <path d="M17 34 C20 37, 28 37, 31 34" stroke="#1a0a00" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="16" y="4" width="16" height="8" rx="3" fill="#7C3AED" />
          <circle cx="24" cy="5" r="2.5" fill="#FBBF24" />
          <line x1="24" y1="8" x2="24" y2="12" stroke="#7C3AED" strokeWidth="2" />
        </svg>
      )
    case 'angry':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id="angry-grad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#991B1B" />
            </radialGradient>
            <filter id="angry-shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" /></filter>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#angry-grad)" filter="url(#angry-shadow)" />
          <circle cx="16" cy="22" r="3" fill="#450A0A" />
          <circle cx="32" cy="22" r="3" fill="#450A0A" />
          <line x1="10" y1="15" x2="19" y2="18" stroke="#450A0A" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="15" x2="29" y2="18" stroke="#450A0A" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 33 C20 29, 28 29, 32 33" stroke="#450A0A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M10 10 C8 6, 10 3, 9 1" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M38 10 C40 6, 38 3, 39 1" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
        </svg>
      )
    case 'cry':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id="cry-grad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </radialGradient>
            <filter id="cry-shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" /></filter>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#cry-grad)" filter="url(#cry-shadow)" />
          <circle cx="16" cy="20" r="3" fill="#1E3A5F" />
          <circle cx="32" cy="20" r="3" fill="#1E3A5F" />
          <path d="M17 33 C20 30, 28 30, 31 33" stroke="#1E3A5F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M12 23 C10 28, 13 31, 11 36" stroke="#BFDBFE" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M36 23 C38 28, 35 31, 37 36" stroke="#BFDBFE" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <ellipse cx="11" cy="36" rx="3" ry="2" fill="#BFDBFE" opacity="0.7" />
          <ellipse cx="37" cy="36" rx="3" ry="2" fill="#BFDBFE" opacity="0.7" />
        </svg>
      )
    case 'shock':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id="shock-grad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#6D28D9" />
            </radialGradient>
            <filter id="shock-shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" /></filter>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#shock-grad)" filter="url(#shock-shadow)" />
          <circle cx="16" cy="20" r="4" fill="white" />
          <circle cx="32" cy="20" r="4" fill="white" />
          <circle cx="16" cy="20" r="2" fill="#1a0a00" />
          <circle cx="32" cy="20" r="2" fill="#1a0a00" />
          <ellipse cx="24" cy="33" rx="4" ry="5" fill="#1a0a00" />
          <line x1="8" y1="10" x2="4" y2="6" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="40" y1="10" x2="44" y2="6" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="2" x2="24" y2="0" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

interface QuickChatProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuickChat({ isOpen, onClose }: QuickChatProps) {
  const { roomId, playerId, playerName } = useGameStore()
  const [textInput, setTextInput] = useState('')

  const handleEmojiClick = (emojiId: string) => {
    if (!roomId || !playerId) return
    soundManager.playEmoji(emojiId)
    sendChatMessage(roomId, playerId, playerName, 'emoji', emojiId)
    sendChatBubble(roomId, playerId, playerName, emojiId)
    onClose()
  }

  const handleTextSend = () => {
    const text = textInput.trim()
    if (!text || !roomId || !playerId) return
    soundManager.playClick()
    sendChatMessage(roomId, playerId, playerName, 'text', text)
    sendChatBubble(roomId, playerId, playerName, text)
    setTextInput('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full right-0 mb-2 rounded-2xl border border-white/[0.08] bg-black/80 backdrop-blur-2xl p-4 w-64 pointer-events-auto"
        >
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Quick Reactions</p>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji.id}
                onClick={() => handleEmojiClick(emoji.id)}
                className="w-full aspect-square rounded-xl bg-white/[0.06] border border-white/[0.06] hover:bg-white/[0.12] hover:border-white/[0.15] flex items-center justify-center transition-all active:scale-90"
                title={emoji.label}
              >
                <EmojiIcon type={emoji.id} size={28} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value.slice(0, 50))}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              placeholder="Type a message..."
              maxLength={50}
              className="flex-1 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-cyan-400/30 transition-colors"
            />
            <button
              onClick={handleTextSend}
              disabled={!textInput.trim()}
              className="h-9 px-3 rounded-lg bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-xs font-medium hover:bg-cyan-400/25 transition-all disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { EmojiIcon }
