import React from 'react'
import {Bot,User} from 'lucide-react'

export default function MessageBubble({role , content}) {
    const isUser = role === 'user'
  return (
   <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-indigo-600" : "bg-emerald-600"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-100"
        }`}
      >
        {content}
      </div>
    </div>
  )
}
