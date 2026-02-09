"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "@/lib/types";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
  listingTitle: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Idag";
  if (date.toDateString() === yesterday.toDateString()) return "Igår";
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function ChatWindow({ conversationId, currentUserId, otherUserName, listingTitle }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) { const data = await res.json(); setMessages(data.messages || []); }
    } catch { /* */ } finally { setLoading(false); }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const optimistic: Message = { id: `temp-${Date.now()}`, conversationId, senderId: currentUserId, text, createdAt: new Date().toISOString(), read: false };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch(`/api/messages/${conversationId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (res.ok) { const msg = await res.json(); setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? msg : m))); }
    } catch { setMessages((prev) => prev.filter((m) => m.id !== optimistic.id)); } finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  let lastDate = "";

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border bg-white">
        <p className="font-semibold text-navy">{otherUserName}</p>
        <p className="text-xs text-gray-500">{listingTitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-muted/30">
        {loading ? (
          <div className="flex items-center justify-center h-full"><div className="text-sm text-gray-400">Laddar...</div></div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">Skriv ett meddelande för att starta konversationen</p></div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            const msgDate = formatDate(msg.createdAt);
            const showDate = msgDate !== lastDate;
            lastDate = msgDate;
            return (
              <div key={msg.id}>
                {showDate && <div className="flex justify-center my-3"><span className="px-3 py-1 bg-white text-xs text-gray-400 rounded-full border border-border">{msgDate}</span></div>}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn ? "bg-navy text-white rounded-br-md" : "bg-white text-gray-800 border border-border rounded-bl-md"}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                      <span className={`text-[10px] ${isOwn ? "text-white/60" : "text-gray-400"}`}>{formatTime(msg.createdAt)}</span>
                      {isOwn && msg.read && <span className="text-[10px] text-white/60">Läst</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-border bg-white">
        <div className="flex items-end gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Skriv ett meddelande..." rows={1} className="flex-1 px-4 py-2.5 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none resize-none max-h-32" />
          <button onClick={handleSend} disabled={!input.trim() || sending} className="px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50 shrink-0" aria-label="Skicka meddelande">
            {sending ? "..." : "Skicka"}
          </button>
        </div>
      </div>
    </div>
  );
}
