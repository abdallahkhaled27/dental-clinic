"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "error";

// Shared by the "add" and "edit" knowledge base admin pages — same two
// fields either way, only the HTTP method/URL and starting values differ.
// Saving always re-embeds on the server (see knowledge-db.ts), so this can
// take noticeably longer than the other admin forms — the button reflects
// that with "Saving..." rather than implying it's instant.
export default function KnowledgeForm({
  chunkId,
  defaultTopic = "",
  defaultContent = "",
}: {
  chunkId?: string;
  defaultTopic?: string;
  defaultContent?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = Boolean(chunkId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      topic: formData.get("topic") as string,
      content: formData.get("content") as string,
    };

    try {
      const response = await fetch(
        isEditing ? `/api/admin/knowledge/${chunkId}` : "/api/admin/knowledge",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Please try again.");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="topic" className={labelClass}>
          Topic
        </label>
        <input
          id="topic"
          name="topic"
          type="text"
          required
          disabled={isSubmitting}
          defaultValue={defaultTopic}
          placeholder="Insurance"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="content" className={labelClass}>
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          required
          disabled={isSubmitting}
          defaultValue={defaultContent}
          placeholder="What the chatbot should say when asked about this topic..."
          className={fieldClass}
        />
      </div>

      {status === "error" && <ErrorBanner message={errorMessage} />}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add entry"}
      </button>
    </form>
  );
}
