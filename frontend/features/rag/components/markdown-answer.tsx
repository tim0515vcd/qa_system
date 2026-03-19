"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  content: string;
};

export function MarkdownAnswer({ content }: Props) {
  return (
    <div className="max-w-none text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-2xl font-semibold tracking-tight text-slate-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 text-xl font-semibold tracking-tight text-slate-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 text-lg font-semibold tracking-tight text-slate-900">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-5 text-[15px] leading-8 text-slate-800">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-5 list-disc space-y-2 pl-6 text-[15px] leading-8 text-slate-800">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-6 text-[15px] leading-8 text-slate-800">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-r-xl border-l-4 border-slate-300 bg-slate-50 px-4 py-3 text-slate-700">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-2xl border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b px-4 py-3 text-left font-medium text-slate-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b px-4 py-3 align-top text-slate-700">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-sky-700 underline underline-offset-4 hover:text-sky-900"
            >
              {children}
            </a>
          ),
          code(props) {
            const { className, children } = props;
            const isBlock = className?.includes("language-");

            if (!isBlock) {
              return (
                <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900">
                  {children}
                </code>
              );
            }

            const codeText = String(children).replace(/\n$/, "");
            const language = className?.replace("language-", "") ?? "";

            return (
              <CodeBlock className={className} code={codeText} language={language}>
                {children}
              </CodeBlock>
            );
          },
          pre: ({ children }) => <>{children}</>,
          hr: () => <hr className="my-8 border-slate-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({
  children,
  code,
  className,
  language,
}: {
  children: React.ReactNode;
  code: string;
  className?: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = code ?? "";

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
        return;
      }
    } catch {
      // fallback
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (!successful) {
        throw new Error("copy failed");
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("複製失敗:", error);
      setCopied(false);
    }
  }

  return (
    <div className="my-6 overflow-hidden rounded-2xl border bg-slate-950 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="text-xs text-slate-400">{language || "code"}</div>

        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg px-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              已複製
            </>
          ) : (
            <>
              <Copy className="mr-1 h-4 w-4" />
              複製
            </>
          )}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-sm leading-7">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}