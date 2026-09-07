type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: number;
  title: string;
  documentId: string | null;
  messages: Message[];
};

// The single source of truth for "the" draft chat -- an unsent
// conversation, whether or not a source has been picked for it yet.
// There is ever at most one: a blank chat screen should never exist
// without a matching, visible entry in the sidebar list, and picking a
// source (or clicking "New Chat") should update that one draft in
// place rather than spawning a duplicate. It only "locks in" as a
// permanent, separate history entry once a message actually gets sent.
export function findOrCreateDraftChat(conversations: Conversation[]): {
  conversation: Conversation;
  conversations: Conversation[];
} {
  const existing = conversations.find((c) => c.messages.length === 0);

  if (existing) {
    return { conversation: existing, conversations };
  }

  const fresh: Conversation = {
    id: Date.now(),
    title: "New Chat",
    documentId: null,
    messages: [],
  };

  return { conversation: fresh, conversations: [fresh, ...conversations] };
}
