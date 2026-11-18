import { Bot, User } from "lucide-react";

export default function MessageBubble({ role, content, isError = false }) {
  const isUser = role === "user";

  let bubbleStyle = "bg-zinc-800 text-zinc-100";
  if (isUser) bubbleStyle = "bg-indigo-600 text-white";
  if (isError) bubbleStyle = "border border-red-500/40 bg-red-950/40 text-red-200";

  let avatarStyle = isUser ? "bg-indigo-600" : "bg-emerald-600";
  if (isError) avatarStyle = "bg-red-600";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${avatarStyle}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${bubbleStyle}`}
      >
        {content}
      </div>
    </div>
  );
}