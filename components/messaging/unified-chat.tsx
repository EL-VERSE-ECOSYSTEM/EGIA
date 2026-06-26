'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Send, Search, MoreVertical,
  Paperclip, Smile, Image as ImageIcon,
  User, CheckCheck, Phone, Video, Plus,
  Hash, Bell, Settings
} from 'lucide-react'
import { getConversations, getMessages, sendMessage, createConversation } from '@/app/actions/messaging'

interface UnifiedChatProps {
  role: 'admin' | 'teacher' | 'parent' | 'student'
  currentUserId: string
}

export default function UnifiedChat({ role, currentUserId }: UnifiedChatProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const theme = {
    admin: { primary: 'bg-amber-600', hover: 'hover:bg-amber-700', text: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50', shadow: 'shadow-amber-100', darkText: 'text-amber-900' },
    teacher: { primary: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-600', border: 'border-purple-100', bg: 'bg-purple-50', shadow: 'shadow-purple-100', darkText: 'text-purple-900' },
    parent: { primary: 'bg-emerald-600', hover: 'hover:bg-emerald-700', text: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50', shadow: 'shadow-emerald-100', darkText: 'text-emerald-900' },
    student: { primary: 'bg-orange-600', hover: 'hover:bg-orange-700', text: 'text-orange-600', border: 'border-orange-100', bg: 'bg-orange-50', shadow: 'shadow-orange-100', darkText: 'text-orange-900' },
  }[role]

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id)
    }
  }, [selectedChat])

  const fetchConversations = async () => {
    try {
      const convs = await getConversations()
      setConversations(convs)
      if (convs.length > 0 && !selectedChat) {
        setSelectedChat(convs[0])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (convId: string) => {
    try {
      const msgs = await getMessages(convId)
      setMessages(msgs)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    const text = newMessage
    setNewMessage('')

    try {
      await sendMessage(selectedChat.id, text)
      fetchMessages(selectedChat.id)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (loading) return <div className="p-8 text-center font-bold text-slate-400">Loading conversations...</div>

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white/50 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-slate-200/50 shadow-2xl shadow-slate-200/50">
      {/* Sidebar */}
      <div className="w-80 md:w-96 border-r border-slate-100 flex flex-col bg-white">
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Messages.</h2>
            <Button size="icon" className={`${theme.primary} ${theme.hover} rounded-xl w-10 h-10`}>
              <Plus className="w-5 h-5 text-white" />
            </Button>
          </div>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:bg-white transition-all"
            />
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
             <Badge className={`${theme.primary} text-white rounded-lg px-4 py-1.5 font-black uppercase text-[10px] tracking-widest border-none whitespace-nowrap`}>All</Badge>
             <Badge variant="outline" className="text-slate-400 border-slate-100 rounded-lg px-4 py-1.5 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 whitespace-nowrap">Parents</Badge>
             <Badge variant="outline" className="text-slate-400 border-slate-100 rounded-lg px-4 py-1.5 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 whitespace-nowrap">Staff</Badge>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-4 space-y-2">
          {conversations.length === 0 ? (
            <p className="p-8 text-center text-xs font-bold text-slate-400">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv)}
                className={`w-full p-5 rounded-[2rem] flex items-center gap-4 transition-all ${
                  selectedChat?.id === conv.id ? theme.bg : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white ${
                    conv.type === 'GROUP' ? 'bg-slate-900' : theme.primary
                  }`}>
                    {conv.type === 'GROUP' ? <Hash className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                </div>
                <div className="flex-grow text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-black text-sm truncate max-w-[120px] ${selectedChat?.id === conv.id ? theme.darkText : 'text-slate-900'}`}>
                      {conv.name || (conv.participants?.find((p: any) => p.userId !== currentUserId)?.user?.name || 'User')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                    {conv.messages?.[0]?.content || 'Start a conversation'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow flex flex-col bg-slate-50/50">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 md:px-10 flex items-center justify-between border-b border-slate-100 bg-white">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${theme.primary} flex items-center justify-center text-white shadow-lg ${theme.shadow}`}>
                    {selectedChat.type === 'GROUP' ? <Hash className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div>
                     <h3 className="font-black text-slate-900">{selectedChat.name || (selectedChat.participants?.find((p: any) => p.userId !== currentUserId)?.user?.name || 'Chat')}</h3>
                     <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active Now
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className={`text-slate-400 rounded-xl hover:${theme.text}`}><Phone size={20} /></Button>
                  <Button variant="ghost" size="icon" className={`text-slate-400 rounded-xl hover:${theme.text}`}><Video size={20} /></Button>
                  <div className="w-px h-6 bg-slate-200 mx-2" />
                  <Button variant="ghost" size="icon" className="text-slate-400 rounded-xl"><MoreVertical size={20} /></Button>
               </div>
            </div>

            {/* Messages List */}
            <div className="flex-grow overflow-y-auto p-8 md:p-12 space-y-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                  <div className={`w-20 h-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center ${theme.text}`}>
                    <Send className="w-10 h-10" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-widest">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md space-y-2 ${isMe ? 'text-right' : 'text-left'}`}>
                         {!isMe && <p className="text-[10px] font-black text-slate-400 uppercase ml-4">{msg.sender?.name || 'User'}</p>}
                         <div className={`p-6 rounded-[2.5rem] shadow-xl shadow-slate-900/5 ${
                           isMe
                             ? `${theme.primary} text-white rounded-tr-none`
                             : 'bg-white text-slate-800 rounded-tl-none'
                         }`}>
                            <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                         </div>
                         <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'} px-4`}>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                         </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-8 md:px-12 bg-white">
              <div className={`flex items-center gap-4 bg-slate-50 p-3 rounded-[2.5rem] border-2 border-transparent focus-within:${theme.border} focus-within:bg-white transition-all shadow-inner`}>
                 <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-white shrink-0"><ImageIcon size={20} /></Button>
                 <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-white shrink-0"><Paperclip size={20} /></Button>
                 <Input
                   placeholder="Type a message..."
                   className="flex-grow bg-transparent border-none focus-visible:ring-0 text-sm font-bold h-10 shadow-none"
                   value={newMessage}
                   onChange={(e) => setNewMessage(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                 />
                 <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-white shrink-0"><Smile size={20} /></Button>
                 <Button
                   className={`${theme.primary} ${theme.hover} w-12 h-12 rounded-full shadow-lg ${theme.shadow} shrink-0`}
                   onClick={handleSendMessage}
                 >
                    <Send className="w-5 h-5 text-white" />
                 </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 space-y-6">
            <div className={`w-32 h-32 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center ${theme.text}`}>
              <Send className="w-16 h-16" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Select a Conversation</h3>
              <p className="font-bold text-xs uppercase tracking-widest">Connect with your community instantly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
