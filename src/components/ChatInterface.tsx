"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, RotateCcw, Search } from "lucide-react";
import ChatMessageComponent from "./ChatMessage";
import SearchPanel from "./SearchPanel";
import { apiUrl } from "@/lib/api";
import type { ChatMessage, DocumentResult } from "@/lib/types";

interface StreamPacket {
  type?: string;
  answer?: string;
  top_documents?: DocumentResult[];
  citation_info?: Array<{ citation_num: number; document_id: string }>;
  message_id?: number;
  chat_session_id?: string;
  error_msg?: string;
  user_message_id?: number;
  reserved_assistant_message_id?: number;
  placement?: { turn_index: number; tab_index: number };
  obj?: {
    type?: string;
    content?: string;
    final_documents?: DocumentResult[] | null;
    stop_reason?: string | null;
  };
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          chat_session_id: chatSessionId,
          persona_id: selectedAgent,
          parent_message_id: lastMessageId,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentAnswer = "";
      let documents: DocumentResult[] = [];
      let citationInfo: Array<{ citation_num: number; document_id: string }> = [];
      let messageId: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event.replace(/^data: /, "").trim();
          if (!line || line === "[DONE]") continue;

          try {
            const packet: StreamPacket = JSON.parse(line);

            // Session ID from our proxy layer
            if (packet.type === "session" && packet.chat_session_id) {
              setChatSessionId(packet.chat_session_id);
            }

            // Onyx stream: message_delta contains incremental content chunks
            if (packet.obj?.type === "message_delta" && packet.obj.content) {
              currentAnswer += packet.obj.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: currentAnswer }
                    : msg
                )
              );
            }

            // Onyx stream: message_start may contain documents
            if (packet.obj?.type === "message_start" && packet.obj.final_documents) {
              documents = packet.obj.final_documents;
            }

            // Non-streaming fallback: answer field directly
            if (packet.answer !== undefined) {
              currentAnswer = packet.answer;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: currentAnswer }
                    : msg
                )
              );
            }

            if (packet.top_documents && packet.top_documents.length > 0) {
              documents = packet.top_documents;
            }

            if (packet.citation_info && packet.citation_info.length > 0) {
              citationInfo = packet.citation_info;
            }

            if (packet.message_id) {
              messageId = packet.message_id;
            }

            if (packet.reserved_assistant_message_id) {
              messageId = packet.reserved_assistant_message_id;
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }

      if (messageId) {
        setLastMessageId(messageId);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: currentAnswer || "No se recibió respuesta.",
                documents,
                citations: citationInfo.map((c) => ({
                  citation_num: c.citation_num,
                  document_id: c.document_id,
                  link: documents.find(
                    (d) => d.document_id === c.document_id
                  )?.link,
                  title: documents.find(
                    (d) => d.document_id === c.document_id
                  )?.semantic_identifier,
                })),
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Error desconocido";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: `Error: ${errMsg}. Verifica la conexión con Onyx.`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setChatSessionId(null);
    setLastMessageId(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                Agente AI - Onyx
              </h1>
              <p className="text-xs text-gray-500">
                Conectado a tu base de conocimiento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Seleccionar Agente"
            >
              <option value={0}>Agente por defecto</option>
            </select>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showSearch
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              title="Buscar documentos"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={handleNewChat}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Nueva conversación"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-2xl">O</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Bienvenido al Agente AI
              </h2>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                Estoy conectado a tu instancia de Onyx con más de 30,000
                documentos indexados. Pregúntame lo que necesites.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {[
                  "¿Cuáles son los documentos más recientes?",
                  "Resume la información sobre...",
                  "Busca documentos relacionados con...",
                  "¿Qué información tenemos sobre...?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-left text-xs p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Las respuestas se generan usando la información de tu base de
            conocimiento en Onyx.
          </p>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <SearchPanel onClose={() => setShowSearch(false)} />
      )}
    </div>
  );
}
