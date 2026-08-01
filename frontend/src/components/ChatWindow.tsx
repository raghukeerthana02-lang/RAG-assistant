import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  return (
    <div className="h-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col">

      <div className="border-b border-zinc-800 px-6 py-4 text-xl font-semibold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        <MessageBubble
          isUser={true}
          message="What is Deep Learning?"
        />

        <MessageBubble
          isUser={false}
          message="Deep learning is a subset of machine learning that uses neural networks with multiple layers...Deep learning is a subset of machine learning that uses neural networks with multiple layers...Deep learning is a subset of machine learning that uses neural networks with multiple layers...Deep learning is a subset of machine learning that uses neural networks with multiple layers...Deep learning is a subset of machine learning that uses neural networks with multiple layers... "
        />

      </div>

      <ChatInput />

    </div>
  );
}