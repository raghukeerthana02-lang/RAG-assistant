import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  FilePenLine,
  Folder,
  MoreHorizontal,
  PencilLine,
  Search,
  Trash2,
  X,
} from "lucide-react";
import UserMenu from "./UserMenu";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: number;
  title: string;
  documentId: number;
  messages: Message[];
};

type Document = {
  id: number;
  filename: string;
  file_type: string;
  path: string;
};

type Props = {
  conversations: Conversation[];
  selectedConversation: number | null;
  setSelectedConversation: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  setConversations: React.Dispatch<
    React.SetStateAction<Conversation[]>
  >;
  selectedDocument: number | null;
  setSelectedDocument: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  documents: Document[];
  filterDocument: number | null;
  setFilterDocument: React.Dispatch<
    React.SetStateAction<number | null>
  >;
};

export default function Sidebar({
  conversations,
  selectedConversation,
  setSelectedConversation,
  setConversations,
  selectedDocument,
  setSelectedDocument,
  documents,
  filterDocument,
  setFilterDocument,
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [sourceSubmenuOpen, setSourceSubmenuOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;
  const query = searchQuery.trim().toLowerCase();

  function matchRank(title: string) {
    const t = title.toLowerCase();
    if (t === query) return 0;
    if (t.startsWith(query)) return 1;
    return 2;
  }

  const visibleConversations = conversations
    .filter((c) =>
      isSearching || filterDocument === null
        ? true
        : c.documentId === filterDocument
    )
    .filter((c) => c.title.toLowerCase().includes(query))
    .sort((a, b) =>
      isSearching ? matchRank(a.title) - matchRank(b.title) : 0
    );

  function handleNewChat() {

    if (selectedConversation === null) {
      // Already on the blank "new chat" canvas — nothing to do.
      return;
    }

    if (selectedDocument === null) {
      alert("Select a document first.");
      return;
    }

    const existingEmptyChat = conversations.find(
      (c) => c.documentId === selectedDocument && c.messages.length === 0
    );

    if (existingEmptyChat) {
      setSelectedConversation(existingEmptyChat.id);
      setSelectedDocument(existingEmptyChat.documentId);
      return;
    }

    const newConversation: Conversation = {

      id: Date.now(),

      title: "New Chat",

      documentId: selectedDocument,

      messages: [],
    };

    setConversations((prev) => [
      newConversation,
      ...prev,
    ]);

    setSelectedConversation(newConversation.id);
  }

  function startRename(chat: Conversation) {
    setRenamingId(chat.id);
    setRenameValue(chat.title);
    setOpenMenuId(null);
  }

  function commitRename(id: number) {
    const trimmed = renameValue.trim();

    if (trimmed) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, title: trimmed } : c
        )
      );
    }

    setRenamingId(null);
  }

  function handleDelete(id: number) {
    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (selectedConversation === id) {
      setSelectedConversation(null);
    }

    setOpenMenuId(null);
  }

  function handleChangeSource(chatId: number, docId: number) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, documentId: docId } : c
      )
    );

    if (selectedConversation === chatId) {
      setSelectedDocument(docId);
    }

    setFilterDocument(null);

    setOpenMenuId(null);
    setSourceSubmenuOpen(false);
  }

  return (
    <div className="h-full bg-gradient-to-b from-zinc-950 to-zinc-900/60 flex flex-col overflow-hidden">

      <div className="flex flex-col flex-1 min-h-0 p-5">

      <div className="flex gap-5">
        <button
          onClick={handleNewChat}
          className="flex-1 rounded-xl bg-black border border-white/70 hover:bg-white/10 py-3 font-medium flex items-center justify-center gap-2 transition"
        >
          <PencilLine className="h-5 w-5" />
          New Chat
        </button>

        <button
          onClick={() => {
            setSearchOpen((v) => !v);
            setSearchQuery("");
          }}
          className={`shrink-0 rounded-xl border py-3 px-3.5 transition ${
            searchOpen
              ? "border-blue-500/70 bg-blue-700/30 text-blue-300"
              : "border-white/70 bg-black hover:bg-white/10 text-white"
          }`}
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {searchOpen && (
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col flex-1 min-h-0">

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">
            Chats
          </h2>

          <button
            onClick={() => setFilterDocument(null)}
            className="text-lg text-white hover:text-blue-300 hover:underline"
          >
            All chats
          </button>
        </div>

        <div className="border-b border-zinc-700/40 mb-3" />

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 -mr-2 pr-2">

          {visibleConversations.map((chat) => (

            <div
              key={chat.id}
              onClick={() => {
                setSelectedConversation(chat.id);
                setSelectedDocument(chat.documentId);

                // Opening a chat that doesn't belong to the active
                // document filter would otherwise vanish from the list
                // the moment the filter (or search) stops overriding it.
                if (
                  filterDocument !== null &&
                  filterDocument !== chat.documentId
                ) {
                  setFilterDocument(null);
                }
              }}
              className={`group relative rounded-xl cursor-pointer p-3 pr-9 transition ${
                selectedConversation === chat.id
                  ? "bg-blue-700/60"
                  : "hover:bg-zinc-900"
              }`}
            >

              {renamingId === chat.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(chat.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onBlur={() => commitRename(chat.id)}
                  className="w-full rounded bg-zinc-800 px-1.5 py-0.5 text-sm font-medium outline-none ring-1 ring-blue-500"
                />
              ) : (
                <div className="font-medium truncate">
                  {chat.title}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 pl-4">
                <FilePenLine className="h-3.5 w-3.5 text-white shrink-0" />
                <span className="truncate">
                  {documents.find((d) => d.id === chat.documentId)
                    ?.filename ?? `Document #${chat.documentId}`}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({
                    top: rect.bottom + 4,
                    left: rect.right - 192,
                  });
                  setSourceSubmenuOpen(false);
                  setOpenMenuId(
                    openMenuId === chat.id ? null : chat.id
                  );
                }}
                className="absolute top-2 right-2 rounded p-1 text-zinc-400 opacity-0 transition hover:text-white group-hover:opacity-100"
              >
                <MoreHorizontal size={16} />
              </button>

              {openMenuId === chat.id &&
                menuPos &&
                createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setSourceSubmenuOpen(false);
                      }}
                    />

                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ top: menuPos.top, left: menuPos.left }}
                      className="fixed z-50 w-48 rounded-xl border border-zinc-700 bg-zinc-800 py-1 shadow-lg shadow-black/40"
                    >
                      <button
                        onClick={() => startRename(chat)}
                        className="text-slate-200 flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-700"
                      >
                        <PencilLine size={14} />
                        Rename
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setSourceSubmenuOpen((v) => !v)
                          }
                          className="text-slate-200 flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-700"
                        >
                          <span className="flex items-center gap-2">
                            <Folder size={14} />
                            Change source
                          </span>
                          <ChevronRight size={14} />
                        </button>

                        {sourceSubmenuOpen && (
                          <div className="absolute left-full top-0 ml-1 max-h-64 w-56 overflow-y-auto custom-scrollbar rounded-xl border border-zinc-700 bg-zinc-800 py-1 shadow-lg shadow-black/40">
                            {documents.map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() =>
                                  handleChangeSource(chat.id, doc.id)
                                }
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-700 ${
                                  chat.documentId === doc.id
                                    ? "text-blue-400"
                                    : "text-slate-200"
                                }`}
                              >
                                <Folder
                                  size={14}
                                  className="shrink-0 text-yellow-400"
                                  fill="currentColor"
                                />
                                <span className="truncate">
                                  {doc.filename}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(chat.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </>,
                  document.body
                )}

            </div>

          ))}

        </div>

      </div>

      </div>

      <UserMenu />

    </div>
  );
}
