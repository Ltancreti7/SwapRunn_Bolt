export interface Message {
  id: string;
  sender: string;
  receiver: string;
  messageText: string;
  timestamp: string;
}

let messages: Message[] = [
  {
    id: "msg-1",
    sender: "dealer-1",
    receiver: "driver-1",
    messageText: "Hey, are you available for the pickup?",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "msg-2",
    sender: "driver-1",
    receiver: "dealer-1",
    messageText: "Yes, I'm on my way now.",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: "msg-3",
    sender: "dealer-1",
    receiver: "driver-1",
    messageText: "Great! The vehicle is ready at bay 3.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const getMessages = (): Message[] => {
  return [...messages];
};

export const getMessagesForUser = (userId: string): Message[] => {
  return messages
    .filter((msg) => msg.sender === userId || msg.receiver === userId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
};

export const addMessage = (message: Omit<Message, "id">): Message => {
  const newMessage: Message = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
  messages.push(newMessage);
  return newMessage;
};

export const getConversationMessages = (
  userId: string,
  otherUserId: string,
): Message[] => {
  return messages
    .filter(
      (msg) =>
        (msg.sender === userId && msg.receiver === otherUserId) ||
        (msg.sender === otherUserId && msg.receiver === userId),
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
};

export const getConversations = (
  userId: string,
): Array<{
  otherUserId: string;
  lastMessage: Message;
  unreadCount: number;
}> => {
  const conversationMap = new Map<
    string,
    { lastMessage: Message; unreadCount: number }
  >();

  messages
    .filter((msg) => msg.sender === userId || msg.receiver === userId)
    .forEach((msg) => {
      const otherUserId = msg.sender === userId ? msg.receiver : msg.sender;
      const existing = conversationMap.get(otherUserId);

      if (
        !existing ||
        new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)
      ) {
        conversationMap.set(otherUserId, {
          lastMessage: msg,
          unreadCount: existing?.unreadCount || 0,
        });
      }
    });

  return Array.from(conversationMap.entries())
    .map(([otherUserId, data]) => ({
      otherUserId,
      ...data,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastMessage.timestamp).getTime() -
        new Date(a.lastMessage.timestamp).getTime(),
    );
};
