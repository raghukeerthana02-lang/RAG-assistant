import { useState } from "react";
import { Check, Copy, File } from "lucide-react";
import { openDocumentAtPage } from "../api/api";

type Source = {
  filename: string;
  page: number;
};

type Props = {
  message: string;
  isUser: boolean;
  sources?: Source[];
  documentId?: number | null;
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
      <div className="text-lg text-white whitespace-pre-wrap break-words">
        {message}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleCopy}
          className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>

        {citations.map((source) => (
          <button
            key={source.page}
            onClick={() => handleCitationClick(source.page)}
            className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
          >
            <File
              size={14}
              className="text-white shrink-0"
            />
            Page {source.page}
          </button>
        ))}
      </div>
    </div>
  );
}
