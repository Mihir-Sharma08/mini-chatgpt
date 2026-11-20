import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { sendMessage, regenerateReply } from "../services/chatApi";
import * as api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const createId = () => crypto.randomUUID();

// Removes trailing error bubbles, then one more message if it has the given role.
function trimTrailing(messages, roleToDrop) {
  const copy = [...messages];
  while (copy.length > 0 && copy[copy.length - 1].isError) copy.pop();
  if (copy.length > 0 && copy[copy.length - 1].role === roleToDrop) copy.pop();
  return copy;
}

export default function ChatPage() {
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadCounter = useRef(0);
  const abortRef = useRef(null);

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

  // Shared by "send" and "regenerate": runs one streamed generation.
  //  - start({ signal, onMeta, onToken }) performs the actual request
  //  - retryIfNoTokens describes how "Try again" should work if the failure
  //    happens before any text arrived
  const runGeneration = async ({ conversationId, retryIfNoTokens, start }) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const isNewConversation = conversationId === null;
    const assistantId = createId();
    let started = false;

    setIsLoading(true);

    try {
      await start({
        signal: controller.signal,
        onMeta: ({ conversationId: newId, title }) => {
          if (isNewConversation) {
            setActiveId(newId);
            setConversations((prev) => [
              { id: newId, title, updatedAt: new Date().toISOString() },
              ...prev,
            ]);
          }
        },
        onToken: (token) => {
          if (!started) {
            started = true;
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: "assistant", content: token },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + token } : m,
              ),
            );
          }
        },
      });

      if (!isNewConversation) moveToTop(conversationId);
    } catch (error) {
      if (error.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content: error.message,
            isError: true,
            retry: started ? { type: "regenerate" } : retryIfNoTokens,
          },
        ]);
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSend = (text) => {
    setNotice(null);
    setMessages((prev) => [
      ...prev,
      { id: createId(), role: "user", content: text },
    ]);

    return runGeneration({
      conversationId: activeId,
      retryIfNoTokens: { type: "resend", text },
      start: (handlers) =>
        sendMessage({
          conversationId: activeId ?? undefined,
          message: text,
          ...handlers,
        }),
    });
  };

  const handleRegenerate = () => {
    if (!activeId) return;

    setNotice(null);
    setMessages((prev) => trimTrailing(prev, "assistant"));

    return runGeneration({
      conversationId: activeId,
      retryIfNoTokens: { type: "regenerate" },
      start: (handlers) =>
        regenerateReply({ conversationId: activeId, ...handlers }),
    });
  };

  const handleRetry = (retry) => {
    if (retry.type === "resend") {
      // Nothing was saved on the server, so remove the failed attempt and send again.
      setMessages((prev) => trimTrailing(prev, "user"));
      return handleSend(retry.text);
    }
    return handleRegenerate();
  };

  const handleStop = () => {
    abortRef.current?.abort();
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
         user={user}
        onLogout={logout}
      />
      <ChatWindow
        title={activeConversation ? activeConversation.title : "New chat"}
        messages={messages}
        isLoading={isLoading}
        isHistoryLoading={isHistoryLoading}
        notice={notice}
        onDismissNotice={() => setNotice(null)}
        onSend={handleSend}
        onStop={handleStop}
        onRegenerate={handleRegenerate}
        onRetry={handleRetry}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  );
}
