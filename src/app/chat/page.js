"use client";
import { useState, useRef, useEffect } from "react";
import { FiMic } from "react-icons/fi";
import FourYearPlan from "./FourYearPlan";
// import Vapi from "@vapi-ai/web"; // ❌ Vapi temporarily disabled

const STORAGE_KEY = "uwmadison_chat_history";

const SUGGESTED_QUESTIONS = [
  "What are some interesting computer science courses?",
  "What career paths fit someone who loves biology?",
  "I want a major with high pay and good job outlook. What courses should I take?",
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
                  "Hi! Tell me about your interests and what you want in a course. We can also talk about your career if you like",
              },
            ]
      );
    }

    /*
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
    */
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
      const reply = data.response || "Sorry, I couldn’t find any courses!";
      setMessages([...newMsgs, { role: "assistant", content: reply }]);

      // vapiRef.current?.tts(reply); // ❌ Vapi voice response disabled
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
    /*
    const vapi = vapiRef.current;
    if (!isListening) {
      vapi?.start();
      setIsListening(true);
    } else {
      vapi?.stop();
      setIsListening(false);
    }
    */
  };

  if (!hydrated) return null;

  return (
    <main
      className="flex flex-row items-start justify-center min-h-screen w-full bg-black px-2 md:px-8 py-8 gap-8"
      style={{ background: "#111" }}
    >
      {/* Chatbox */}
      <div
        className="bg-[#1a1a2e] shadow rounded-xl p-10 flex flex-col items-center border border-grey-200"
        style={{
          width: "420px",
          minWidth: "350px",
          maxWidth: "480px",
        }}
      >
        <h2 className="text-3xl font-bold mb-4 text-center text-white">
          SiftAI Chatbot
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
                  ? "bg-[#222244] text-gray-300 self-start"
                  : "bg-[#a48fff] text-[#0f0f1a] self-end"
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
            className="flex-1 border border-[#303052] rounded px-3 py-2 text-white resize-none overflow-y-auto"
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
            className="bg-[#a48fff] hover:bg-violet-500 text-[#0f0f1a] px-4 py-2 focus-visible:ring-ring rounded font-semibold"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>

          {/* Microphone button */}
          {/* <button
            type="button"
            onClick={toggleMic}
            className={`ml-1 ${
              isListening ? "bg-red-500" : "bg-[#a48fff]"
            } hover:bg-violet-500 text-gray-700 rounded-full p-2 flex items-center justify-center`}
            aria-label="Toggle voice input"
          >
            <FiMic size={22} />
          </button> */}
        </div>

        <div className="mt-2 text-xs text-gray-400 text-center">
          Hint: Press{" "}
          <span className="font-semibold bg-[#a48fff] text-black px-1 rounded">Enter</span>{" "}
          to send your message.
          <br />
          {/*Voice input is now available!*/}
        </div>

        {/* Inject the widget */}
        {/*
        <div dangerouslySetInnerHTML={{ __html: `
          <vapi-widget
            public-key="${process.env.NEXT_PUBLIC_VAPI_API_KEY}"
            assistant-id="${process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}"
            mode="chat"
          ></vapi-widget>
        ` }} />
        */}

        <div className="mt-8 bg-[#303060] rounded-lg p-4 w-full border border-grey-200">
          <div className="font-semibold mb-2 text-grey-200">
            Try these questions:
          </div>
          <div className="flex flex-row gap-2 overflow-x-auto">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggested(q)}
                className="bg-theme-primary hover:bg-blue-300 text-[#0f0f1a] px-3 py-1 rounded transition whitespace-nowrap"
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
