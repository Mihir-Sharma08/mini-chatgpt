import { useState } from "react";
import { Plus, MessageSquare, Trash2, X, Bot, Pencil, Check } from "lucide-react";

export default function Sidebar({
  conversations,
  activeId,
  isListLoading,
  isBusy,
  onNewChat,
  onSelect,
  onDelete,
  onRename,
  isOpen,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  const startEditing = (conversation) => {
    setEditingId(conversation.id);
    setDraftTitle(conversation.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftTitle("");
  };

  const saveEditing = () => {
    const title = draftTitle.trim();
    const original = conversations.find((c) => c.id === editingId);
    const id = editingId;
    cancelEditing();
    if (!title || !original || title === original.title) return;
    onRename(id, title);
  };

  const confirmDelete = (conversation) => {
    if (window.confirm(`Delete "${conversation.title}"? This cannot be undone.`)) {
      onDelete(conversation.id);
    }
  };

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
            disabled={isBusy}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          {isListLoading ? (
            <p className="px-3 text-sm text-zinc-500">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 text-sm text-zinc-500">No conversations yet.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  {editingId === conversation.id ? (
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1.5">
                      <input
                        autoFocus
                        value={draftTitle}
                        maxLength={80}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                      <button
                        onClick={saveEditing}
                        aria-label="Save title"
                        className="rounded p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        aria-label="Cancel rename"
                        className="rounded p-1 text-zinc-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="group relative">
                      <button
                        onClick={() => onSelect(conversation.id)}
                        disabled={isBusy}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 pr-16 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                          conversation.id === activeId
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-300 hover:bg-zinc-900"
                        }`}
                      >
                        <MessageSquare size={16} className="shrink-0" />
                        <span className="truncate">{conversation.title}</span>
                      </button>
                      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1 md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                        <button
                          onClick={() => startEditing(conversation)}
                          disabled={isBusy}
                          aria-label="Rename conversation"
                          className="rounded p-1 text-zinc-400 hover:text-white disabled:opacity-40"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(conversation)}
                          disabled={isBusy}
                          aria-label="Delete conversation"
                          className="rounded p-1 text-zinc-400 hover:text-red-400 disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
}