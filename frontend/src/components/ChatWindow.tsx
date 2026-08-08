import { useEffect, useRef, useState } from "react";
import { CircleHelp, Download, MoveDown } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";

type Source = {
  filename: string;
  page: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  documentId?: string;
};

type Conversation = {
  id: number;
  title: string;
  documentId: string;
  messages: Message[];
};

type Document = {
  id: string;
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

  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  setConversations: React.Dispatch<
    React.SetStateAction<Conversation[]>
  >;

  selectedDocument: string | null;
  documents: Document[];
};

export default function ChatWindow({
  conversations,
  selectedConversation,
  setSelectedConversation,
  setConversations,
  selectedDocument,
  documents,
  loading,
  setLoading,
}: Props) {

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  );

  const messages = currentConversation?.messages ?? [];

  const isEmpty = selectedConversation === null || messages.length === 0;

  const canDownload = !!currentConversation && messages.length > 0;

  function handleDownloadTranscript() {
    if (!currentConversation) return;

    const doc = documents.find(
      (d) => d.id === currentConversation.documentId
    );

    const lines = [
      `Chat: ${currentConversation.title}`,
      doc ? `Document: ${doc.filename}` : null,
      "",
      ...currentConversation.messages.map(
        (m) => `${m.role === "user" ? "You" : "Assistant"}: ${m.content}`
      ),
    ].filter((line): line is string => line !== null);

    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const safeTitle =
      currentConversation.title.replace(/[\\/:*?"<>|]/g, "-").trim() ||
      "chat";

    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  function isAtBottom() {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function scrollToBottom(smooth: boolean) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  function handleScroll() {
    const atBottom = isAtBottom();
    wasAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
  }

  useEffect(() => {
    wasAtBottomRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  useEffect(() => {
    if (wasAtBottomRef.current) {
      scrollToBottom(false);
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, messages.length, loading]);

  return (
    <div className="h-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col">

      <div className="border-b border-zinc-800 px-16 py-4 xl:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-zinc-100">
            Chat
          </span>

          <div className="group relative">
            <button
              type="button"
              aria-label="How to use"
              className="flex text-slate-100 transition hover:text-zinc-300"
            >
              <CircleHelp size={20} />
            </button>

            <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-left text-sm text-zinc-300 opacity-0 shadow-lg shadow-black/40 transition group-hover:pointer-events-auto group-hover:opacity-100">
              <ul className="list-disc space-y-1.5 pl-4">
                <li>Upload a document, then select it to get started</li>
                <li>Start asking questions about the selected document.</li>
                <li>
                  Rename, delete, or change the source of a chat from its ⋯
                  menu in the sidebar.
                </li>
                <li>Search chats by name using the search icon.</li>
                <li>Selecting a document filters the chats which use it as a source.</li>
                <li>Click All chats to clear the filters.</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadTranscript}
          disabled={!canDownload}
          aria-label="Download chat transcript"
          title="Download chat transcript"
          className="shrink-0 rounded-xl bg-black border border-white/70 hover:bg-white/10 p-2.5 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
        >
          <Download size={18} />
        </button>
      </div>


      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">

          <h1 className="text-4xl font-semibold text-white text-center">
            Hi, what do you need today?
          </h1>

          <div className="w-full">
            <ChatInput
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              conversations={conversations}
              setConversations={setConversations}
              selectedDocument={selectedDocument}
              loading={loading}
              setLoading={setLoading}
            />
          </div>

        </div>
      ) : (
        <>
          <div className="relative flex-1 min-h-0">

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto custom-scrollbar p-6"
            >

              <div className="w-[90%] max-w-4xl mx-auto space-y-6">

                {messages.map((message, index) => (

                  <MessageBubble
                    key={index}
                    isUser={message.role === "user"}
                    message={message.content}
                    sources={message.sources}
                    documentId={
                      message.documentId ??
                      currentConversation?.documentId ??
                      null
                    }
                  />

                ))}

                {loading && <TypingIndicator />}

              </div>

            </div>

            {showScrollButton && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-800 p-2 text-zinc-200 shadow-lg shadow-black/40 transition hover:bg-zinc-700"
                aria-label="Scroll to bottom"
              >
                <MoveDown size={20} />
              </button>
            )}

          </div>

          <ChatInput
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            conversations={conversations}
            setConversations={setConversations}
            selectedDocument={selectedDocument}
            loading={loading}
            setLoading={setLoading}
          />

        </>
      )}

    </div>
  );
}