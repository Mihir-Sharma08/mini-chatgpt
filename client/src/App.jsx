import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { streamChat } from "./services/chatApi";
import * as api from "./services/api";

const createId = () => crypto.randomUUID();

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadCounter = useRef(0);

  const activeConversation = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    let cancelled = false;

    api
      .fetchConversations()
      .then((list) => {
        if (!cancelled) setConversations(list);
      })
      .catch((error) => {
        if (!cancelled) setNotice(error.message);
      })
      .finally(() => {
        if (!cancelled) setIsListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const moveToTop = (id) => {
    setConversations((prev) => {
      const item = prev.find((c) => c.id === id);
      return item ? [item, ...prev.filter((c) => c.id !== id)] : prev;
    });
  };

  const resetToNewChat = () => {
    loadCounter.current += 1;
    setActiveId(null);
    setMessages([]);
    setIsHistoryLoading(false);
  };

  const handleNewChat = () => {
    resetToNewChat();
    setNotice(null);
    setIsSidebarOpen(false);
  };

  const handleSelect = async (id) => {
    setNotice(null);
    setIsSidebarOpen(false);
    setActiveId(id);
    setMessages([]);
    setIsHistoryLoading(true);

    loadCounter.current += 1;
    const requestNumber = loadCounter.current;

    try {
      const data = await api.fetchConversation(id);
      if (requestNumber !== loadCounter.current) return;
      setMessages(data.messages);
    } catch (error) {
      if (requestNumber !== loadCounter.current) return;
      setNotice(error.message);
    } finally {
      if (requestNumber === loadCounter.current) setIsHistoryLoading(false);
    }
  };

  const handleRename = async (id, title) => {
    try {
      const updated = await api.renameConversation(id, title);
      setConversations((prev) => [updated, ...prev.filter((c) => c.id !== id)]);
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) resetToNewChat();
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleSend = async (text) => {
    setNotice(null);

    const isNewConversation = activeId === null;
    const assistantId = createId();
    let started = false;

    setMessages((prev) => [...prev, { id: createId(), role: "user", content: text }]);
    setIsLoading(true);

    try {
      await streamChat({
        conversationId: activeId ?? undefined,
        message: text,
        onMeta: ({ conversationId, title }) => {
          if (isNewConversation) {
            setActiveId(conversationId);
            setConversations((prev) => [
              { id: conversationId, title, updatedAt: new Date().toISOString() },
              ...prev,
            ]);
          }
        },
        onToken: (token) => {
          if (!started) {
            started = true;
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: token }]);
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m)),
            );
          }
        },
      });

      if (!isNewConversation) moveToTop(activeId);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "assistant", content: error.message, isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-900 text-zinc-100">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isListLoading={isListLoading}
        isBusy={isLoading}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onRename={handleRename}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ChatWindow
        title={activeConversation ? activeConversation.title : "New chat"}
        messages={messages}
        isLoading={isLoading}
        isHistoryLoading={isHistoryLoading}
        notice={notice}
        onDismissNotice={() => setNotice(null)}
        onSend={handleSend}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  );
}