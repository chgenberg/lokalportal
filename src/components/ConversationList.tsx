"use client";

interface ConversationItem {
  id: string;
  listingTitle: string;
  otherUserName: string;
  otherUserRole: string;
  unreadCount: number;
  lastMessage: { text: string; createdAt: string } | null;
  lastMessageAt: string;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Nu";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-medium text-navy mb-1">Inga konversationer</p>
        <p className="text-xs text-gray-500">Kontakta en hyresvärd från en annons för att starta en konversation</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <button key={conv.id} onClick={() => onSelect(conv.id)} className={`w-full text-left p-4 hover:bg-muted transition-colors ${selectedId === conv.id ? "bg-muted" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-navy truncate">{conv.otherUserName}</p>
                {conv.unreadCount > 0 && <span className="w-5 h-5 bg-navy text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{conv.unreadCount}</span>}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{conv.listingTitle}</p>
              {conv.lastMessage && <p className="text-xs text-gray-400 truncate mt-1">{conv.lastMessage.text}</p>}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{timeAgo(conv.lastMessageAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
