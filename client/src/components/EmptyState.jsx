import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Explain what a closure is in JavaScript",
  "Give me a React useEffect example",
  "What is the difference between SQL and MongoDB?",
  "Help me prepare for a fresher SDE interview",
];

export default function EmptyState({ onPick }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600">
        <Sparkles size={28} />
      </div>
      <h1 className="text-2xl font-semibold">How can I help you today?</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        Ask me anything, or try one of these to get started.
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            onClick={() => onPick(text)}
            className="rounded-xl border border-zinc-700 px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-zinc-800"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}