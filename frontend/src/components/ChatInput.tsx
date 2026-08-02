import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { askQuestion } from "../api/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  selectedDocument: number | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

export default function ChatInput({
  selectedDocument,
  setMessages,
}: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!question.trim()) return;

    if (selectedDocument === null) {
      alert("Please select a document first.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      const response = await askQuestion(
        selectedDocument,
        question
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong.",
        },
      ]);
    }

    setQuestion("");
    setLoading(false);
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-6">

      <div className="w-[90%] max-w-4xl mx-auto flex items-center gap-3 rounded-2xl bg-zinc-800 px-5 py-3">

        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          className="flex-1 bg-transparent py-2 text-lg outline-none"
          placeholder="Ask anything..."
        />

        <button
          disabled={loading}
          onClick={handleSend}
          className="rounded-full bg-blue-600 p-4 transition hover:bg-blue-500 disabled:opacity-50"
        >
          <SendHorizontal size={22} />
        </button>

      </div>

    </div>
  );
}