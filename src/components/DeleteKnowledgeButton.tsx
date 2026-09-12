"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteKnowledgeButton({
  chunkId,
  topic,
}: {
  chunkId: string;
  topic: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete the "${topic}" knowledge base entry? The chatbot won't be able to answer from it anymore. This can't be undone.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/knowledge/${chunkId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Something went wrong. Please try again.");
        setIsDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      alert("Couldn't reach the server. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-sm text-danger transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </button>
  );
}
