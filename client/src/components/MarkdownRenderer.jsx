import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import CodeBlock from "./CodeBlock";
import { getTextContent } from "../utils/getTextContent";
import "highlight.js/styles/github-dark.css";

const remarkPlugins = [remarkGfm];
const rehypePlugins = [[rehypeHighlight, { ignoreMissing: true }]];

const components = {
  pre({ children }) {
    const codeElement = Array.isArray(children) ? children[0] : children;
    const className = codeElement?.props?.className ?? "";
    const language = /language-([\w-]+)/.exec(className)?.[1] ?? "text";
    const text = getTextContent(codeElement?.props?.children).replace(/\n$/, "");

    return (
      <CodeBlock language={language} text={text}>
        {children}
      </CodeBlock>
    );
  },
  a({ node, ...props }) {
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  },
  table({ node, ...props }) {
    return (
      <div className="overflow-x-auto">
        <table {...props} />
      </div>
    );
  },
};

function MarkdownRenderer({ content }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none break-words prose-a:text-emerald-400 prose-code:rounded prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-th:text-left">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownRenderer);