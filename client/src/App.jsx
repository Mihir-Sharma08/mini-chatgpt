import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { streamChat } from "./services/chatApi";

const createId = () => crypto.randomUUID();

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation ? activeConversation.messages : [];

  const updateConversation = (conversationId, updater) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? updater(c) : c)));
  };

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

  const handleSend = async (text) => {
    const userMessage = { id: createId(), role: "user", content: text };
    let conversationId = activeId;
    let history;

    if (!conversationId) {
      conversationId = createId();
      const title = text.length > 30 ? `${text.slice(0, 30)}...` : text;
      history = [userMessage];
      setConversations((prev) => [{ id: conversationId, title, messages: history }, ...prev]);
      setActiveId(conversationId);
    } else {
      const existing = conversations.find((c) => c.id === conversationId);
      history = [...existing.messages, userMessage];
      updateConversation(conversationId, (c) => ({ ...c, messages: history }));
    }

    setIsLoading(true);

    const assistantId = createId();
    let started = false;

    // Send only what the model needs: role + content, and never our own error bubbles.
    const apiMessages = history
      .filter((m) => !m.isError)
      .map(({ role, content }) => ({ role, content }));

    try {
      await streamChat({
        messages: apiMessages,
        onToken: (token) => {
          if (!started) {
            started = true;
            updateConversation(conversationId, (c) => ({
              ...c,
              messages: [...c.messages, { id: assistantId, role: "assistant", content: token }],
            }));
          } else {
            updateConversation(conversationId, (c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + token } : m,
              ),
            }));
          }
        },
      });
    } catch (error) {
      updateConversation(conversationId, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          { id: createId(), role: "assistant", content: error.message, isError: true },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
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