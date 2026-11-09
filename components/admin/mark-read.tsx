"use client";

import { useEffect } from "react";

/** Marks the applicant's replies as read once an admin opens the thread. */
export function MarkRepliesRead({ id, unread }: { id: string; unread: number }) {
  useEffect(() => {
    if (!unread) return;
    void fetch(`/api/admin/applications/${id}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markRead: true }),
    });
  }, [id, unread]);
  return null;
}
