import { useEffect, useRef, useState } from "react";
import { Folder, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import RightSidebar from "./components/RightSidebar";
import { useAuth } from "./context/AuthContext";
import { findOrCreateDraftChat } from "./lib/conversations";
const CONVERSATIONS_KEY = "rag-assistant:conversations";
const SELECTED_CONVERSATION_KEY = "rag-assistant:selected-conversation";

// Chats are scoped per logged-in user so switching accounts on the
// same browser never shows (or overwrites) another user's chats.
function conversationsKey(userId: string) {
  return `${CONVERSATIONS_KEY}:${userId}`;
}

function selectedConversationKey(userId: string) {
  return `${SELECTED_CONVERSATION_KEY}:${userId}`;
}
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
  documentId: string | null;
  messages: Message[];
};

export type Document = {
  id: string;
  filename: string;
  file_type: string;
  path: string;
};

export default function App() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [leftOpen, setLeftOpen] = useState(isDesktopViewport);
  const [rightOpen, setRightOpen] = useState(isDesktopViewport);


  const [selectedDocument, setSelectedDocument] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [selectedConversation, setSelectedConversation] =
    useState<number | null>(null);

  const [filterDocument, setFilterDocument] =
    useState<string | null>(null);

  // Guards against a race between this load effect and the save effects
  // below: when userId changes, React can run the save effects in the same
  // flush using the *pre-load* conversations/selectedConversation values
  // (the setConversations/setSelectedConversation calls here haven't been
  // applied to state yet). Without this, that stale value gets written over
  // the just-loaded data -- and with two tabs open, each tab's cross-tab
  // "storage" listener re-broadcasts the other tab's momentary bad write
  // back and forth, which can lock both tabs onto an empty conversation
  // list instead of self-healing.
  const skipNextSaveRef = useRef(false);

  // Load this user's chats whenever the logged-in user changes
  // (login, logout, or switching accounts on the same browser).
  useEffect(() => {
    skipNextSaveRef.current = true;

    // Neither of these persist per-user, and a stale value left over
    // from whoever was previously logged in in this same tab must not
    // silently filter the new user's freshly-loaded chat list down to
    // nothing (a chat can look "created but invisible" this way).
    setSelectedDocument(null);
    setFilterDocument(null);

    if (!userId) {
      setConversations([]);
      setSelectedConversation(null);
      return;
    }

    const loadedConversations = loadFromStorage<Conversation[]>(
      conversationsKey(userId),
      []
    );

    const loadedSelected = loadFromStorage<number | null>(
      selectedConversationKey(userId),
      null
    );

    if (loadedSelected !== null) {
      // Returning to wherever this user left off.
      setConversations(loadedConversations);
      setSelectedConversation(loadedSelected);
      return;
    }

    // Nothing to return to (brand-new account, or they'd left off on the
    // blank canvas) -- never land there bare. Always point at a real,
    // visible draft chat instead, creating one if none exists yet.
    const { conversation, conversations: nextConversations } =
      findOrCreateDraftChat(loadedConversations);

    setConversations(nextConversations);
    setSelectedConversation(conversation.id);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    if (skipNextSaveRef.current) {
      return;
    }

    localStorage.setItem(
      conversationsKey(userId),
      JSON.stringify(conversations)
    );
  }, [conversations, userId]);

  useEffect(() => {
    if (!userId) return;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    localStorage.setItem(
      selectedConversationKey(userId),
      JSON.stringify(selectedConversation)
    );
  }, [selectedConversation, userId]);

  // Keep conversations in sync across tabs, so a chat deleted in one
  // tab can't be sent to from another tab's stale state.
  useEffect(() => {
    if (!userId) return;

    const key = conversationsKey(userId);

    function handleStorage(e: StorageEvent) {
      if (e.key === key) {
        setConversations(loadFromStorage<Conversation[]>(key, []));
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userId]);

  const [documents, setDocuments] = useState<Document[]>([]);

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

  function handleSelectDocument(documentId: string) {
    setSelectedDocument(documentId);
    setFilterDocument(documentId);

    // Picking a document never creates a chat, and it never reaches
    // out to repurpose some idle draft sitting elsewhere in the list --
    // most of the time this is just browsing/filtering. It only
    // attaches as a source when the chat you already have open is
    // itself still a draft (unsent); otherwise this click is pure
    // filtering and the chat list is left untouched.
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation && c.messages.length === 0
          ? { ...c, documentId }
          : c
      )
    );
  }

  function openLeftMobile() {
    setLeftOpen(true);
    setRightOpen(false);
  }

  function openRightMobile() {
    setRightOpen(true);
    setLeftOpen(false);
  }

  return (
    <div className="h-dvh bg-gradient-to-br from-zinc-950 via-zinc-950 to-black text-zinc-100 flex overflow-hidden relative">

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
        <Folder className="h-5 w-5 text-yellow-400" fill="currentColor" />
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
        className={`fixed inset-y-0 left-0 z-50 w-80 border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 xl:relative xl:z-auto xl:translate-x-0 xl:transition-[width] xl:duration-300 ${
          leftOpen ? "translate-x-0" : "-translate-x-full"
        } ${leftOpen ? "xl:w-80" : "xl:w-0"}`}
      >
        <div
          className={`h-full w-80 overflow-hidden ${
            leftOpen ? "" : "xl:invisible"
          }`}
        >
          <Sidebar
            conversations={conversations}
            setConversations={setConversations}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
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
          documents={documents}
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
            onSelectDocument={handleSelectDocument}
            documents={documents}
            setDocuments={setDocuments}
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
