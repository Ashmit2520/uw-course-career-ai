"use client";

import FourYearPlan from "./FourYearPlan";

const STORAGE_KEY = "uwmadison_chat_history";

import { useChat } from "@ai-sdk/react";
import { useState, useRef } from "react";

export default function ChatbotPage() {
  const { messages, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef(null);

  // On mount: load messages from localStorage
  useEffect(() => {
    setHydrated(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      setMessages(
        saved
          ? JSON.parse(saved)
          : [
              {
                role: "assistant",
                content:
                  "Hi! Tell me about your interests and what you want in a course.",
              },
            ]
      );
    }
  }, []);

  // Save messages to localStorage every time they change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, hydrated]);

  // Scroll to bottom after new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send user message to API
  const handleKeyDown = (e) => {
    scrollToBottom();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // For textarea auto-grow
  const handleChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setInput("");
    setLoading(true);
    await sendMessage({ text: input });
    setLoading(false);
    scrollToBottom();
  };

  // Render nothing until hydrated
  if (!hydrated) return null;

  // Layout: Chat left, FourYearPlan right (side-by-side)
  return (
    <main
      className="flex flex-row items-start justify-center min-h-screen w-full bg-black px-2 md:px-8 py-8 gap-8"
      style={{ background: "#111" }}
    >
      {/* Chatbox */}
      <div
        className="bg-white shadow rounded-xl p-10 flex flex-col items-center"
        style={{
          width: "420px",
          minWidth: "350px",
          maxWidth: "480px",
        }}
      >
        <h2 className="text-3xl font-extrabold mb-4 text-center text-black">
          Chatbot
        </h2>
        <ChatResponse messages={messages} ref={messagesEndRef} />
        <div className="w-full flex items-center gap-2">
          <InputArea
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <ChatButton onClickFunc={handleSubmit} isLoading={loading} />
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          Hint: Press{" "}
          <span className="font-semibold bg-gray-200 px-1 rounded">Enter</span>{" "}
          to send your message.
        </div>
      </div>
      {/* FourYearPlan to the right */}
      <div className="ml-8" style={{ minWidth: "950px" }}>
        <FourYearPlan />
      </div>
    </main>
  );
}

function ChatResponse({ messages, ref }) {
  return (
    <div
      className="w-full flex flex-col gap-2 mb-6 max-h-96 overflow-y-auto"
      style={{ minHeight: "260px" }}
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-2 text-base whitespace-pre-line ${
            msg.role === "assistant"
              ? "bg-gray-100 text-gray-800 self-start"
              : "bg-blue-100 text-gray-900 self-end"
          }`}
        >
          {msg.parts.map((part, i) => (
            <div key={`${msg.id}-${i}`}>{part.text}</div>
          ))}
        </div>
      ))}

      <div ref={ref} />
    </div>
  );
}
function InputArea({ value, onChange, onKeyDown, disabled }) {
  return (
    <textarea
      className="flex-1 border rounded px-3 py-2 text-black resize-none overflow-y-auto"
      value={value}
      placeholder="Type your message..."
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      rows={1}
      style={{ minHeight: "40px", maxHeight: "120px" }}
    />
  );
}
function ChatButton({ onClickFunc, isLoading }) {
  return (
    <button
      onClick={onClickFunc}
      className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white px-4 py-2 rounded font-semibold"
      disabled={isLoading}
    >
      {isLoading ? "..." : "Send"}
    </button>
  );
}
