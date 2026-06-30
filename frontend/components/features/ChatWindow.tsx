"use client";

import { useState } from "react";
import GlassCard from "../ui/GlassCard";
import { sendMessage } from "../../lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendMessage(input);
      const aiMessage: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: could not reach the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <GlassCard className="h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto text-white space-y-3">
        <h2 className="text-lg font-semibold">Active Session</h2>
        <p className="text-sm opacity-60">Neuro-OS Kernel Ready.</p>

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg ${
              msg.role === "user" ? "bg-indigo-600/30 ml-auto max-w-[80%]" : "bg-white/10 max-w-[80%]"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && <p className="text-sm opacity-50">Thinking...</p>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="w-full bg-white/10 border border-white/20 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Input command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 px-4 rounded-lg text-white hover:bg-indigo-700"
        >
          Send
        </button>
      </div>
    </GlassCard>
  );
}