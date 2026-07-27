'use client'

import { useState } from 'react'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  Bot,
  Car,
  ChevronRight,
  CircleDot,
  Clock3,
  Gauge,
  MessageSquarePlus,
  Mic,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
} from 'lucide-react'
import { ProgressBar, StatusPill } from '@/components/dashboard-ui'

type Message = { id: number; role: 'user' | 'assistant'; text: string }

const suggestedPrompts = [
  'How can I improve my fuel economy?',
  'When should I replace my brake pads?',
  'Diagnose a rattling noise on cold start',
]

export default function AiMechanicPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState('Fuel efficiency analysis')

  

  async function sendMessage(text = input) {
  const value = text.trim();
  if (!value) return;

  const nextId = Date.now();

  // Show user's message immediately
  setMessages((current) => [
    ...current,
    {
      id: nextId,
      role: "user",
      text: value,
    },
  ]);

  setInput("");
  setIsLoading(true);

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: value,
      }),
    });

    const data = await response.json();

setIsLoading(false);

setMessages((current) => [
  ...current,
  {
    id: nextId + 1,
    role: "assistant",
    text: data.reply,
  },
]);

  } catch (error) {

    setIsLoading(false);

    setMessages((current) => [
      ...current,
      {
        id: nextId + 1,
        role: "assistant",
        text: "Sorry, I couldn't contact the AI service.",
      },
    ]);
  }
}

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-7xl grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)_300px]">
      {/* Conversations */}
      <aside className="glass hidden flex-col rounded-2xl p-3 xl:flex">
        <button
          type="button"
          onClick={() => { setMessages([]); setConversation('New diagnosis') }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          <MessageSquarePlus className="size-4" /> New diagnosis
        </button>
        <p className="px-2 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recent</p>
        <div className="flex flex-col gap-1">
          {['Fuel efficiency analysis', 'Brake pad replacement', 'Cold start rattling', 'Battery health check'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setConversation(item)}
              className={`rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${conversation === item ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
            >
              <span className="block truncate">{item}</span>
              <span className="mt-1 block text-[10px] text-muted-foreground/70">{item === 'Fuel efficiency analysis' ? 'Today' : 'Last week'}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground"><ShieldCheck className="size-4 text-success" /> Privacy protected</div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">Your vehicle data stays in your workspace and is never shared.</p>
        </div>
      </aside>

      {/* Chat */}
      <section className="glass flex min-h-[650px] flex-col overflow-hidden rounded-2xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.62_0.19_258/0.25)]">
              <Bot className="size-5" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-success" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">DriveWise AI Mechanic</h1>
              <p className="text-[11px] text-muted-foreground">Online · Start a new diagnosis</p>
            </div>
          </div>
          <StatusPill tone="success">Live diagnostics</StatusPill>
        </header>

        <div className="scroll-slim flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="grid-texture flex size-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 text-primary"><Sparkles className="size-8" /></div>
              <h2 className="mt-5 text-xl font-semibold text-foreground">What can I help diagnose?</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Describe a sound, warning light, performance issue, or ask about your maintenance records.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {message.role === 'assistant' ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'assistant' ? 'rounded-tl-md border border-border bg-secondary/40 text-foreground' : 'rounded-tr-md bg-primary text-primary-foreground'}`}>
                {message.role === "assistant" ? (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => (
        <h1 className="text-xl font-bold mb-3">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>
      ),
      p: ({ children }) => (
        <p className="mb-3 leading-7">{children}</p>
      ),
      ul: ({ children }) => (
        <ul className="list-disc ml-6 mb-3">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal ml-6 mb-3">{children}</ol>
      ),
      li: ({ children }) => (
        <li className="mb-1">{children}</li>
      ),
      strong: ({ children }) => (
        <strong className="font-bold">{children}</strong>
      ),
    }}
    
  >
    {message.text}
  </ReactMarkdown>
) : (
  message.text
)}
              </div>
            </div>
          ))}
        </div>
        {isLoading && (
  <div className="flex gap-3">
    <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
      <Bot className="size-4" />
    </div>

    <div className="max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-300 animate-pulse">
      DriveWise AI is thinking...
    </div>
  </div>
)}

<div className="border-t border-border p-3 sm:p-4"></div>
        <div className="border-t border-border p-3 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {suggestedPrompts.slice(0, 3).map((prompt) => (
              <button key={prompt} type="button" onClick={() => sendMessage(prompt)} className="whitespace-nowrap rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-secondary/40 p-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
            <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Attach file"><Paperclip className="size-4" /></button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              rows={1}
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Describe what is happening with your vehicle..."
              aria-label="Message DriveWise AI"
            />
            <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Voice input"><Mic className="size-4" /></button>
            <button type="button" onClick={() => sendMessage()} className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50" disabled={!input.trim()} aria-label="Send message"><Send className="size-4" /></button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/70">DriveWise can make mistakes. Always consult a certified mechanic for safety-critical issues.</p>
        </div>
      </section>

      {/* Diagnosis panel */}
      <aside className="flex flex-col gap-4">
        <section className="glass-strong rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Active vehicle</h2>
            <button type="button" className="text-xs font-semibold text-primary">Change</button>
          </div>
          <div className="grid-texture mt-4 flex h-28 items-center justify-center rounded-xl border border-border bg-secondary/20">
            <Car className="size-16 text-primary/70" strokeWidth={1.2} />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">Toyota Corolla Altis</p>
          <p className="text-xs text-muted-foreground">2022 · LEB-4821 · 41,250 km</p>
          <div className="mt-4"><ProgressBar value={92} tone="success" label="Vehicle health" /></div>
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground">Diagnosis summary</h2>
          <div className="mt-4 flex flex-col gap-3">
            {[
              { icon: CircleDot, label: 'Tire pressure', value: 'Check', tone: 'text-warning' },
              { icon: Wrench, label: 'Air filter', value: 'Inspect', tone: 'text-warning' },
              { icon: Gauge, label: 'Engine health', value: 'Normal', tone: 'text-success' },
              { icon: Clock3, label: 'Urgency', value: '7 days', tone: 'text-primary' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                <item.icon className={`size-4 ${item.tone}`} />
                <span className="flex-1 text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-xs font-semibold ${item.tone}`}>{item.value}</span>
              </div>
            ))}
          </div>
          <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/15">Schedule inspection <ChevronRight className="size-3.5" /></button>
        </section>
      </aside>
    </div>
  )
}
