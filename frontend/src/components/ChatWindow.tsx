import { useEffect, useRef, useState } from "react";
import { MoveDown } from "lucide-react";
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
};

type Conversation = {
  id: number;
  title: string;
  documentId: number;
  messages: Message[];
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

  selectedDocument: number | null;
};

export default function ChatWindow({
  conversations,
  selectedConversation,
  setSelectedConversation,
  setConversations,
  selectedDocument,
  loading,
  setLoading,
}: Props) {

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  );

  const messages = currentConversation?.messages ?? [];

  const isEmpty = selectedConversation === null || messages.length === 0;

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

      <div className="border-b border-zinc-800 px-16 py-4 text-xl font-semibold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent text-center xl:px-6 xl:text-left">
        Chat
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
                    documentId={currentConversation?.documentId ?? null}
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