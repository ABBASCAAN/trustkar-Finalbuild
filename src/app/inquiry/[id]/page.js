"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchInquiryById,
  subscribeInquiryMessages,
  sendInquiryMessage,
} from "@/lib/firestore-helpers";
import { Loader2, Send, ArrowLeft, MessageCircle, Shield } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const ROLE_STYLE = {
  buyer: "ml-auto bg-sky-50 border-sky-200",
  seller: "bg-cyan-50 border-cyan-200",
  admin: "bg-amber-50 border-amber-200",
};

export default function InquiryChatPage() {
  const { id } = useParams();
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const endRef = useRef(null);

  const [inquiry, setInquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace(`/auth/login?redirect=/inquiry/${id}`);
      return;
    }
    fetchInquiryById(id).then((data) => {
      if (!data) {
        setLoading(false);
        return;
      }
      const allowed =
        isAdmin || data.buyerId === user.uid || data.sellerId === user.uid;
      if (!allowed) {
        router.replace("/dashboard");
        return;
      }
      setInquiry(data);
      setLoading(false);
    });
  }, [id, user, isAdmin]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeInquiryMessages(id, setMessages);
    return () => unsub();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function myRole() {
    if (isAdmin) return "admin";
    if (inquiry?.buyerId === user?.uid) return "buyer";
    if (inquiry?.sellerId === user?.uid) return "seller";
    return "buyer";
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendInquiryMessage(id, {
        senderId: user.uid,
        senderRole: myRole(),
        senderName: profile?.displayName || user.displayName || myRole(),
        text: text.trim(),
      });
      setText("");
    } catch {
      showToast("Could not send", "error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="tk-container py-20 text-center">
        <p>Conversation not found.</p>
        <Link href="/dashboard" className="mt-4 text-sky-700">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 to-[var(--tk-bg)] pb-24">
      <div className="border-b border-sky-200 bg-white">
        <div className="tk-container flex items-center gap-3 py-4">
          <Link href={`/ad/${inquiry.adId}`} className="rounded-full p-2 hover:bg-sky-50">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase text-sky-700">Inquiry chat</p>
            <h1 className="truncate font-black text-slate-900">{inquiry.adTitle}</h1>
            {inquiry.listingId && (
              <p className="font-mono text-[10px] text-slate-500">{inquiry.listingId}</p>
            )}
          </div>
          {isAdmin && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
              <Shield size={12} /> Admin
            </span>
          )}
        </div>
      </div>

      <div className="tk-container mt-4 flex max-h-[calc(100vh-220px)] min-h-[420px] flex-col rounded-2xl border border-sky-100 bg-white shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <MessageCircle size={18} className="text-sky-600" />
          <span className="text-sm font-bold text-slate-700">Buyer · Seller · Admin</span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[88%] rounded-2xl border px-3 py-2 text-sm ${ROLE_STYLE[m.senderRole] || ROLE_STYLE.buyer}`}
            >
              <p className="text-[10px] font-bold uppercase text-slate-500">{m.senderName || m.senderRole}</p>
              <p className="mt-0.5">{m.text}</p>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Short message…"
            className="tk-input flex-1 !py-2.5"
            maxLength={500}
          />
          <button type="submit" disabled={sending} className="tk-btn-primary !px-4">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
