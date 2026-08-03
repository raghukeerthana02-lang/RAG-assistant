import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { askQuestion } from "../api/api";

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

export default function ChatInput({
  selectedConversation,
  setSelectedConversation,
  setConversations,
  selectedDocument,
  loading,
  setLoading,
}: Props) {
  const [question, setQuestion] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    if (selectedDocument === null) {
      alert("Please select a document.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: question,
    };

    let conversationId = selectedConversation;

    if (conversationId === null) {
      conversationId = Date.now();

      const newConversation: Conversation = {
        id: conversationId,
        title: question.slice(0, 40),
        documentId: selectedDocument,
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
        selectedDocument,
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
    } catch {
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
                content:
                  "Something went wrong.",
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