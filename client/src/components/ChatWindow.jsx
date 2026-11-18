import { useEffect, useRef } from "react";
import { Menu, X, LoaderCircle } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import EmptyState from "./EmptyState";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  title,
  messages,
  isLoading,
  isHistoryLoading,
  notice,
  onDismissNotice,
  onSend,
  onOpenSidebar,
}) {
  const bottomRef = useRef(null);

  const lastMessage = messages[messages.length - 1];
  const showTyping = isLoading && lastMessage?.role === "user";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isLoading ? "auto" : "smooth" });
  }, [messages, isLoading]);

  let content;
  if (isHistoryLoading) {
    content = (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-400">
        <LoaderCircle size={18} className="animate-spin" />
        Loading conversation...
      </div>
    );
  } else if (messages.length === 0) {
    content = <EmptyState onPick={onSend} />;
  } else {
    content = (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            isError={message.isError}
          />
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    );
  }

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

      <div className="flex-1 overflow-y-auto">{content}</div>

      {notice && (
        <div className="mx-auto flex w-full max-w-3xl items-start gap-2 px-4 pb-2">
          <div className="flex flex-1 items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            <span className="flex-1">{notice}</span>
            <button onClick={onDismissNotice} aria-label="Dismiss message" className="text-red-300 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <ChatInput onSend={onSend} disabled={isLoading || isHistoryLoading} />
    </main>
  );
}