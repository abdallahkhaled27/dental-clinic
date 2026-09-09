"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);
    setIsSlow(false);

    // The AI can take unusually long occasionally (e.g. OpenAI rate-limit
    // retries under heavy use) — after a while, say so instead of leaving
    // the "…" placeholder with no explanation.
    const slowTimer = setTimeout(() => setIsSlow(true), 8000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Chat request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        clearTimeout(slowTimer);
        setIsSlow(false);

        setMessages((current) => {
          const updated = [...current];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages((current) => {
        const updated = [...current];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      clearTimeout(slowTimer);
      setIsStreaming(false);
      setIsSlow(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-20 flex h-[28rem] w-80 flex-col rounded-lg border border-black/10 bg-background shadow-xl dark:border-white/10">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
            <span className="font-medium">Chat with us</span>
            <button
              onClick={() => setIsOpen(false)}
              className="opacity-70 hover:opacity-100"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <p className="opacity-70">
                Ask me anything about our services, hours, or location.
              </p>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === "user" ? "text-right" : "text-left"}
              >
                <span
                  className={
                    "inline-block max-w-[85%] rounded-lg px-3 py-2 " +
                    (message.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-black/5 dark:bg-white/10")
                  }
                >
                  {message.content ||
                    (isStreaming && index === messages.length - 1
                      ? isSlow
                        ? "Still thinking — this is taking longer than usual…"
                        : "…"
                      : "")}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-black/10 p-3 dark:border-white/10"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </>
  );
}
