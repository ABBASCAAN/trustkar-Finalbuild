"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchUserChats, deleteChat } from "@/lib/firestore-helpers";
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
} from "lucide-react";

export default function ChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "sellers" | "buyers" | "archived"

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login?redirect=/chats");
      return;
    }
    loadChats();
  }, [user, authLoading]);

  async function loadChats() {
    setLoading(true);
    try {
      const list = await fetchUserChats(user.uid);
      setChats(list);
    } catch (e) {
      console.error(e);
      showToast("Could not load chats", "error");
    } finally {
      setLoading(false);
    }
  }

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

  const currentList =
    activeTab === "all"
      ? chats.filter((c) => c.status !== "closed")
      : activeTab === "sellers"
      ? activeAsBuyer
      : activeTab === "buyers"
      ? activeAsSeller
      : archived;
  const otherLabel =
    activeTab === "sellers"
      ? "Seller"
      : activeTab === "buyers"
      ? "Buyer"
      : activeTab === "archived"
      ? "Archived"
      : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/90 to-[var(--tk-bg)] pb-24">
      {/* Header */}
      <div className="border-b border-sky-200/80 bg-white/90 backdrop-blur-sm">
        <div className="tk-container py-5 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-sm">
              <MessageCircle size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">Messages</h1>
              <p className="text-xs font-medium text-slate-500">
                Manage your conversations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="tk-container py-6 sm:py-8">
        {/* Four-option selector */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {/* All Chats */}
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
              activeTab === "all"
                ? "border-sky-300 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-[0_8px_32px_-8px_rgba(14,165,233,0.20)]"
                : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-md"
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition sm:h-14 sm:w-14 ${
                activeTab === "all"
                  ? "bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600"
              }`}
            >
              <Inbox size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 sm:text-base">All Chats</p>
              <p className="text-xs text-slate-500 sm:text-sm">
                Every conversation in one place
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold sm:text-xs ${
                    activeTab === "all"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {chats.length} chat{chats.length !== 1 ? "s" : ""}
                </span>
                {activeTab === "all" && (
                  <span className="text-[10px] font-bold text-sky-600 sm:text-xs">Active</span>
                )}
              </div>
            </div>
            <ArrowRight
              size={18}
              className={`shrink-0 transition sm:size-5 ${
                activeTab === "all"
                  ? "text-sky-600"
                  : "text-slate-300 group-hover:text-slate-400"
              }`}
            />
          </button>

          {/* Chat with Sellers — I am buyer */}
          <button
            type="button"
            onClick={() => setActiveTab("sellers")}
            className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
              activeTab === "sellers"
                ? "border-sky-300 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-[0_8px_32px_-8px_rgba(14,165,233,0.20)]"
                : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-md"
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition sm:h-14 sm:w-14 ${
                activeTab === "sellers"
                  ? "bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600"
              }`}
            >
              <Store size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 sm:text-base">Chat with Sellers</p>
              <p className="text-xs text-slate-500 sm:text-sm">
                Conversations you started as a buyer
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold sm:text-xs ${
                    activeTab === "sellers"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {asBuyer.length} chat{asBuyer.length !== 1 ? "s" : ""}
                </span>
                {activeTab === "sellers" && (
                  <span className="text-[10px] font-bold text-sky-600 sm:text-xs">Active</span>
                )}
              </div>
            </div>
            <ArrowRight
              size={18}
              className={`shrink-0 transition sm:size-5 ${
                activeTab === "sellers"
                  ? "text-sky-600"
                  : "text-slate-300 group-hover:text-slate-400"
              }`}
            />
          </button>

          {/* Chat with Buyers — I am seller */}
          <button
            type="button"
            onClick={() => setActiveTab("buyers")}
            className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
              activeTab === "buyers"
                ? "border-sky-300 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-[0_8px_32px_-8px_rgba(14,165,233,0.20)]"
                : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-md"
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition sm:h-14 sm:w-14 ${
                activeTab === "buyers"
                  ? "bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600"
              }`}
            >
              <ShoppingBag size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 sm:text-base">Chat with Buyers</p>
              <p className="text-xs text-slate-500 sm:text-sm">
                Buyers who contacted you about your listings
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold sm:text-xs ${
                    activeTab === "buyers"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {activeAsSeller.length} chat{activeAsSeller.length !== 1 ? "s" : ""}
                </span>
                {activeTab === "buyers" && (
                  <span className="text-[10px] font-bold text-sky-600 sm:text-xs">Active</span>
                )}
              </div>
            </div>
            <ArrowRight
              size={18}
              className={`shrink-0 transition sm:size-5 ${
                activeTab === "buyers"
                  ? "text-sky-600"
                  : "text-slate-300 group-hover:text-slate-400"
              }`}
            />
          </button>

          {/* Archived */}
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
              activeTab === "archived"
                ? "border-sky-300 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-[0_8px_32px_-8px_rgba(14,165,233,0.20)]"
                : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-md"
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition sm:h-14 sm:w-14 ${
                activeTab === "archived"
                  ? "bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600"
              }`}
            >
              <Archive size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 sm:text-base">Archived</p>
              <p className="text-xs text-slate-500 sm:text-sm">
                Closed or completed conversations
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold sm:text-xs ${
                    activeTab === "archived"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {archived.length} chat{archived.length !== 1 ? "s" : ""}
                </span>
                {activeTab === "archived" && (
                  <span className="text-[10px] font-bold text-sky-600 sm:text-xs">Active</span>
                )}
              </div>
            </div>
            <ArrowRight
              size={18}
              className={`shrink-0 transition sm:size-5 ${
                activeTab === "archived"
                  ? "text-sky-600"
                  : "text-slate-300 group-hover:text-slate-400"
              }`}
            />
          </button>
        </div>

        {/* Chat list */}
        <div className="mt-6 sm:mt-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center sm:py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Inbox size={28} className="text-slate-300" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                No chats yet
              </h3>
              <p className="mt-1 max-w-sm px-6 text-sm text-slate-500">
                {activeTab === "all"
                  ? "You have no active conversations yet. Browse listings or post ads to start chatting."
                  : activeTab === "sellers"
                  ? "You haven't started any chats with sellers yet. Browse listings and contact a seller to start a conversation."
                  : activeTab === "buyers"
                  ? "No buyers have contacted you yet. Post ads to start receiving messages."
                  : "No archived conversations. Closed chats will appear here."}
              </p>
              {activeTab !== "archived" && (
                <Link
                  href={activeTab === "buyers" ? "/post-ad" : "/browse"}
                  className="tk-btn-primary mt-5"
                >
                  {activeTab === "buyers" ? "Post an ad" : "Browse listings"}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((c) => {
                const isMeBuyer = c.buyerId === user?.uid;
                const otherName = isMeBuyer ? c.sellerName : c.buyerName;
                const timeAgo = c.lastMessageAt?.seconds
                  ? formatTimeAgo(c.lastMessageAt.seconds)
                  : "";

                return (
                  <div
                    key={c.id}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-sky-200 hover:shadow-md sm:gap-4 sm:p-4"
                  >
                    {/* Ad thumbnail */}
                    <Link
                      href={`/chat/${c.id}`}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-16 sm:w-16"
                    >
                      {c.adImage ? (
                        <Image
                          src={c.adImage}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Store size={18} className="text-slate-300" />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <Link href={`/chat/${c.id}`} className="block">
                        <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                          {c.adTitle || "Chat"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                          {otherLabel && (
                            <span className="flex items-center gap-1">
                              <User size={12} className="text-slate-400" />
                              <span className="font-medium text-slate-700">{otherLabel}:</span>
                              <span className="truncate">{otherName || "User"}</span>
                            </span>
                          )}
                          {!otherLabel && (
                            <span className="flex items-center gap-1">
                              <User size={12} className="text-slate-400" />
                              <span className="truncate">{otherName || "User"}</span>
                            </span>
                          )}
                          {timeAgo && (
                            <span className="hidden text-slate-400 sm:inline">· {timeAgo}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-cyan-700 sm:text-sm">
                            {formatPrice(c.adPrice)}
                          </span>
                          {c.agreedPrice && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:text-xs">
                              Agreed {formatPrice(c.agreedPrice)}
                            </span>
                          )}
                          {c.status === "offer_accepted" && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 sm:text-xs">
                              Offer accepted
                            </span>
                          )}
                          {c.status === "closed" && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 sm:text-xs">
                              Closed
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <Link
                        href={`/chat/${c.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 transition hover:bg-sky-100 sm:h-10 sm:w-10"
                        title="Open chat"
                      >
                        <ArrowRight size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Delete this chat? This cannot be undone.")) return;
                          try {
                            await deleteChat(c.id);
                            setChats((prev) => prev.filter((x) => x.id !== c.id));
                            showToast("Chat deleted", "success");
                          } catch {
                            showToast("Could not delete chat", "error");
                          }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500 sm:h-10 sm:w-10"
                        title="Delete chat"
                      >
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
    </div>
  );
}
