import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

const createId = () => crypto.randomUUID();

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation ? activeConversation.messages : [];

  const handleNewChat = () => {
    setActiveId(null);
    setIsSidebarOpen(false);
  };

  const handleSelect = (id) => {
    setActiveId(id);
    setIsSidebarOpen(false);
  };

  const handleDelete = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
  };

  const handleSend = (text) => {
    const userMessage = { id: createId(), role: "user", content: text };
    let conversationId = activeId;

    if (!conversationId) {
      conversationId = createId();
      const title = text.length > 30 ? `${text.slice(0, 30)}...` : text;
      const newConversation = { id: conversationId, title, messages: [userMessage] };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveId(conversationId);
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, messages: [...c.messages, userMessage] } : c,
        ),
      );
    }

    setIsLoading(true);

    // TEMPORARY: fake AI reply. Replaced by a real API call in Phase 4.
    setTimeout(() => {
      const reply = {
        id: createId(),
        role: "assistant",
        content: `This is a fake reply to: "${text}"\n\nThe real AI arrives in Phase 4.`,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, messages: [...c.messages, reply] } : c,
        ),
      );
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-900 text-zinc-100">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ChatWindow
        title={activeConversation ? activeConversation.title : "New chat"}
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  );
}