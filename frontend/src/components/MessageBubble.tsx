import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Props = {
  message: string;
  isUser: boolean;
};

export default function MessageBubble({
  message,
  isUser,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

      <button
        onClick={handleCopy}
        className="mt-2 rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
      >
        {copied ? <Check size={20} /> : <Copy size={20} />}
      </button>
    </div>
  );
}
