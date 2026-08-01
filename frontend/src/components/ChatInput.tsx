export default function ChatInput() {
  return (
    <div className="border-t border-zinc-800 p-4 flex gap-3 bg-gradient-to-t from-zinc-950/60 to-transparent">

      <input
        className="flex-1 rounded-lg bg-zinc-800/80 px-4 py-3 outline-none border border-zinc-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
        placeholder="Ask anything..."
      />

      <button className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-5 shadow-md shadow-blue-950/40 transition">
        Send
      </button>

    </div>
  );
}