export default function TypingIndicator() {
  return (
    <div className="mr-auto flex w-fit items-center gap-2 rounded-2xl bg-zinc-700 px-4 py-4">

      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-zinc-300 [animation-delay:0ms]" />

      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-zinc-300 [animation-delay:150ms]" />

      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-zinc-300 [animation-delay:300ms]" />

    </div>
  );
}