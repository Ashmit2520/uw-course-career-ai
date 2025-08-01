import React from "react";
import { FiMic } from "react-icons/fi";

export default function ChatInput({ input, setInput, loading, textareaRef, sendMessage, handleKeyDown }) {
  const handleChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
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
  );
}
