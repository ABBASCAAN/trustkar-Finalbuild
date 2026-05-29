"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDisputeById,
  fetchTransactionById,
  subscribeDisputeMessages,
  sendDisputeMessage,
} from "@/lib/firestore-helpers";
import { ESCROW_STATUS_LABELS, DISPUTE_OUTCOMES } from "@/lib/constants";
import { formatPrice, formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import {
  Loader2,
  Shield,
  AlertTriangle,
  Send,
  User,
  ArrowLeft,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Gavel,
} from "lucide-react";

const ROLE_COLORS = {
  buyer: "bg-sky-50 border-sky-200 text-sky-900",
  seller: "bg-emerald-50 border-emerald-200 text-emerald-900",
  admin: "bg-amber-50 border-amber-200 text-amber-900",
};

const ROLE_LABELS = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "Moderator",
};

export default function DisputeDetailPage() {
  const { id } = useParams();
  const { user, isAdmin, profile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const chatEndRef = useRef(null);

  const [dispute, setDispute] = useState(null);
  const [tx, setTx] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    let unsub = null;
    async function load() {
      const d = await fetchDisputeById(id);
      if (!d) {
        setLoading(false);
        return;
      }
      setDispute(d);
      if (d.transactionId) {
        const t = await fetchTransactionById(d.transactionId);
        setTx(t);
      }
      setLoading(false);
      unsub = subscribeDisputeMessages(id, (list) => {
        setMessages(list);
      });
    }
    load();
    return () => {
      if (unsub) unsub();
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      const role = isAdmin ? "admin" : dispute?.buyerId === user.uid ? "buyer" : "seller";
      const name = profile?.displayName || user.displayName || ROLE_LABELS[role];
      await sendDisputeMessage(id, {
        senderId: user.uid,
        senderRole: role,
        senderName: name,
        text: text.trim(),
      });
      setText("");
    } catch {
      showToast("Could not send message", "error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="tk-container py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold">Dispute not found</h1>
        <Link href="/disputes" className="mt-4 inline-block text-sky-700">
          ← All disputes
        </Link>
      </div>
    );
  }

  const isParty = dispute.buyerId === user?.uid || dispute.sellerId === user?.uid || isAdmin;
  const myRole = isAdmin ? "admin" : dispute.buyerId === user?.uid ? "buyer" : "seller";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/90 to-[var(--tk-bg)] pb-24">
      {/* Header */}
      <div className="border-b border-sky-200/80 bg-white/90 backdrop-blur-sm">
        <div className="tk-container py-5 sm:py-6">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push("/disputes")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 sm:text-xl">{dispute.reason}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                    dispute.status === "resolved"
                      ? "bg-emerald-100 text-emerald-700"
                      : dispute.status === "open"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {dispute.status}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {tx?.escrowId || dispute.transactionId} · Opened {formatDate(dispute.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="tk-container py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Evidence & details */}
          <div className="space-y-4 lg:col-span-1">
            {/* Transaction card */}
            {tx && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-400">Related deal</p>
                <p className="mt-1 font-bold text-slate-900">{tx.adTitle}</p>
                <p className="text-sm text-cyan-700">{formatPrice(tx.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Status: {ESCROW_STATUS_LABELS[tx.status] || tx.status}
                </p>
                <Link
                  href={`/deal/${tx.id}`}
                  className="mt-2 inline-block text-xs font-bold text-sky-700 hover:underline"
                >
                  Open deal room →
                </Link>
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-400">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{dispute.description}</p>
            </div>

            {/* Evidence */}
            {dispute.evidenceUrls?.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-400">Evidence</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {dispute.evidenceUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                    >
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution */}
            {dispute.status === "resolved" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Gavel size={18} />
                  <p className="text-sm font-bold">Resolved</p>
                </div>
                <p className="mt-2 text-sm text-emerald-700">
                  Outcome: {dispute.outcome || "N/A"}
                  {dispute.partialAmount ? ` · PKR ${dispute.partialAmount.toLocaleString()}` : ""}
                </p>
                {dispute.resolutionNote && (
                  <p className="mt-1 text-xs text-emerald-600">{dispute.resolutionNote}</p>
                )}
              </div>
            )}

            {dispute.responseDeadline && dispute.status === "open" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock size={16} />
                  <p className="text-xs font-bold">Response deadline</p>
                </div>
                <p className="mt-1 text-xs text-amber-700">
                  {new Date(dispute.responseDeadline).toLocaleString("en-PK")}
                </p>
              </div>
            )}
          </div>

          {/* Right: Negotiation chat */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <MessageCircle size={18} className="text-sky-600" />
              <p className="text-sm font-bold text-slate-900">Dispute negotiation</p>
              <span className="ml-auto rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                {messages.length} messages
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4" style={{ maxHeight: "min(60vh, 500px)" }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield size={32} className="text-slate-200" />
                  <p className="mt-3 text-sm text-slate-400">
                    Negotiation chat is open. Both parties and the moderator can discuss the case here.
                  </p>
                </div>
              )}
              {messages.map((m) => {
                const isMe = m.senderId === user?.uid;
                const role = m.senderRole || "buyer";
                const label = ROLE_LABELS[role] || role;
                const timeStr = m.createdAt
                  ? (m.createdAt?.toDate
                      ? m.createdAt.toDate().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
                      : new Date(m.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }))
                  : null;

                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm sm:px-4 ${ROLE_COLORS[role] || "bg-slate-50 border-slate-200 text-slate-800"}`}>
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="opacity-60" />
                        <span className="text-[10px] font-bold uppercase opacity-70">{label}{isMe ? " · You" : ""}</span>
                      </div>
                      <p className="mt-1">{m.text}</p>
                      {m.imageUrl && (
                        <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg">
                          <Image src={m.imageUrl} alt="Attachment" fill className="object-cover" unoptimized />
                        </div>
                      )}
                      {timeStr && <p className="mt-1 text-[10px] opacity-50">{timeStr}</p>}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {dispute.status === "open" && isParty && (
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message…"
                  className="tk-input flex-1 !py-2 text-sm"
                />
                <button type="submit" disabled={sending} className="tk-btn-primary !px-3 !py-2">
                  <Send size={15} />
                </button>
              </form>
            )}

            {dispute.status === "resolved" && (
              <div className="border-t border-slate-100 p-3 text-center text-xs font-bold text-emerald-700">
                <CheckCircle size={14} className="inline-block mr-1" /> This dispute is resolved. Chat is read-only.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
