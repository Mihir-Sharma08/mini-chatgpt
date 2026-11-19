import { Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

export default function CopyButton({ text, label = "Copy", showLabel = false }) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      {showLabel && <span>{copied ? "Copied!" : "Copy"}</span>}
    </button>
  );
}