"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! Tell me about your interests and what you want in a course.",
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful course selection assistant at UW-Madison.",
            },
            ...updatedMessages.map((msg) => ({
              role: msg.from === "user" ? "user" : "assistant",
              content: msg.text,
            })),
          ],
        }),
      });

      const data = await res.json();
      setMessages((msgs) => [...msgs, { from: "bot", text: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "Something went wrong." },
      ]);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-2">
      <div className="w-full max-w-md md:max-w-lg bg-white shadow-2xl rounded-xl p-4 md:p-6 flex flex-col gap-4">
        {/* Chatbot header darker */}
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">
          Course Selection Chatbot
        </h2>
        <div className="flex-1 overflow-y-auto max-h-80 mb-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`my-2 flex ${
                msg.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs break-words
                ${
                  msg.from === "user"
                    ? "bg-blue-100 text-blue-900" // user message: lighter blue bg, dark text
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2 w-full">
          <input
            className="flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring placeholder-gray-600 text-black text-base"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ minWidth: 0 }}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl hover:bg-blue-700 transition text-sm md:text-base cursor-pointer"
          >
            Send
          </button>
          {/* Voice input button: scaled down, always same size as send */}
          <button
            type="button"
            className="bg-gray-200 text-gray-600 p-2 rounded-full cursor-not-allowed flex items-center justify-center"
            title="Voice input coming soon"
            disabled
            style={{ width: "40px", height: "40px" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 md:h-6 md:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18v4m0 0h3m-3 0H9m6-6v-5a3 3 0 10-6 0v5a3 3 0 006 0z"
              />
            </svg>
          </button>
        </form>
        {/* Enter-to-send hint */}
        <span className="text-xs text-gray-400 text-center mt-1">
          Hint: Press{" "}
          <span className="font-mono px-1 bg-gray-200 rounded">Enter</span> to
          send your message.
        </span>
        <span className="text-xs text-gray-400 text-center">
          Voice input coming soon
        </span>
      </div>
    </main>
  );
}
