type Props = {
  message: string;
  isUser: boolean;
};

export default function MessageBubble({
  message,
  isUser,
}: Props) {
  return (
    <div
      className={`max-w-2xl rounded-xl px-4 py-3 shadow-md shadow-black/20 ${
        isUser
          ? "ml-auto bg-gradient-to-br from-blue-600 to-blue-700 text-white"
          : "mr-auto bg-gradient-to-br from-zinc-700 to-zinc-800"
      }`}
    >
      {message}
    </div>
  );
}