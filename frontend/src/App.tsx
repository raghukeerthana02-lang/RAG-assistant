import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import RightSidebar from "./components/RightSidebar";

const CONVERSATIONS_KEY = "rag-assistant:conversations";
const SELECTED_CONVERSATION_KEY = "rag-assistant:selected-conversation";
// Matches Tailwind's `xl:` prefix used throughout this file. Wider than
// Tailwind's `lg` (1024px) so tablets like iPad Mini (1024px landscape)
// still get the overlay/hamburger treatment instead of the desktop push layout.
const DESKTOP_BREAKPOINT = 1280;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isDesktopViewport() {
  return (
    typeof window !== "undefined" &&
    window.innerWidth >= DESKTOP_BREAKPOINT
  );
}

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: number;
  title: string;
  documentId: number;
  messages: Message[];
};

export type Document = {
  id: number;
  filename: string;
  file_type: string;
  path: string;
};

export default function App() {
  const [leftOpen, setLeftOpen] = useState(isDesktopViewport);
  const [rightOpen, setRightOpen] = useState(isDesktopViewport);

  const [selectedDocument, setSelectedDocument] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadFromStorage<Conversation[]>(CONVERSATIONS_KEY, [])
  );

  const [selectedConversation, setSelectedConversation] =
    useState<number | null>(() =>
      loadFromStorage<number | null>(SELECTED_CONVERSATION_KEY, null)
    );

  useEffect(() => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(
      SELECTED_CONVERSATION_KEY,
      JSON.stringify(selectedConversation)
    );
  }, [selectedConversation]);

  const [documents, setDocuments] = useState<Document[]>([]);

  const [filterDocument, setFilterDocument] =
    useState<number | null>(null);

  // Re-apply the correct default whenever the viewport crosses the
  // desktop/mobile boundary live (window resize, devtools docking,
  // or a tablet being rotated) instead of only checking once at mount.
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

    function handleChange(e: MediaQueryListEvent) {
      setLeftOpen(e.matches);
      setRightOpen(e.matches);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  function openLeftMobile() {
    setLeftOpen(true);
    setRightOpen(false);
  }

  function openRightMobile() {
    setRightOpen(true);
    setLeftOpen(false);
  }

  return (
    <div className="h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-black text-zinc-100 flex overflow-hidden relative">

      {/* Mobile hamburger - left (hidden once its panel is open) */}
      <button
        onClick={openLeftMobile}
        className={`xl:hidden fixed top-4 left-4 z-[60] rounded-lg border border-zinc-700 bg-zinc-800/90 p-2 backdrop-blur ${
          leftOpen ? "hidden" : ""
        }`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile hamburger - right (hidden once its panel is open) */}
      <button
        onClick={openRightMobile}
        className={`xl:hidden fixed top-4 right-4 z-[60] rounded-lg border border-zinc-700 bg-zinc-800/90 p-2 backdrop-blur ${
          rightOpen ? "hidden" : ""
        }`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrops */}
      {leftOpen && (
        <div
          className="xl:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setLeftOpen(false)}
        />
      )}
      {rightOpen && (
        <div
          className="xl:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setRightOpen(false)}
        />
      )}

      {/* LEFT */}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 xl:relative xl:z-auto xl:translate-x-0 xl:transition-[width] xl:duration-300 ${
          leftOpen ? "translate-x-0" : "-translate-x-full"
        } ${leftOpen ? "xl:w-72" : "xl:w-0"}`}
      >
        <div
          className={`h-full w-72 overflow-hidden ${
            leftOpen ? "" : "xl:invisible"
          }`}
        >
          <Sidebar
            conversations={conversations}
            setConversations={setConversations}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            selectedDocument={selectedDocument}
            setSelectedDocument={setSelectedDocument}
            documents={documents}
            filterDocument={filterDocument}
            setFilterDocument={setFilterDocument}
          />
        </div>

        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="hidden xl:flex absolute top-1/2 -right-3 -translate-y-1/2 h-12 w-3 items-center justify-center rounded-full bg-zinc-800"
        >
          {leftOpen ? "‹" : "›"}
        </button>
      </div>

      {/* CENTER */}

      <div className="flex-1 min-w-0">

        <ChatWindow
          conversations={conversations}
          setConversations={setConversations}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          selectedDocument={selectedDocument}
          loading={loading}
          setLoading={setLoading}
        />

      </div>

      {/* RIGHT */}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 border-l border-zinc-800 bg-zinc-950 transition-transform duration-300 xl:relative xl:z-auto xl:translate-x-0 xl:transition-[width] xl:duration-300 ${
          rightOpen ? "translate-x-0" : "translate-x-full"
        } ${rightOpen ? "xl:w-80" : "xl:w-0"}`}
      >
        <div
          className={`h-full w-80 overflow-hidden ${
            rightOpen ? "" : "xl:invisible"
          }`}
        >
          <RightSidebar
            selectedDocument={selectedDocument}
            setSelectedDocument={setSelectedDocument}
            documents={documents}
            setDocuments={setDocuments}
            setFilterDocument={setFilterDocument}
          />
        </div>

        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="hidden xl:flex absolute top-1/2 -left-3 -translate-y-1/2 h-12 w-3 items-center justify-center rounded-full bg-zinc-800"
        >
          {rightOpen ? "›" : "‹"}
        </button>
      </div>

    </div>
  );
}
