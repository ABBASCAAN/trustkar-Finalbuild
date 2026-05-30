"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeUserChats, deleteChat } from "@/lib/firestore-helpers";
import { useChatRead } from "@/hooks/useChatRead";
import { formatPrice, formatTimeAgo } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import {
  Loader2,
  MessageCircle,
  ShoppingBag,
  Store,
  ArrowRight,
  Trash2,
  User,
  Inbox,
  Archive,
  CheckCheck,
} from "lucide-react";

export default function ChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { isUnread, markRead, markAllRead, unreadCount } = useChatRead(user?.uid);

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "sellers" | "buyers" | "archived"

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login?redirect=/chats");
      return;
    }
    setLoading(true);
    const unsub = subscribeUserChats(user.uid, (list) => {
      setChats(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user, authLoading, router]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  const asBuyer = chats.filter((c) => c.buyerId === user?.uid);
  const asSeller = chats.filter((c) => c.sellerId === user?.uid);
  const activeAsBuyer = asBuyer.filter((c) => c.status !== "closed");
  const activeAsSeller = asSeller.filter((c) => c.status !== "closed");
  const archived = chats.filter((c) => c.status === "closed");

  const allActive = chats.filter((c) => c.status !== "closed");

  const currentList =
    activeTab === "all"
      ? allActive
      : activeTab === "sellers"
      ? activeAsBuyer
      : activeTab === "buyers"
      ? activeAsSeller
      : archived;

  const tabs = [
    {
      key: "all",
      label: "All Chats",
      icon: Inbox,
      list: allActive,
    },
    {
      key: "sellers",
      label: "Sellers",
      icon: Store,
      list: activeAsBuyer,
    },
    {
      key: "buyers",
      label: "Buyers",
      icon: ShoppingBag,
      list: activeAsSeller,
    },
    {
      key: "archived",
      label: "Archived",
      icon: Archive,
      list: archived,
    },
  ];

  const totalUnread = unreadCount(allActive);
  const anyUnread = totalUnread > 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Fixed top bar — TrustKar brand */}
      <div className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-center py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-700 text-xs font-black text-white shadow-sm">TK</span>
            <span className="text-lg font-black tracking-tight text-slate-900">TrustKar</span>
          </div>
        </div>
      </div>

      {/* Fixed sub-header — Chats title + tabs */}
      <div className="sticky top-[52px] z-40 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm">
        <div className="px-4 py-3 sm:px-6">
          <h1 className="text-xl font-black text-slate-900">Chats</h1>
          <p className="text-xs font-medium text-slate-400">Manage your conversations</p>
        </div>

        {/* Compact icon tab bar — fixed, single row */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 pb-2 pt-2 sm:px-6">
          <div className="flex items-center gap-1.5">
            {tabs.map((t) => {
              const count = t.list.length;
              const unread = unreadCount(t.list);
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition sm:flex-row sm:gap-1.5 sm:px-2 sm:text-xs ${
                    active
                      ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md shadow-sky-500/20"
                      : "text-slate-500 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <Icon size={16} />
                  <span>{t.label.split(" ")[0]}</span>
                  {count > 0 && (
                    <span className={`ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-black sm:ml-1 ${active ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {count}
                    </span>
                  )}
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mark all read */}
        {anyUnread && (
          <div className="flex justify-end border-t border-slate-100 bg-white px-4 py-1.5 sm:px-6">
            <button type="button" onClick={() => { markAllRead(allActive.map((c) => c.id)); showToast("All chats marked as read", "success"); }}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 transition hover:bg-sky-100">
              <CheckCheck size={11} /> Mark all as read
            </button>
          </div>
        )}
      </div>

      {/* Scrollable chat list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center sm:py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
              <Inbox size={24} className="text-slate-300" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">No chats yet</h3>
            <p className="mt-1 max-w-xs px-4 text-sm text-slate-500">
              {activeTab === "all"
                ? "You have no active conversations yet. Browse listings or post ads to start chatting."
                : activeTab === "sellers"
                ? "You haven't started any chats with sellers yet. Browse listings and contact a seller."
                : activeTab === "buyers"
                ? "No buyers have contacted you yet. Post ads to start receiving messages."
                : "No archived conversations. Closed chats will appear here."}
            </p>
            {activeTab !== "archived" && (
              <Link href={activeTab === "buyers" ? "/post-ad" : "/browse"} className="tk-btn-primary mt-4 !px-4 !py-2 text-xs">
                {activeTab === "buyers" ? "Post an ad" : "Browse listings"}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {currentList.map((c) => {
              const isMeBuyer = c.buyerId === user?.uid;
              const otherName = isMeBuyer ? c.sellerName : c.buyerName;
              const timeAgo = c.lastMessageAt?.seconds ? formatTimeAgo(c.lastMessageAt.seconds) : "";
              const chatUnread = isUnread(c);
              return (
                <div key={c.id} className={`group relative flex items-center gap-3 rounded-2xl border bg-white p-3 transition hover:shadow-md sm:gap-4 sm:p-4 ${chatUnread ? "border-sky-300 ring-1 ring-sky-100" : "border-slate-200 hover:border-sky-200"}`}>
                  {chatUnread && <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}

                  <Link href={`/chat/${c.id}`} onClick={() => markRead(c.id)} className="relative h-13 w-13 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-16 sm:w-16">
                    {c.adImage ? (
                      <Image src={c.adImage} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Store size={18} className="text-slate-300" /></div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/chat/${c.id}`} onClick={() => markRead(c.id)} className="block">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900 sm:text-base">{c.adTitle || "Chat"}</p>
                        {chatUnread && <span className="inline-flex shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">New</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                        <span className="flex items-center gap-1"><User size={12} className="text-slate-400" /><span className="truncate">{otherName || "User"}</span></span>
                        {timeAgo && <span className="hidden text-slate-400 sm:inline">· {timeAgo}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-cyan-700 sm:text-sm">{formatPrice(c.adPrice)}</span>
                        {c.agreedPrice && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:text-xs">Agreed {formatPrice(c.agreedPrice)}</span>}
                        {c.status === "offer_accepted" && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 sm:text-xs">Offer accepted</span>}
                        {c.status === "closed" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 sm:text-xs">Closed</span>}
                      </div>
                    </Link>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                    <Link href={`/chat/${c.id}`} onClick={() => markRead(c.id)} className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 transition hover:bg-sky-100 sm:h-10 sm:w-10" title="Open chat">
                      <ArrowRight size={16} />
                    </Link>
                    <button type="button" onClick={async () => { if (!confirm("Delete this chat? This cannot be undone.")) return; try { await deleteChat(c.id); setChats((prev) => prev.filter((x) => x.id !== c.id)); showToast("Chat deleted", "success"); } catch { showToast("Could not delete chat", "error"); } }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500 sm:h-10 sm:w-10" title="Delete chat">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
