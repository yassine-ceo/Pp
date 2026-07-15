'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { EmojiSvg } from './QuickChat'
import { X, MessageCircle } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const { room, playerId } = useGameStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = Object.values(room?.chat ?? {}).sort((a, b) => a.timestamp - b.timestamp)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 pointer-events-auto"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] border-l border-white/[0.08] bg-black/80 backdrop-blur-2xl pointer-events-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-cyan-400" />
                <p className="text-sm font-semibold text-white">Chat History</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={32} className="text-white/10 mb-3" />
                  <p className="text-xs text-white/30">No messages yet</p>
                  <p className="text-[10px] text-white/20 mt-1">Send an emoji or text to get started!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.playerId === playerId
                  const isEmoji = msg.type === 'emoji'
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <p className={`text-[10px] mb-1 ${isMe ? 'text-cyan-400/60' : 'text-rose-400/60'}`}>
                        {msg.playerName}
                      </p>
                      <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
                        isMe
                          ? 'bg-cyan-400/10 border border-cyan-400/15'
                          : 'bg-white/[0.06] border border-white/[0.08]'
                      }`}>
                        {isEmoji ? (
                          <div className="flex items-center gap-2">
                            <EmojiSvg type={msg.content} size={22} />
                            <span className="text-[11px] text-white/50">
                              {msg.content === 'laugh' && '😂'}
                              {msg.content === 'clown' && '🤡'}
                              {msg.content === 'angry' && '😡'}
                              {msg.content === 'cry' && '😭'}
                              {msg.content === 'shock' && '🤯'}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-white/80 break-words">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
