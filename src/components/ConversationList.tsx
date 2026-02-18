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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Nu";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}v`;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-navy/25"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-navy">Inga konversationer</p>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Kontakta en hyresvärd från en annons för att starta en konversation
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search-like header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Konversationer
        </p>
      </div>

      <div className="overflow-y-auto">
        {conversations.map((conv) => {
          const isSelected = selectedId === conv.id;
          const hasUnread = conv.unreadCount > 0;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-3 py-3 mx-2 mb-1.5 rounded-2xl flex items-center gap-3 transition-all duration-200 relative ${
                isSelected
                  ? "bg-navy/[0.06] shadow-sm"
                  : "hover:bg-muted/60"
              }`}
            >
              {/* Active indicator */}
              {isSelected && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-navy rounded-full" />
              )}

              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${
                    hasUnread
                      ? "bg-navy text-white"
                      : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500"
                  }`}
                >
                  {getInitials(conv.otherUserName)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm truncate ${
                      hasUnread
                        ? "font-bold text-navy"
                        : "font-medium text-gray-700"
                    }`}
                  >
                    {conv.otherUserName}
                  </p>
                  <span
                    className={`text-[11px] shrink-0 ${
                      hasUnread ? "text-navy font-semibold" : "text-gray-400"
                    }`}
                  >
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {conv.listingTitle}
                </p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className={`text-xs truncate ${
                      hasUnread
                        ? "text-gray-600 font-medium"
                        : "text-gray-400"
                    }`}
                  >
                    {conv.lastMessage?.text || "Ingen meddelanden ännu"}
                  </p>
                  {hasUnread && (
                    <span className="w-5 h-5 bg-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
