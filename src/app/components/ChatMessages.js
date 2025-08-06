import React from "react";
import ReactMarkdown from "react-markdown";

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
  );
}
