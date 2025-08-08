"use client";
import { useState, useRef, useEffect } from "react";
import FourYearPlan from "./FourYearPlan";
import ChatMessages from "../components/ChatMessages";
import ChatInput from "../components/ChatInput";
import SuggestedQuestions from "../components/SuggestedQuestions";
import Vapi from "@vapi-ai/web";
import { FiMic } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { XMarkIcon } from "@heroicons/react/24/solid"; // Make sure this is at the top
import { emitGeneratedPlan } from "./FourYearPlan";
// import Vapi from "@vapi-ai/web"; // ❌ Vapi temporarily disabled

const STORAGE_KEY = "uwmadison_chat_history";

const SUGGESTED_QUESTIONS = [
  "What are some interesting computer science courses?",
  "What career paths fit someone who loves biology?",
  "I want a major with high pay and good job outlook. What courses should I take?",
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
  }, []); // ✅ <-- Add this

  //   const vapi = new Vapi({
  //     apiKey: "VAPI_API_KEY",
  //     assistant: "VAPI_ASSISTANT_ID",
  //   });

  //   console.log("✅ Vapi initialized:", vapi);

  //   vapiRef.current = vapi;

  //   vapi.on("transcript", (transcript) => {
  //     const spoken = transcript.text;
  //     setInput(spoken);
  //     sendMessage(spoken);
  //   });

  //   return () => {
  //     vapi.stop();
  //   };
  //
  // }, []);

  const clearChat = () => {
    const greeting =
      GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
    setMessages([{ role: "assistant", content: greeting }]);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, hydrated]);
  useEffect(() => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);
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

      if (data.updatePlan && data.generatedPlan) {
        emitGeneratedPlan(data.generatedPlan);
      }
      const reply = data.text || "Sorry, I couldn’t find any courses!";
      setMessages([...newMsgs, { role: "assistant", content: reply }]);

      try {
        vapiRef.current?.tts(reply);
      } catch (speechError) {
        console.warn("Vapi TTS error (ignored):", speechError);
      }
    } catch (error) {
      console.error("API Error:", error);

      // vapiRef.current?.tts(reply); // ❌ Vapi voice response disabled

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
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div
        className="bg-[#1a1a2e] shadow rounded-xl p-10 flex flex-col items-center border border-grey-200 h-full overflow-hidden"
        style={{
          width: 600,
          minWidth: 800,
          maxWidth: 600,
        }}
      >
        <div className="relative w-full mb-4">
          <button
            onClick={clearChat}
            className="absolute left-0 top-1 group bg-[#a48fff] text-[#0f0f1a] rounded-full p-1 cursor-pointer"
            aria-label="Clear chat"
          >
            <XMarkIcon className="w-5 h-5 font-bold" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
              Clear chat
            </div>
          </button>

          <h2 className="text-3xl font-bold mb-4 text-center text-white">
            SiftAI Chatbot
          </h2>
        </div>
        <div
          className="w-full flex flex-col gap-2 mb-6 max-h-[600px] overflow-y-auto hide-scrollbar"
          style={{ minHeight: "400px" }}
          ref={messagesEndRef}
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
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-0.25 py-0 bg-[#303060] text-white rounded-md font-medium hover:bg-violet-500 transition-colors duration-200"
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
          {loading && (
            <div className="rounded-lg px-4 py-2 text-base whitespace-pre-line bg-[#222244] text-gray-300 self-start">
              Sifting
              <LoadingDots />
            </div>
          )}
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
          <span className="font-semibold bg-[#303060] text-gray-400 px-1 rounded">
            Enter
          </span>{" "}
          to send your message.
          <br />
          {/*Voice input is now available!*/}
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
      <div
        className="ml-8 h-screen overflow-y-auto pr-2"
        style={{ minWidth: "950px" }}
      >
        <FourYearPlan />
      </div>
    </main>
  );
}
// different animation: glowing dots
// function LoadingDots() {
//   return (
//     <span className="inline-flex gap-2 ml-2 items-center align-middle">
//       <span className="w-2 h-2 bg-blue-600 rounded-full animate-[ping_1s_ease-in-out_infinite]"></span>
//       <span className="w-2 h-2 bg-blue-600 rounded-full animate-[ping_1s_ease-in-out_infinite] [animation-delay:200ms]"></span>
//       <span className="w-2 h-2 bg-blue-600 rounded-full animate-[ping_1s_ease-in-out_infinite] [animation-delay:400ms]"></span>
//     </span>
//   );
// }
function LoadingDots() {
  return (
    <span className="inline-flex gap-1 ml-2">
      <span className="w-2 h-2 bg-[#a48fff] rounded-full animate-bounce [animation-delay:0ms]"></span>
      <span className="w-2 h-2 bg-[#a48fff] rounded-full animate-bounce [animation-delay:150ms]"></span>
      <span className="w-2 h-2 bg-[#a48fff] rounded-full animate-bounce [animation-delay:300ms]"></span>
    </span>
  );
}
