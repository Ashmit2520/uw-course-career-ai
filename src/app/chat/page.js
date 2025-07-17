"use client";
import { useState, useRef, useEffect } from "react";
import { FiMic } from "react-icons/fi";
import FourYearPlan from "./FourYearPlan";

// Suggested questions
const SUGGESTED_QUESTIONS = [
  "What are some interesting computer science courses?",
  "What career paths fit someone who loves biology?",
  "I want a major with high pay and good job outlook—what courses should I take?",
];

// Storage key for chat history
const CHAT_STORAGE_KEY = "chatbotMessages";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Tell me about your interests and what you want in a course.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored));
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom after new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send user message to API
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      setMessages([
        ...newMsgs,
        {
          role: "assistant",
          content: data.response || "Sorry, I couldn’t find any courses!",
        },
      ]);
    } catch {
      setMessages([
        ...newMsgs,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Allow Shift+Enter for multiline
  };

  // For textarea auto-grow
  const handleChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // Handle suggested questions click
  const handleSuggested = (q) => {
    setInput(q);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };

  return (
    <main
      className="flex flex-row items-start justify-center min-h-screen w-full bg-black px-4"
      style={{ background: "#111" }}
    >
      {/* Chat Window */}
      <div
        className="bg-white shadow rounded-xl p-12 w-full max-w-2xl flex flex-col items-center"
        style={{ minWidth: "400px" }}
      >
        <h2 className="text-3xl font-extrabold mb-4 text-center text-black">
          Course Selection and Career Advising Chatbot
        </h2>
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
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="w-full flex items-center gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 border rounded px-3 py-2 text-black resize-none overflow-y-auto"
            value={input}
            placeholder="Type your message..."
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
          <button
            type="button"
            className="ml-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-2 flex items-center justify-center"
            aria-label="Voice input coming soon"
            disabled
          >
            <FiMic size={22} />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          Hint: Press <span className="font-semibold bg-gray-200 px-1 rounded">Enter</span> to send your message.
          <br />
          Voice input coming soon
        </div>

        {/* SUGGESTED QUESTIONS SECTION */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4 w-full">
          <div className="font-semibold mb-2 text-gray-700">Try these questions:</div>
          <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggested(q)}
                className="bg-blue-100 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded transition whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Four Year Plan on the side */}
      <div className="ml-8" style={{ minWidth: "600px" }}>
        <FourYearPlan />
      </div>
    </main>
  );
}
