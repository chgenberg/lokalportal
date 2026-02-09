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
  const [selectedId, setSelectedId] = useState<string | undefined>(preselected || undefined);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) { const data = await res.json(); setConversations(data.conversations || []); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); const interval = setInterval(fetchConversations, 5000); return () => clearInterval(interval); }, [fetchConversations]);
  useEffect(() => { if (preselected) setSelectedId(preselected); }, [preselected]);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Meddelanden</h1>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex" style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}>
          <div className="w-80 border-r border-border overflow-y-auto shrink-0">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : (
              <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
          <div className="flex-1 flex flex-col">
            {selectedConv && session?.user ? (
              <ChatWindow conversationId={selectedConv.id} currentUserId={session.user.id} otherUserName={selectedConv.otherUserName} listingTitle={selectedConv.listingTitle} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <p className="text-sm font-medium text-navy">Välj en konversation</p>
                  <p className="text-xs text-gray-500 mt-1">Välj en konversation till vänster för att börja chatta</p>
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
    <Suspense fallback={<div className="bg-white rounded-2xl border border-border p-12 text-center"><div className="text-gray-400">Laddar meddelanden...</div></div>}>
      <MeddelandenContent />
    </Suspense>
  );
}
