import React from "react";

export default function SuggestedQuestions({ onSelect, suggestions }) {
  return (
    <div className="mt-8 bg-gray-100 rounded-lg p-4 w-full">
      <div className="font-semibold mb-2 text-gray-700">Try these questions:</div>
      <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="bg-blue-100 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded transition whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}