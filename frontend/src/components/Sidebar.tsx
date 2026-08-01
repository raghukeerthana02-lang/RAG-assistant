export default function Sidebar() {
  return (
    <div className="h-full bg-gradient-to-b from-zinc-950 to-zinc-900/60 p-5 flex flex-col">

      <button className="w-full rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 py-3 font-medium shadow-md shadow-black/20 transition">
        + New Chat
      </button>

      <div className="mt-8">
        <h2 className="text-sm uppercase text-zinc-500 mb-3 tracking-wide">
          Chats
        </h2>

        <div className="space-y-2">

          <div className="rounded-lg bg-gradient-to-r from-blue-600/20 to-blue-500/5 border border-blue-500/20 p-3 cursor-pointer hover:from-blue-600/30 hover:to-blue-500/10 transition">
            Chat 1
          </div>

          <div className="rounded-lg p-3 cursor-pointer hover:bg-zinc-900/80 transition">
            Chat 2
          </div>

          <div className="rounded-lg p-3 cursor-pointer hover:bg-zinc-900/80 transition">
            Chat 3
          </div>

        </div>

      </div>

    </div>
  );
}