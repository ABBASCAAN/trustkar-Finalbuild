"use client";

import { useCallback, useMemo } from "react";

function getStorageKey(userId) {
  return `tk_chat_read_${userId}`;
}

function getReadMap(userId) {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setReadMap(userId, map) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

export function useChatRead(userId) {
  const markRead = useCallback(
    (chatId) => {
      if (!userId || !chatId) return;
      const map = getReadMap(userId);
      map[chatId] = Math.floor(Date.now() / 1000);
      setReadMap(userId, map);
    },
    [userId]
  );

  const markAllRead = useCallback(
    (chatIds) => {
      if (!userId || !chatIds?.length) return;
      const map = getReadMap(userId);
      const now = Math.floor(Date.now() / 1000);
      for (const id of chatIds) {
        map[id] = now;
      }
      setReadMap(userId, map);
    },
    [userId]
  );

  const isUnread = useCallback(
    (chat) => {
      if (!userId || !chat) return false;
      const lastMsgTime =
        chat.lastMessageAt?.seconds ||
        chat.updatedAt?.seconds ||
        chat.createdAt?.seconds ||
        0;
      if (!lastMsgTime) return false;
      const readTime = getReadMap(userId)[chat.id] || 0;
      return lastMsgTime > readTime && chat.lastMessageSenderId && chat.lastMessageSenderId !== userId;
    },
    [userId]
  );

  const unreadCount = useCallback(
    (chats) => {
      if (!userId || !chats?.length) return 0;
      return chats.filter((c) => isUnread(c)).length;
    },
    [userId, isUnread]
  );

  const getUnreadChats = useCallback(
    (chats) => {
      if (!userId || !chats?.length) return [];
      return chats.filter((c) => isUnread(c));
    },
    [userId, isUnread]
  );

  return useMemo(
    () => ({ markRead, markAllRead, isUnread, unreadCount, getUnreadChats }),
    [markRead, markAllRead, isUnread, unreadCount, getUnreadChats]
  );
}
