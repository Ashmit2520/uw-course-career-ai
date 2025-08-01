import React from "react";

export default function ChatMessages({ messages, messagesEndRef }) {
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
          {msg.content}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}