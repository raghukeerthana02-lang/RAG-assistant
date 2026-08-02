import { PencilLine } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="h-full bg-gradient-to-b from-zinc-950 to-zinc-900/60 p-5 flex flex-col">

      <button className="w-full rounded-xl bg-black border border-white/70 hover:bg-white/10 py-3 font-medium flex items-center justify-center gap-2 transition">
        <PencilLine className="h-5 w-5" />
        New Chat
      </button>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-3 tracking-wide">
          Chats
        </h2>

        <div className="border-b border-zinc-700/40 mb-3" />

        <div className="space-y-2">

          <div className="rounded-xl bg-gradient-to-br from-blue-700/60 to-blue-800/60 border border-blue-500/10 text-white p-3 cursor-pointer transition">
            Chat 1
          </div>

          <div className="rounded-xl p-3 cursor-pointer hover:bg-zinc-900/80 transition">
            Chat 2
          </div>

          <div className="rounded-xl p-3 cursor-pointer hover:bg-zinc-900/80 transition">
            Chat 3
          </div>

        </div>

      </div>

    </div>
  );
}