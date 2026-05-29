"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserProfile,
  fetchAdById,
  subscribeChatMessages,
  sendChatMessage,
  acceptChatOffer,
  createTransaction,
  deleteChat,
  createNotification,
  getEscrowSettings,
} from "@/lib/firestore-helpers";
import { formatPrice, getMemberSinceYears } from "@/lib/utils";
import { playNotificationSound } from "@/lib/sound";
import { calculateEscrowFees } from "@/lib/escrow-engine";
import { useChatRead } from "@/hooks/useChatRead";
import { useToast } from "@/context/ToastContext";
import {
  Send,
  Loader2,
  ArrowLeft,
  Trash2,
  Tag,
  CheckCircle,
  Shield,
  ShoppingCart,
  User,
} from "lucide-react";

export default function ChatPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { markRead } = useChatRead(user?.uid);

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherProfile, setOtherProfile] = useState(null);
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [startingEscrow, setStartingEscrow] = useState(false);
  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const shouldScrollRef = useRef(true);
  const lastMessageIdRef = useRef(null);
  const soundInitRef = useRef(false);

  const isBuyer = chat?.buyerId === user?.uid;
  const isSeller = chat?.sellerId === user?.uid;
  const canSend = chat?.status !== "closed";

  useEffect(() => {
    if (!user) {
      router.replace(`/auth/login?redirect=/chat/${id}`);
      return;
    }
    loadChat();
  }, [id, user]);

  useEffect(() => {
    if (!id || !user) return;
    const unsub = subscribeChatMessages(id, setMessages);
    return () => unsub();
  }, [id, user]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom || shouldScrollRef.current) {
      container.scrollTop = container.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, [messages]);

  // New message sound + toast
  useEffect(() => {
    if (!user) return;
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (!last?.id) return;
    if (!soundInitRef.current) {
      soundInitRef.current = true;
      lastMessageIdRef.current = last.id;
      return;
    }
    if (last.senderId !== user.uid && last.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = last.id;
      playNotificationSound();
      showToast("New message", "info");
    }
  }, [messages, user, showToast]);

  async function loadChat() {
    try {
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const { COLLECTIONS } = await import("@/lib/constants");
      const snap = await getDoc(doc(db, COLLECTIONS.CHATS, id));
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      const data = { id: snap.id, ...snap.data() };
      const allowed = data.buyerId === user.uid || data.sellerId === user.uid;
      if (!allowed) {
        router.replace("/dashboard");
        return;
      }
      setChat(data);
      const otherId = data.buyerId === user.uid ? data.sellerId : data.buyerId;
      const [op, adData] = await Promise.all([
        fetchUserProfile(otherId),
        data.adId ? fetchAdById(data.adId, { viewerId: user.uid }) : null,
      ]);
      setOtherProfile(op);
      setAd(adData);
      setLoading(false);
      // Mark this chat as read when user opens it
      markRead(id);
    } catch {
      setLoading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !canSend) return;
    setSending(true);
    try {
      await sendChatMessage(id, {
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || "You",
        text: text.trim(),
        type: "text",
      });
      setText("");
      shouldScrollRef.current = true;
    } catch {
      showToast("Could not send message", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleSendOffer() {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) {
      showToast("Enter a valid offer amount", "info");
      return;
    }
    setSending(true);
    try {
      await sendChatMessage(id, {
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || "You",
        text: `Offer: ${formatPrice(amount)}`,
        type: "offer",
        offerAmount: amount,
      });
      setOfferAmount("");
      setShowOffer(false);
      shouldScrollRef.current = true;
      await createNotification({
        userId: chat.sellerId,
        type: "contact_seller",
        title: "New offer received",
        body: `${profile?.displayName || "Someone"} offered ${formatPrice(amount)} for "${chat.adTitle}"`,
        link: `/chat/${id}`,
      });
    } catch {
      showToast("Could not send offer", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleAcceptOffer(msg) {
    if (!msg.offerAmount) return;
    try {
      await acceptChatOffer(id, msg.offerAmount);
      await sendChatMessage(id, {
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || "You",
        text: `Accepted offer of ${formatPrice(msg.offerAmount)}`,
        type: "offer_accepted",
        offerAmount: msg.offerAmount,
      });
      const otherId = isSeller ? chat.buyerId : chat.sellerId;
      await createNotification({
        userId: otherId,
        type: "contact_seller",
        title: "Offer accepted",
        body: `Your offer of ${formatPrice(msg.offerAmount)} for "${chat.adTitle}" was accepted.`,
        link: `/chat/${id}`,
      });
      showToast("Offer accepted! Proceed to escrow to complete.", "success");
      shouldScrollRef.current = true;
      loadChat();
    } catch {
      showToast("Could not accept offer", "error");
    }
  }

  async function handleProceedToEscrow() {
    if (!chat?.agreedPrice || !ad) return;
    setStartingEscrow(true);
    try {
      const { id: txId } = await createTransaction({
        adId: ad.id,
        buyerId: chat.buyerId,
        sellerId: chat.sellerId,
        amount: chat.agreedPrice,
        adTitle: ad.title,
        buyerName: chat.buyerName || profile?.displayName || "Buyer",
        sellerName: chat.sellerName || otherProfile?.displayName || "Seller",
        buyerPhoto: profile?.photoURL || "",
        sellerPhoto: otherProfile?.photoURL || ad.sellerPhoto || "",
      });
      await sendChatMessage(id, {
        senderId: "system",
        senderName: "TrustKar",
        text: "Escrow deal created! Both parties have been redirected to the deal room.",
        type: "system",
      });
      await createNotification({
        userId: chat.buyerId,
        type: "contact_seller",
        title: "Escrow deal started",
        body: `Deal room opened for "${ad.title}" at ${formatPrice(chat.agreedPrice)}`,
        link: `/deal/${txId}`,
      });
      await createNotification({
        userId: chat.sellerId,
        type: "contact_seller",
        title: "Escrow deal started",
        body: `Deal room opened for "${ad.title}" at ${formatPrice(chat.agreedPrice)}`,
        link: `/deal/${txId}`,
      });
      router.push(`/deal/${txId}`);
    } catch (err) {
      showToast(err.message || "Could not start escrow", "error");
      setStartingEscrow(false);
    }
  }

  async function handleDeleteChat() {
    if (!confirm("Delete this chat? This cannot be undone.")) return;
    try {
      await deleteChat(id);
      showToast("Chat deleted", "success");
      router.push("/chats");
    } catch {
      showToast("Could not delete chat", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="tk-container py-20 text-center">
        <h1 className="text-xl font-bold">Chat not found</h1>
        <Link href="/chats" className="mt-4 text-cyan-600 hover:underline">
          Back to chats
        </Link>
      </div>
    );
  }

  const memberYears = getMemberSinceYears(otherProfile?.createdAt?.seconds);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/90 to-[var(--tk-bg)] pb-24">
      {/* Header */}
      <div className="border-b border-sky-200/80 bg-white/90 backdrop-blur-sm">
        <div className="tk-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 sm:text-xs">Private Chat</p>
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">{chat.adTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chat.adImage && (
              <Link href={`/ad/${chat.adId}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <Image src={chat.adImage} alt="" fill className="object-cover" unoptimized />
              </Link>
            )}
            <div className="text-right">
              <p className="text-xs font-bold text-sky-700">{formatPrice(chat.adPrice)}</p>
              {chat.agreedPrice && (
                <p className="text-[10px] font-bold text-emerald-600">Agreed: {formatPrice(chat.agreedPrice)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDeleteChat}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              title="Delete chat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="tk-container py-6 lg:py-8">
        <div className="mx-auto max-w-3xl">
          {/* Other party profile card */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                {otherProfile?.photoURL ? (
                  <Image src={otherProfile.photoURL} alt="" width={44} height={44} className="rounded-full object-cover" unoptimized />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{otherProfile?.displayName || (isBuyer ? chat.sellerName : chat.buyerName) || "User"}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {otherProfile?.trustRating != null && (
                    <span className="flex items-center gap-0.5 font-bold text-amber-600">
                      ★ {Number(otherProfile.trustRating).toFixed(1)}
                      {otherProfile?.reviewCount ? ` (${otherProfile.reviewCount})` : ""}
                    </span>
                  )}
                  {memberYears > 0 && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                      TrustKar Member · {memberYears} yr{memberYears > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="tk-card flex min-h-[420px] flex-col !p-0">
            {/* Proceed to escrow banner */}
            {chat.status === "offer_accepted" && chat.agreedPrice && (
              <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-center text-sm font-bold text-emerald-800">
                  <CheckCircle size={16} className="inline mr-1" />
                  Offer accepted at {formatPrice(chat.agreedPrice)}!
                </p>
                <button
                  type="button"
                  onClick={handleProceedToEscrow}
                  disabled={startingEscrow}
                  className="tk-btn-primary mx-auto mt-2 flex items-center gap-2"
                >
                  {startingEscrow ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                  Proceed to Buy Safely With Escrow
                </button>
              </div>
            )}

            {/* Messages */}
            <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4" style={{ maxHeight: "min(65vh, 480px)" }}>
              {messages.length === 0 && (
                <p className="text-center text-sm text-slate-400">Start the conversation…</p>
              )}
              {messages.map((m) => {
                const isMe = m.senderId === user.uid;
                const isSystem = m.type === "system" || m.senderId === "system";
                const timeStr = m.createdAt
                  ? (m.createdAt?.toDate
                      ? m.createdAt.toDate().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })
                      : new Date(m.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }))
                  : null;

                if (isSystem) {
                  return (
                    <div key={m.id} className="flex justify-center">
                      <div className="max-w-[92%] rounded-2xl bg-sky-50 px-4 py-2 text-center text-xs font-medium text-sky-800 shadow-sm">
                        <p>{m.text}</p>
                        {timeStr && <p className="mt-1 text-[10px] opacity-60">{timeStr}</p>}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm ${
                      isMe
                        ? "bg-cyan-600 border-cyan-500 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}>
                      <p className="text-[10px] font-bold opacity-70">{m.senderName}{isMe ? " · You" : ""}</p>

                      {m.type === "offer" ? (
                        <div className="mt-1">
                          <p className="flex items-center gap-1 font-bold">
                            <Tag size={14} /> Offer: {formatPrice(m.offerAmount)}
                          </p>
                          {!isMe && isSeller && chat.status !== "offer_accepted" && (
                            <button
                              type="button"
                              onClick={() => handleAcceptOffer(m)}
                              className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-600"
                            >
                              <CheckCircle size={12} /> Accept Offer
                            </button>
                          )}
                        </div>
                      ) : m.type === "offer_accepted" ? (
                        <p className="mt-1 font-bold text-emerald-300">{m.text}</p>
                      ) : (
                        <p className="mt-0.5">{m.text}</p>
                      )}

                      {timeStr && <p className={`mt-1 text-[10px] ${isMe ? "text-cyan-100" : "text-slate-400"}`}>{timeStr}</p>}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            {canSend && (
              <div className="border-t border-slate-100">
                {showOffer && isBuyer && (
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-3 py-2">
                    <span className="text-xs font-bold text-slate-500">Offer:</span>
                    <input
                      type="number"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      placeholder="Enter amount (PKR)"
                      className="tk-input flex-1 !py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSendOffer}
                      disabled={sending}
                      className="tk-btn-primary !px-3 !py-1.5 text-xs"
                    >
                      {sending ? <Loader2 className="animate-spin" size={14} /> : "Send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowOffer(false); setOfferAmount(""); }}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <form onSubmit={handleSend} className="flex items-center gap-2 p-2 sm:gap-2 sm:p-3">
                  {isBuyer && !showOffer && (
                    <button
                      type="button"
                      onClick={() => setShowOffer(true)}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
                    >
                      <Tag size={12} /> Offer
                    </button>
                  )}
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                    className="tk-input flex-1 !py-1.5"
                  />
                  <button type="submit" disabled={sending} className="tk-btn-primary !px-3">
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {chat.status === "closed" && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs font-bold text-slate-500">
                This chat is closed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
