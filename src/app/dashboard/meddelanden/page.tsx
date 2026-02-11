"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";

interface ConversationItem {
  id: string;
  listingId: string;
  landlordId: string;
  tenantId: string;
  listingTitle: string;
  otherUserName: string;
  otherUserRole: string;
  unreadCount: number;
  lastMessage: { text: string; createdAt: string } | null;
  lastMessageAt: string;
}

function MeddelandenContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("conv");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    preselected || undefined
  );
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (preselected) setSelectedId(preselected);
  }, [preselected]);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-navy">Meddelanden</h1>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div
          className="flex flex-col md:flex-row"
          style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
        >
          {/* Conversation list */}
          <div
            className={`w-full md:w-80 border-r border-border overflow-y-auto shrink-0 ${
              selectedId ? "hidden md:block" : "block"
            }`}
          >
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded-full animate-pulse w-2/3" />
                      <div className="h-2.5 bg-muted rounded-full animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </div>

          {/* Chat window */}
          <div
            className={`flex-1 flex flex-col min-w-0 ${
              !selectedId ? "hidden md:flex" : "flex"
            }`}
          >
            {selectedConv && session?.user ? (
              <>
                {/* Mobile back button */}
                <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-border bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(undefined)}
                    className="flex items-center gap-1.5 text-navy font-medium text-sm hover:bg-navy/[0.04] rounded-lg px-2 py-1.5 -ml-1 transition-colors"
                    aria-label="Tillbaka till konversationer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                      />
                    </svg>
                    Tillbaka
                  </button>
                </div>
                <ChatWindow
                  conversationId={selectedConv.id}
                  currentUserId={session.user.id}
                  currentUserName={session.user.name || "Användare"}
                  otherUserName={selectedConv.otherUserName}
                  listingTitle={selectedConv.listingTitle}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted/20">
                <div className="text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-7 h-7 text-navy/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-navy">
                    Välj en konversation
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Välj en konversation till vänster för att börja chatta
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeddelandenPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <MeddelandenContent />
    </Suspense>
  );
}
