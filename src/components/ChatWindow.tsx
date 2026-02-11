"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "@/lib/types";

/* ── helpers ──────────────────────────────────────── */

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Idag";
  if (date.toDateString() === yesterday.toDateString()) return "Igår";
  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isImageMime(mime?: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

/* ── Avatar ───────────────────────────────────────── */

function Avatar({
  name,
  isOwn,
  size = "sm",
}: {
  name: string;
  isOwn: boolean;
  size?: "sm" | "md";
}) {
  const px = size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px]";
  return (
    <div
      className={`${px} rounded-full flex items-center justify-center font-semibold shrink-0 ${
        isOwn
          ? "bg-navy text-white"
          : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

/* ── Typing indicator ─────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2.5 bg-white border border-border rounded-2xl rounded-bl-md w-fit">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

/* ── File attachment in message ────────────────────── */

function FileAttachment({
  msg,
  isOwn,
}: {
  msg: Message;
  isOwn: boolean;
}) {
  if (!msg.fileUrl) return null;

  if (isImageMime(msg.fileMimeType)) {
    return (
      <a
        href={msg.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-1 rounded-xl overflow-hidden max-w-[260px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={msg.fileUrl}
          alt={msg.fileName || "Bild"}
          className="w-full h-auto rounded-xl"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={msg.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 mt-1.5 px-3 py-2 rounded-xl transition-colors ${
        isOwn
          ? "bg-white/10 hover:bg-white/20"
          : "bg-muted hover:bg-muted-dark"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          isOwn ? "bg-white/20" : "bg-navy/10"
        }`}
      >
        <svg
          className={`w-4 h-4 ${isOwn ? "text-white" : "text-navy"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-xs font-medium truncate ${
            isOwn ? "text-white" : "text-navy"
          }`}
        >
          {msg.fileName}
        </p>
        {msg.fileSize && (
          <p
            className={`text-[10px] ${
              isOwn ? "text-white/60" : "text-gray-400"
            }`}
          >
            {formatFileSize(msg.fileSize)}
          </p>
        )}
      </div>
      <svg
        className={`w-4 h-4 shrink-0 ${
          isOwn ? "text-white/60" : "text-gray-400"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </a>
  );
}

/* ── Upload preview ───────────────────────────────── */

function UploadPreview({
  file,
  uploading,
  onRemove,
}: {
  file: File;
  uploading: boolean;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted border-t border-border">
      {isImage && preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Förhandsgranskning"
          className="w-12 h-12 rounded-lg object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-navy"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy truncate">{file.name}</p>
        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
      </div>
      {uploading ? (
        <div className="w-5 h-5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
          aria-label="Ta bort fil"
        >
          <svg
            className="w-4 h-4 text-gray-400 hover:text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────── */

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  otherUserName: string;
  listingTitle: string;
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  currentUserName,
  otherUserName,
  listingTitle,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  /* ── fetch messages ─── */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* ── auto-resize textarea ─── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  /* ── file handling ─── */
  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Filen är för stor. Max 10 MB.");
      return;
    }
    setPendingFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const uploadFile = async (
    file: File
  ): Promise<{
    url: string;
    fileName: string;
    fileSize: number;
    fileMimeType: string;
  } | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Kunde inte ladda upp filen.");
        return null;
      }
      return await res.json();
    } catch {
      alert("Uppladdning misslyckades.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  /* ── send message ─── */
  const handleSend = async () => {
    const text = input.trim();
    if (!text && !pendingFile) return;
    if (sending || uploading) return;

    setInput("");
    setSending(true);

    let fileData: {
      url: string;
      fileName: string;
      fileSize: number;
      fileMimeType: string;
    } | null = null;

    if (pendingFile) {
      fileData = await uploadFile(pendingFile);
      if (!fileData) {
        setSending(false);
        return;
      }
      setPendingFile(null);
    }

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      text: text || "",
      createdAt: new Date().toISOString(),
      read: false,
      fileUrl: fileData?.url,
      fileName: fileData?.fileName,
      fileSize: fileData?.fileSize,
      fileMimeType: fileData?.fileMimeType,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text || "",
          fileUrl: fileData?.url,
          fileName: fileData?.fileName,
          fileSize: fileData?.fileSize,
          fileMimeType: fileData?.fileMimeType,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? msg : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── render ─── */
  let lastDate = "";
  let lastSender = "";

  return (
    <div
      className={`flex flex-col h-full transition-colors ${
        dragOver ? "ring-2 ring-navy/30 ring-inset bg-navy/[0.02]" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* ── Header ─── */}
      <div className="px-5 py-3.5 border-b border-border bg-white flex items-center gap-3">
        <Avatar name={otherUserName} isOwn={false} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy text-sm leading-tight">
            {otherUserName}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{listingTitle}</p>
        </div>
      </div>

      {/* ── Messages ─── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 bg-muted/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Laddar meddelanden...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-14 h-14 rounded-full bg-navy/5 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-navy/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-navy">
                Starta konversationen
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Skriv ett meddelande till {otherUserName}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, idx) => {
              const isOwn = msg.senderId === currentUserId;
              const msgDate = formatDate(msg.createdAt);
              const showDate = msgDate !== lastDate;
              lastDate = msgDate;

              const sameSender = msg.senderId === lastSender;
              const nextMsg = messages[idx + 1];
              const isLastInGroup =
                !nextMsg || nextMsg.senderId !== msg.senderId;
              lastSender = msg.senderId;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-white text-[11px] text-gray-400 rounded-full border border-border shadow-sm">
                        {msgDate}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex items-end gap-2 ${
                      isOwn ? "flex-row-reverse" : "flex-row"
                    } ${sameSender ? "mt-0.5" : "mt-3"}`}
                  >
                    {/* Avatar - only show on last message in group */}
                    <div className="w-7 shrink-0">
                      {isLastInGroup && (
                        <Avatar
                          name={isOwn ? currentUserName : otherUserName}
                          isOwn={isOwn}
                        />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="max-w-[85%] sm:max-w-[70%] group">
                      <div
                        className={`px-3.5 py-2 ${
                          isOwn
                            ? `bg-navy text-white ${
                                isLastInGroup
                                  ? "rounded-2xl rounded-br-md"
                                  : "rounded-2xl"
                              }`
                            : `bg-white text-gray-800 border border-border ${
                                isLastInGroup
                                  ? "rounded-2xl rounded-bl-md"
                                  : "rounded-2xl"
                              }`
                        }`}
                      >
                        {msg.text && (
                          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        )}
                        <FileAttachment msg={msg} isOwn={isOwn} />
                      </div>

                      {/* Time + read status - show on last in group */}
                      {isLastInGroup && (
                        <div
                          className={`flex items-center gap-1 mt-1 px-1 ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-[10px] text-gray-400">
                            {formatTime(msg.createdAt)}
                          </span>
                          {isOwn && msg.read && (
                            <svg
                              className="w-3 h-3 text-navy/50"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── File preview ─── */}
      {pendingFile && (
        <UploadPreview
          file={pendingFile}
          uploading={uploading}
          onRemove={() => setPendingFile(null)}
        />
      )}

      {/* ── Input area ─── */}
      <div className="px-3 py-2.5 border-t border-border bg-white">
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0 mb-0.5"
            aria-label="Bifoga fil"
          >
            <svg
              className="w-5 h-5 text-navy/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
              />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              rows={1}
              className="w-full px-4 py-2 bg-muted rounded-2xl text-sm border-0 focus:ring-0 outline-none resize-none max-h-[120px] placeholder:text-gray-400"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !pendingFile) || sending || uploading}
            className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy-light transition-colors disabled:opacity-30 shrink-0 mb-0.5"
            aria-label="Skicka meddelande"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
