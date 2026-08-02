import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedDocument: number | null;
};

export default function ChatWindow({
  messages,
  setMessages,
  selectedDocument,
}: Props) {
  return (
    <div className="h-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col">

      <div className="border-b border-zinc-800 px-6 py-4 text-xl font-semibold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="w-[90%] max-w-4xl mx-auto space-y-6">

          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              isUser={message.role === "user"}
              message={message.content}
            />
          ))}

        </div>
      </div>

      <ChatInput
        selectedDocument={selectedDocument}
        messages={messages}
        setMessages={setMessages}
      />

    </div>
  );
}