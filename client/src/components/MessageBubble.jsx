import { Bot, User, CircleAlert, RefreshCw } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import CopyButton from "./CopyButton";

export default function MessageBubble({
  message,
  isStreaming,
  showRegenerate,
  onRegenerate,
  onRetry,
}) {
  const { role, content, isError } = message;

  if (role === "user") {
    return (
      <div className="flex flex-row-reverse gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600">
          <User size={16} />
        </div>
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm leading-relaxed text-white">
          {content}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600">
          <CircleAlert size={16} />
        </div>
        <div className="max-w-[85%] rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <p>{content}</p>
          {message.retry && (
            <button
              onClick={() => onRetry(message.retry)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-red-400/40 px-2.5 py-1 text-xs hover:bg-red-900/40"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600">
        <Bot size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <MarkdownRenderer content={content} />

        {!isStreaming && (
          <div className="mt-2 flex items-center gap-1">
            <CopyButton text={content} label="Copy response" showLabel />
            {showRegenerate && (
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}