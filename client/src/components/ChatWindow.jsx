import { useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import EmptyState from "./EmptyState";
import ChatInput from "./ChatInput";

export default function ChatWindow({ title, messages, isLoading, onSend, onOpenSidebar }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col bg-zinc-900">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3 md:hidden">
        <button
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          className="rounded p-1 text-zinc-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
        <span className="truncate text-sm font-medium">{title}</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPick={onSend} />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} content={message.content} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </main>
  );
}