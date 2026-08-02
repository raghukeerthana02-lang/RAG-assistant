import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import RightSidebar from "./components/RightSidebar";

export default function App() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);

  return (
    <div className="h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-black text-zinc-100 flex overflow-hidden">

      {/* Left Sidebar */}
      <div
        className={`relative border-r border-zinc-800 transition-all duration-300 ease-in-out shrink-0 ${
          leftOpen ? "w-72" : "w-0"
        }`}
      >
        <div className={`h-full w-72 overflow-hidden ${leftOpen ? "" : "invisible"}`}>
          <Sidebar />
        </div>

        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 h-12 w-3 flex items-center justify-center rounded-full bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-zinc-400 text-xs shadow-md shadow-black/30 transition"
          aria-label={leftOpen ? "Collapse chats sidebar" : "Expand chats sidebar"}
        >
          {leftOpen ? "‹" : "›"}
        </button>
      </div>

      {/* Chat */}
      <div className="flex-1 min-w-0">
        <ChatWindow />
      </div>

      {/* Right Sidebar */}
      <div
        className={`relative border-l border-zinc-800 transition-all duration-300 ease-in-out shrink-0 ${
          rightOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`h-full w-80 overflow-hidden ${rightOpen ? "" : "invisible"}`}>
          <RightSidebar
              selectedDocument={selectedDocument}
              setSelectedDocument={setSelectedDocument}
          />
        </div>

        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="absolute top-1/2 -left-3 -translate-y-1/2 h-12 w-3 flex items-center justify-center rounded-full bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-zinc-400 text-xs shadow-md shadow-black/30 transition"
          aria-label={rightOpen ? "Collapse documents sidebar" : "Expand documents sidebar"}
        >
          {rightOpen ? "›" : "‹"}
        </button>
      </div>

    </div>
  );
}
