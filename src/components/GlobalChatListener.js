"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeUserChats } from "@/lib/firestore-helpers";
import { playNotificationSound } from "@/lib/sound";

export default function GlobalChatListener() {
  const { user } = useAuth();
  const lastStateRef = useRef(new Map());

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserChats(user.uid, (chats) => {
      const lastState = lastStateRef.current;
      for (const c of chats) {
        const t =
          c.lastMessageAt?.seconds ||
          c.updatedAt?.seconds ||
          c.createdAt?.seconds ||
          0;
        const prev = lastState.get(c.id) || 0;
        // Only sound if we already knew a previous timestamp and it moved forward.
        if (prev > 0 && t > prev && c.lastMessageSenderId && c.lastMessageSenderId !== user.uid) {
          playNotificationSound();
        }
        lastState.set(c.id, t);
      }

      // Clean up removed chats
      const currentIds = new Set(chats.map((c) => c.id));
      for (const id of lastState.keys()) {
        if (!currentIds.has(id)) lastState.delete(id);
      }
    });
    return () => unsub();
  }, [user]);

  return null;
}
