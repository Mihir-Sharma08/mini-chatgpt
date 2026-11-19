import CopyButton from "./CopyButton";

export default function CodeBlock({ language, text, children }) {
  return (
    <div className="not-prose my-4 overflow-hidden rounded-lg border border-zinc-700 bg-[#0d1117]">
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-1.5">
        <span className="text-xs text-zinc-300">{language}</span>
        <CopyButton text={text} label="Copy code" showLabel />
      </div>
      <pre className="overflow-x-auto text-sm">{children}</pre>
    </div>
  );
}