import { useEffect, useRef, useState } from "react";
import { Menu, X, LoaderCircle, ArrowDown } from "lucide-react";
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
  onStop,
  onRegenerate,
  onRetry,
  onOpenSidebar,
}) {
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);
  const [showJumpButton, setShowJumpButton] = useState(false);

  const lastIndex = messages.length - 1;
  const lastMessage = messages[lastIndex];
  const showTyping = isLoading && lastMessage?.role === "user";

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distanceFromBottom < 80;
    setShowJumpButton(distanceFromBottom > 300);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading, isHistoryLoading]);

  useEffect(() => {
    if (isHistoryLoading) stickToBottom.current = true;
  }, [isHistoryLoading]);

  const jumpToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  const handleSend = (text) => {
    stickToBottom.current = true;
    onSend(text);
  };

  let content;
  if (isHistoryLoading) {
    content = (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-400">
        <LoaderCircle size={18} className="animate-spin" />
        Loading conversation...
      </div>
    );
  } else if (messages.length === 0) {
    content = <EmptyState onPick={handleSend} />;
  } else {
    content = (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        {messages.map((message, index) => {
          const isLast = index === lastIndex;
          const isAssistantReply = message.role === "assistant" && !message.isError;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isLoading && isLast && message.role === "assistant"}
              showRegenerate={!isLoading && isLast && isAssistantReply}
              onRegenerate={onRegenerate}
              onRetry={onRetry}
            />
          );
        })}
        {showTyping && <TypingIndicator />}
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

      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto">
          {content}
        </div>

        {showJumpButton && (
          <button
            onClick={jumpToBottom}
            aria-label="Scroll to latest message"
            className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-zinc-200 shadow-lg hover:bg-zinc-700"
          >
            <ArrowDown size={18} />
          </button>
        )}
      </div>

      {notice && (
        <div className="mx-auto flex w-full max-w-3xl items-start gap-2 px-4 pb-2">
          <div className="flex flex-1 items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            <span className="flex-1">{notice}</span>
            <button
              onClick={onDismissNotice}
              aria-label="Dismiss message"
              className="text-red-300 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onStop={onStop}
        isGenerating={isLoading}
        disabled={isLoading || isHistoryLoading}
      />
    </main>
  );
}