"use client";
import { useState, useRef, useEffect } from "react";
import FourYearPlan from "./FourYearPlan";
import ChatMessages from "../components/ChatMessages";
import ChatInput from "../components/ChatInput";
import SuggestedQuestions from "../components/SuggestedQuestions";
import Vapi from "@vapi-ai/web";
import { FiMic } from "react-icons/fi";
import ReactMarkdown from "react-markdown";

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
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const vapiRef = useRef(null);

  useEffect(() => {
    setHydrated(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      const greeting =
        GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
      setMessages(
        saved ? JSON.parse(saved) : [{ role: "assistant", content: greeting }]
      );
    }

    const vapi = new Vapi({
      apiKey: "VAPI_API_KEY",
      assistant: "VAPI_ASSISTANT_ID",
    });

    console.log("✅ Vapi initialized:", vapi);

    vapiRef.current = vapi;

    vapi.on("transcript", (transcript) => {
      const spoken = transcript.text;
      setInput(spoken);
      sendMessage(spoken);
    });

    return () => {
      vapi.stop();
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, hydrated]);

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  const sendMessage = async (overrideInput = null) => {
  const messageToSend = overrideInput ?? input;
  if (!messageToSend.trim()) return;

  const userMsg = { role: "user", content: messageToSend };
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
    console.log("DATAAAA", data);

    const reply = data.text || "Sorry, I couldn’t find any courses!";
    setMessages([...newMsgs, { role: "assistant", content: reply }]);

    try {
      vapiRef.current?.tts(reply);
    } catch (speechError) {
      console.warn("Vapi TTS error (ignored):", speechError);
    }
  } catch (error) {
    console.error("❌ API Error:", error);
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

  const handleChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleSuggested = (q) => {
    setInput(q);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const toggleMic = () => {
    const vapi = vapiRef.current;
    if (!isListening) {
      vapi?.start();
      setIsListening(true);
    } else {
      vapi?.stop();
      setIsListening(false);
    }
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
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-0.1 py-0 bg-blue-50 text-blue-700 rounded-md font-medium hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
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
            onClick={() => sendMessage()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
          <button
            type="button"
            onClick={toggleMic}
            className={`ml-1 ${
              isListening ? "bg-red-500" : "bg-gray-200"
            } hover:bg-gray-300 text-gray-700 rounded-full p-2 flex items-center justify-center`}
            aria-label="Toggle voice input"
          >
            <FiMic size={22} />
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-400 text-center">
          Hint: Press{" "}
          <span className="font-semibold bg-gray-200 px-1 rounded">Enter</span>{" "}
          to send your message.
          <br />
          Voice input is now available!
        </div>

        {/* Inject the widget */}
        <div
          dangerouslySetInnerHTML={{
            __html: `
        <vapi-widget
          public-key="${process.env.NEXT_PUBLIC_VAPI_API_KEY}"
          assistant-id="${process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}"
          mode="chat"
        ></vapi-widget>
      `,
          }}
        />

        <div className="mt-8 bg-gray-100 rounded-lg p-4 w-full">
          <div className="font-semibold mb-2 text-gray-700">
            Try these questions:
          </div>
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

      <div className="ml-8" style={{ minWidth: "950px" }}>
        <FourYearPlan />
      </div>
    </main>
  );
}
