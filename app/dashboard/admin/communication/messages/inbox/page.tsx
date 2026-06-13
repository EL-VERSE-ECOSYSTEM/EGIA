'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendMessage } from '@/app/actions/messaging'

export default function ChatPage() {
  const [msg, setMsg] = useState('')
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Teacher', content: 'Hello, how is your child doing?', time: '10:00 AM' },
    { id: '2', sender: 'Me', content: 'He is doing great, thanks for asking!', time: '10:05 AM' }
  ])

  const handleSend = async () => {
    if (!msg) return
    const newMsg = { id: Date.now().toString(), sender: 'Me', content: msg, time: 'Now' }
    setMessages([...messages, newMsg])
    setMsg('')
    // await sendMessage('conv-id', 'my-id', msg)
  }

  return (
    <div className="p-8 h-[calc(100vh-64px)] flex flex-col max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Messages</h1>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Chat with Mr. Smith</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl ${m.sender === 'Me' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                <p className="text-sm">{m.content}</p>
                <p className="text-[10px] mt-1 opacity-70">{m.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="p-4 border-t flex gap-2">
          <Input placeholder="Type a message..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
          <Button className="bg-amber-600" onClick={handleSend}>Send</Button>
        </div>
      </Card>
    </div>
  )
}
