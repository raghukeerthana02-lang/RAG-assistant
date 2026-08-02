type Props = {
  message: string;
  isUser: boolean;
};

export default function MessageBubble({
  message,
  isUser,
}: Props) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-fit max-w-2xl rounded-xl px-4 py-3 shadow-md shadow-black/20 whitespace-pre-wrap break-words ${
          isUser
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
            : "bg-gradient-to-br from-zinc-700 to-zinc-800"
        }`}
      >
        {message}
      </div>
    </div>
  );
}