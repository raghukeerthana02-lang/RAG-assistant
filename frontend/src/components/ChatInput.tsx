import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { askQuestion } from "../api/api";

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
  selectedConversation: number | null;
  setSelectedConversation: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  conversations: Conversation[];
  setConversations: React.Dispatch<
    React.SetStateAction<Conversation[]>
  >;
  selectedDocument: number | null;
  loading: boolean;
  setLoading: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

const QUESTION_LIMIT = 20;

function getErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return "Can't reach the server. Make sure the backend is running.";
  }

  if (error instanceof Error && error.message === "Document not found.") {
    return "This chat's document is no longer available. Change its source to continue.";
  }

  return "Something went wrong. Please try again.";
}

export default function ChatInput({
  selectedConversation,
  setSelectedConversation,
  conversations,
  setConversations,
  selectedDocument,
  loading,
  setLoading,
}: Props) {
  const [question, setQuestion] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  );

  const questionCount =
    currentConversation?.messages.filter((m) => m.role === "user").length ??
    0;

  const limitReached = questionCount >= QUESTION_LIMIT;

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    const multiline = el.scrollHeight > 55;

    if (multiline) {
      el.style.height = `${Math.min(
        el.scrollHeight,
        280
      )}px`;
    }

    setIsMultiline(multiline);
  };

  async function handleSend() {
    if (!question.trim()) return;

    if (limitReached) return;

    let conversationId = selectedConversation;

    const conversationExists = conversations.some(
      (conv) => conv.id === conversationId
    );

    // A chat always queries the document it was created with, never
    // whatever happens to be globally selected in the right sidebar.
    const activeDocumentId = conversationExists
      ? currentConversation!.documentId
      : selectedDocument;

    if (activeDocumentId === null) {
      alert("Please select a document.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: question,
    };

    if (conversationId === null || !conversationExists) {
      conversationId = Date.now();

      const newConversation: Conversation = {
        id: conversationId,
        title: question.slice(0, 40),
        documentId: activeDocumentId,
        messages: [userMessage],
      };

      setConversations((prev) => [newConversation, ...prev]);
      setSelectedConversation(conversationId);
    } else {
      // Add the user message
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId)
            return conv;

          return {
            ...conv,
            title:
              conv.title === "New Chat"
                ? question.slice(0, 40)
                : conv.title,
            messages: [...conv.messages, userMessage],
          };
        })
      );
    }

    setLoading(true);

    const start = Date.now();
    const MIN_THINKING_MS = 1400;

    try {
      const response = await askQuestion(
        activeDocumentId,
        question
      );

      const elapsed = Date.now() - start;

      if (elapsed < MIN_THINKING_MS) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            MIN_THINKING_MS - elapsed
          )
        );
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer,
        sources: response.sources,
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId)
            return conv;

          return {
            ...conv,
            messages: [
              ...conv.messages,
              assistantMessage,
            ],
          };
        })
      );
    } catch (error) {
      const errorContent = getErrorMessage(error);

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId)
            return conv;

          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                role: "assistant",
                content: errorContent,
              },
            ],
          };
        })
      );
    }

    setQuestion("");
    setIsMultiline(false);

    if (textareaRef.current)
      textareaRef.current.style.height = "auto";

    setLoading(false);
  }

  if (limitReached) {
    return (
      <div className="p-4">
        <div className="w-[90%] max-w-4xl mx-auto rounded-3xl border border-amber-500/30 bg-zinc-800 px-5 py-4 text-center text-sm text-amber-300">
          Sorry, the limit of {QUESTION_LIMIT} questions has been reached for
          this chat. Please start a new chat to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">

      <div
        className={`w-[90%] max-w-4xl mx-auto rounded-3xl bg-zinc-800 shadow-lg shadow-black/30 ${
          isMultiline
            ? "flex flex-col"
            : "flex items-center gap-2 px-3 py-2"
        }`}
      >

        <div className={isMultiline ? "pr-3" : "flex-1"}>

          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            onInput={handleInput}
            rows={1}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                handleSend();
              }
            }}
            className={`w-full bg-transparent text-lg leading-6 outline-none resize-none custom-scrollbar ${
              isMultiline
                ? "pl-5 pr-2 pt-5 max-h-[280px] overflow-y-auto"
                : "px-2 py-1.5"
            }`}
            placeholder="Ask anything..."
          />

        </div>

        <div
          className={
            isMultiline
              ? "flex justify-end px-3 pb-3 pt-1"
              : "shrink-0"
          }
        >
          <button
            disabled={loading}
            onClick={handleSend}
            className="shrink-0 rounded-full bg-blue-600 p-3 transition hover:bg-blue-500 disabled:opacity-50"
          >
            <SendHorizontal
              size={20}
              className="-rotate-45"
            />
          </button>
        </div>

      </div>

    </div>
  );
}