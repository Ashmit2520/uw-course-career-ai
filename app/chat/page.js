"use client";
import { useState, useRef, useEffect } from "react";
import FourYearPlan from "./FourYearPlan";
import ChatMessages from "../components/ChatMessages";
import ChatInput from "../components/ChatInput";
import SuggestedQuestions from "../components/SuggestedQuestions";

const STORAGE_KEY = "uwmadison_chat_history";
const SUGGESTED_QUESTIONS = [
  "What are some interesting computer science courses?",
  "What career paths fit someone who loves biology?",
  "I want a major with high pay and good job outlook—what courses should I take?",
];
const GREETING_MESSAGES = [
  "Hi there! What can I help you plan today?",
  "Hello! Ready to design your academic future?",
  "Hey! What academic plan can I help create?",
  "Welcome! Need help picking courses or a major?",
  "Hi! Let’s get started with your academic planning.",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setHydrated(true);
    const greeting =
      GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
    setMessages([{ role: "assistant", content: greeting }]);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, hydrated]);

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

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
          content: data.text || "Sorry, I couldn’t find any courses!",
        },
      ]);
    } catch (err) {
      console.error("Fetch error:", err);
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
  };

  const handleSuggested = (q) => {
    setInput(q);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  if (!hydrated) return null;

  return (
    <main
      className="flex flex-row items-start justify-center min-h-screen w-full bg-black px-2 md:px-8 py-8 gap-8"
      style={{ background: "#111" }}
    >
      <div
        className="bg-white shadow rounded-xl p-10 flex flex-col items-center"
        style={{
          width: "600",
          minWidth: "800px",
          maxWidth: "600",
        }}
      >
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <ChatInput
          input={input}
          setInput={setInput}
          loading={loading}
          textareaRef={textareaRef}
          sendMessage={sendMessage}
          handleKeyDown={handleKeyDown}
        />
        <div className="mt-2 text-xs text-gray-400 text-center">
          Hint: Press{" "}
          <span className="font-semibold bg-gray-200 px-1 rounded">Enter</span>{" "}
          to send your message.
          <br />
          Voice input coming soon
        </div>
        <SuggestedQuestions
          suggestions={SUGGESTED_QUESTIONS}
          onSelect={handleSuggested}
        />
      </div>
      <div className="ml-8" style={{ minWidth: "950px" }}>
        <FourYearPlan />
      </div>
    </main>
  );
}
