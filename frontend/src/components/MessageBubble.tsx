import { useState } from "react";
import { Check, Copy, File } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { openDocumentAtPage } from "../lib/api";

const markdownComponents = {
  p: (props: React.ComponentProps<"p">) => (
    <p className="mb-2 last:mb-0" {...props} />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li className="leading-snug" {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a
      className="text-blue-400 underline hover:text-blue-300"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code className="rounded bg-zinc-800 px-1 py-0.5 text-sm" {...props} />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      className="mb-2 overflow-x-auto rounded-lg bg-zinc-800 p-3 text-sm last:mb-0"
      {...props}
    />
  ),
  h1: (props: React.ComponentProps<"h1">) => (
    <h2 className="mb-1 mt-2 text-xl font-semibold text-white first:mt-0" {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h3 className="mb-1 mt-2 text-lg font-semibold text-white first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h4 className="mb-1 mt-2 font-semibold text-white first:mt-0" {...props} />
  ),
};

type Source = {
  filename: string;
  page: number;
};

type Props = {
  message: string;
  isUser: boolean;
  sources?: Source[];
  documentId?: string | null;
};

export default function MessageBubble({
  message,
  isUser,
  sources,
  documentId,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const citations = Array.from(
    new Map((sources ?? []).map((s) => [s.page, s])).values()
  );

  async function handleCitationClick(page: number) {
    if (documentId == null) return;

    try {
      await openDocumentAtPage(documentId, page);
    } catch {
      alert("Document no longer available, please re-upload");
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="w-fit max-w-2xl rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 text-lg text-white shadow-md shadow-black/20 whitespace-pre-wrap break-words">
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="group w-fit max-w-2xl">
      <div className="text-lg text-white break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
          disallowedElements={["img"]}
        >
          {message}
        </ReactMarkdown>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleCopy}
          className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>

        {citations.map((source) => {
          const shortName =
            source.filename.length > 5
              ? `${source.filename.slice(0, 5)}…`
              : source.filename;

          return (
            <button
              key={source.page}
              onClick={() => handleCitationClick(source.page)}
              title={source.filename}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
            >
              <File
                size={14}
                className="text-white shrink-0"
              />
              <span>{shortName}</span>
              <span className="shrink-0 text-slate-300">
                Pg {source.page}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
