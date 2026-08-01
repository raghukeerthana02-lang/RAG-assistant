export default function RightSidebar() {
  return (
    <div className="h-full bg-gradient-to-b from-zinc-950 to-zinc-900/60 p-5">

      <h2 className="text-lg font-semibold mb-6 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
        Documents
      </h2>

      <div className="space-y-3">

        <div className="rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-900/40 border border-zinc-800 p-3 hover:from-zinc-800 hover:to-zinc-800/40 cursor-pointer transition">
          📄 ANN_M1_Introduction.pptx
        </div>

        <div className="rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-900/40 border border-zinc-800 p-3 hover:from-zinc-800 hover:to-zinc-800/40 cursor-pointer transition">
          📄 CNN.pdf
        </div>

        <div className="rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-900/40 border border-zinc-800 p-3 hover:from-zinc-800 hover:to-zinc-800/40 cursor-pointer transition">
          📄 NLP.docx
        </div>

      </div>

    </div>
  );
}