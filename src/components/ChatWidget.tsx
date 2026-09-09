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
        <div className="fixed bottom-24 right-6 z-20 flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl border-b border-border bg-primary px-4 py-3.5 text-primary-foreground">
            <span className="font-medium">Chat with us</span>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 opacity-90 hover:bg-white/15 hover:opacity-100"
              aria-label="Close chat"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <p className="text-muted-foreground">
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
                    "inline-block max-w-[85%] rounded-2xl px-3.5 py-2 text-left " +
                    (message.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-foreground/5 text-foreground")
                  }
                >
                  {message.content ? (
                    message.content
                  ) : isStreaming && index === messages.length - 1 ? (
                    isSlow ? (
                      "Still thinking — this is taking longer than usual…"
                    ) : (
                      <TypingDots />
                    )
                  ) : (
                    ""
                  )}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M3.4 2.5a.75.75 0 01.8-.14l13.5 6.25a.75.75 0 010 1.36L4.2 16.22a.75.75 0 01-1.06-.83l1.36-5.44H10a.75.75 0 000-1.5H4.5l-1.36-5.44a.75.75 0 01.26-.51z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary-hover"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-4.5-7.79L21 3l-1.09 4.5A8.96 8.96 0 0121 12z"
            />
          </svg>
        )}
      </button>
    </>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5" aria-label="Assistant is typing">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}
