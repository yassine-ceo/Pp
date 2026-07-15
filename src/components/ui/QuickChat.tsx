'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { sendChatMessage, sendChatBubble } from '@/lib/firebase'
import { soundManager } from '@/lib/sound'
import { CHAT_EMOJIS } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

function EmojiSvg({ type, size = 28 }: { type: string; size?: number }) {
  const s = size
  switch (type) {
    case 'laugh':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#FBBF24" />
          <circle cx="13" cy="16" r="2.5" fill="#1a0a00" />
          <circle cx="27" cy="16" r="2.5" fill="#1a0a00" />
          <path d="M10 22 C14 30, 26 30, 30 22" stroke="#1a0a00" strokeWidth="2.5" strokeLinecap="round" fill="#F97316" />
          <path d="M12 14 C11 11, 14 10, 15 12" stroke="#1a0a00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M28 14 C29 11, 26 10, 25 12" stroke="#1a0a00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Tear drops */}
          <ellipse cx="9" cy="19" rx="1.5" ry="2" fill="#60A5FA" opacity="0.7" />
          <ellipse cx="31" cy="19" rx="1.5" ry="2" fill="#60A5FA" opacity="0.7" />
        </svg>
      )
    case 'clown':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#EF4444" />
          <circle cx="20" cy="18" r="10" fill="white" />
          <circle cx="15" cy="16" r="2" fill="#1a0a00" />
          <circle cx="25" cy="16" r="2" fill="#1a0a00" />
          <circle cx="20" cy="22" r="4" fill="#F97316" />
          <circle cx="20" cy="22" r="2" fill="#DC2626" />
          <path d="M14 28 C17 32, 23 32, 26 28" stroke="#1a0a00" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Hat */}
          <rect x="14" y="2" width="12" height="6" rx="2" fill="#7C3AED" />
          <circle cx="20" cy="3" r="2" fill="#FBBF24" />
        </svg>
      )
    case 'angry':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#DC2626" />
          <circle cx="13" cy="17" r="2.5" fill="#1a0a00" />
          <circle cx="27" cy="17" r="2.5" fill="#1a0a00" />
          {/* Angry eyebrows */}
          <line x1="9" y1="12" x2="16" y2="14" stroke="#1a0a00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="31" y1="12" x2="24" y2="14" stroke="#1a0a00" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M13 27 C16 24, 24 24, 27 27" stroke="#1a0a00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Steam */}
          <path d="M8 8 C6 5, 8 3, 7 1" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M32 8 C34 5, 32 3, 33 1" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
        </svg>
      )
    case 'cry':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#3B82F6" />
          <circle cx="13" cy="16" r="2.5" fill="#1a0a00" />
          <circle cx="27" cy="16" r="2.5" fill="#1a0a00" />
          <path d="M14 28 C17 25, 23 25, 26 28" stroke="#1a0a00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Big tear streams */}
          <path d="M10 18 C9 22, 11 24, 10 28" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M30 18 C31 22, 29 24, 30 28" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="10" cy="28" rx="2" ry="1.5" fill="#93C5FD" opacity="0.8" />
          <ellipse cx="30" cy="28" rx="2" ry="1.5" fill="#93C5FD" opacity="0.8" />
        </svg>
      )
    case 'shock':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#8B5CF6" />
          <circle cx="13" cy="16" r="3" fill="white" />
          <circle cx="27" cy="16" r="3" fill="white" />
          <circle cx="13" cy="16" r="1.5" fill="#1a0a00" />
          <circle cx="27" cy="16" r="1.5" fill="#1a0a00" />
          <ellipse cx="20" cy="27" rx="3" ry="4" fill="#1a0a00" />
          {/* Shock lines */}
          <line x1="6" y1="8" x2="3" y2="5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="8" x2="37" y2="5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="2" x2="20" y2="0" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
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
                <EmojiSvg type={emoji.id} size={26} />
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

export { EmojiSvg }
