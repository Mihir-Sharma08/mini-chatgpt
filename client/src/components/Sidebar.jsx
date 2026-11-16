import { Plus, MessageSquare, Trash2, X, Bot } from "lucide-react";

export default function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  isOpen,
  onClose,
}) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <Bot size={22} className="text-emerald-400" />
            Mini ChatGPT
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded p-1 text-zinc-400 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          {conversations.length === 0 ? (
            <p className="px-3 text-sm text-zinc-500">No conversations yet.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="group relative">
                  <button
                    onClick={() => onSelect(conversation.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 pr-10 text-left text-sm ${
                      conversation.id === activeId
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-300 hover:bg-zinc-900"
                    }`}
                  >
                    <MessageSquare size={16} className="shrink-0" />
                    <span className="truncate">{conversation.title}</span>
                  </button>
                  <button
                    onClick={() => onDelete(conversation.id)}
                    aria-label="Delete conversation"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-red-400 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
}