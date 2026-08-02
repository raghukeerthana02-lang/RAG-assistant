import { useRef } from "react";
import { Send } from "lucide-react";

export default function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-zinc-800 p-4 bg-gradient-to-t from-zinc-950/60 to-transparent">
      <div className="w-[90%] max-w-4xl mx-auto flex items-end gap-2 rounded-3xl bg-zinc-800/80 border border-zinc-700 pl-5 pr-2 py-2 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition">

        <textarea
          ref={textareaRef}
          onInput={handleInput}
          rows={1}
          className="flex-1 bg-transparent outline-none py-2 text-base leading-6 resize-none max-h-[200px] overflow-y-auto custom-scrollbar placeholder:text-zinc-500"
          placeholder="Ask anything..."
        />

        <button
          className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-md shadow-blue-950/40 transition"
          aria-label="Send"
        >
          <Send className="h-5 w-5" strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
}
