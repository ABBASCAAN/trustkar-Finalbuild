"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createSupportTicket } from "@/lib/firestore-helpers";
import { useToast } from "@/context/ToastContext";
import { Mail, KeyRound, MessageCircle, Loader2, Headphones } from "lucide-react";

export default function SupportPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      showToast("Please write your message", "error");
      return;
    }
    setLoading(true);
    try {
      await createSupportTicket({
        userId: user?.uid || "guest",
        email: user?.email || profile?.email || "not provided",
        subject: subject.trim() || "Support request",
        message: message.trim(),
        type,
      });
      showToast("Message sent! Our team will contact you.", "success");
      setSubject("");
      setMessage("");
    } catch {
      showToast("Could not send. Email help@trustkar.pk", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-[var(--tk-bg)]">
      <div className="border-b border-sky-200/60 bg-white/80">
        <div className="tk-container py-10 text-center">
          <Headphones className="mx-auto h-12 w-12 text-sky-600" />
          <h1 className="mt-4 text-3xl font-black text-slate-900">Help & Support</h1>
          <p className="mx-auto mt-2 max-w-lg text-slate-600">
            Password, escrow, payments, or account issues — we&apos;re here for you.
          </p>
        </div>
      </div>

      <div className="tk-container py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="tk-card flex gap-4 !p-5">
              <KeyRound className="h-8 w-8 shrink-0 text-sky-600" />
              <div>
                <h2 className="font-bold text-slate-900">Forgot password?</h2>
                <p className="mt-1 text-sm text-slate-600">Reset via email in one minute.</p>
                <Link href="/auth/forgot-password" className="mt-2 inline-block text-sm font-bold text-sky-700 hover:underline">
                  Reset password →
                </Link>
              </div>
            </div>
            <div className="tk-card flex gap-4 !p-5">
              <Mail className="h-8 w-8 shrink-0 text-slate-600" />
              <div>
                <p className="font-bold">help@trustkar.pk</p>
                <p className="text-sm text-slate-500">Mon–Sat · 9am–6pm PKT</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="tk-card space-y-4 !p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MessageCircle size={22} className="text-sky-600" /> Send a message
            </h2>
            <select value={type} onChange={(e) => setType(e.target.value)} className="tk-input">
              <option value="general">General</option>
              <option value="password">Password / Login</option>
              <option value="escrow">Escrow / Payment</option>
              <option value="dispute">Dispute</option>
              <option value="account">Account</option>
            </select>
            <input
              className="tk-input"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="tk-input min-h-[140px]"
              placeholder="Describe your issue…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="tk-btn-primary w-full !py-3.5">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send to TrustKar"}
            </button>
          </form>
        </div>

        <section id="terms" className="tk-card mt-8 max-w-3xl text-sm text-slate-600">
          <h2 className="text-lg font-bold text-slate-900">Terms of Service</h2>
          <p className="mt-2">Use TrustKar responsibly. Fraudulent listings result in permanent bans.</p>
        </section>
        <section id="privacy" className="tk-card mt-4 max-w-3xl text-sm text-slate-600">
          <h2 className="text-lg font-bold text-slate-900">Privacy Policy</h2>
          <p className="mt-2">Account and transaction data stored securely in Firebase. Images on Cloudinary.</p>
        </section>

        <section id="escrow-policy" className="tk-card mt-8 max-w-3xl text-sm text-slate-700">
          <h2 className="text-lg font-bold text-slate-900">Escrow System Policy (Marketplace Protection Model)</h2>
          <p className="mt-2 text-slate-600">
            Core Principle: Funds remain fully locked in escrow until successful delivery confirmation or dispute resolution,
            ensuring neutral protection for both buyer and seller.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900">1. Account Verification (Mandatory Entry Gate)</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>All users must complete KYC verification (ID + phone verification + selfie match).</li>
                <li>Payment method (bank or digital wallet) must be linked for deposits and withdrawals.</li>
                <li>New accounts have restricted transaction limits until trust score increases.</li>
              </ul>
              <p className="mt-2 text-slate-600">Purpose: Prevent fake accounts and impersonation scams.</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">2. Listing Approval &amp; Monitoring</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Automated fraud detection (price anomalies, scam keywords, banned goods).</li>
                <li>Image verification (duplicate/reused image detection).</li>
                <li>Manual review for high-value items.</li>
              </ul>
              <p className="mt-2 text-slate-600">
                Suspicious listings may be blocked or flagged for review.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">3. Escrow Payment System (Core Mechanism)</h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5">
                <li>Buyer pays into platform escrow account.</li>
                <li>Funds are locked and cannot be accessed by seller immediately.</li>
                <li>Seller receives notification: “Payment secured in escrow”.</li>
              </ol>
              <p className="mt-2 text-slate-600">Seller only proceeds once funds are confirmed in escrow.</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">4. Order Fulfillment Requirement</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Dispatch the item within the allowed timeframe.</li>
                <li>Provide valid shipment proof (tracking ID / courier confirmation).</li>
              </ul>
              <p className="mt-2 text-slate-600">Failure to ship on time may result in automatic cancellation and refund.</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">5. Buyer Inspection &amp; Acceptance Window</h3>
              <p className="mt-2 text-slate-600">
                After delivery, the buyer is given a fixed inspection period (24–72 hours).
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Accept Item</li>
                <li>Report Issue</li>
              </ul>
              <p className="mt-2 text-slate-600">
                If no action is taken, order is auto-completed after the timer expires.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">6. Dispute Resolution System</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Funds remain fully locked in escrow.</li>
                <li>Buyer must submit evidence (photos, videos, description).</li>
                <li>Seller must respond within a defined timeframe.</li>
              </ul>
              <p className="mt-2 text-slate-600">
                Resolution outcomes:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Full refund to buyer</li>
                <li>Partial refund</li>
                <li>Release of funds to seller</li>
              </ul>
              <p className="mt-2 text-slate-600">
                All decisions are recorded for audit purposes.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">7. Escrow Release Rules</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Funds are released only when buyer confirms acceptance, or inspection timer expires, or dispute is resolved.</li>
                <li>No manual withdrawal bypass is allowed.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">8. Fraud Detection &amp; Risk Scoring</h3>
              <p className="mt-2 text-slate-600">
                The platform continuously evaluates users based on:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Dispute frequency</li>
                <li>Delivery success rate</li>
                <li>Payment behavior</li>
                <li>Device/IP inconsistencies</li>
              </ul>
              <p className="mt-2 text-slate-600">
                Actions: Warning → Temporary restrictions → Account suspension/ban
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">9. Refund &amp; Chargeback Control</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>All payments are final once escrow is released.</li>
                <li>Fraudulent chargeback attempts are monitored.</li>
                <li>Abuse leads to account restrictions and payment method blacklisting.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">10. Buyer Protection Rules</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Item is not delivered</li>
                <li>Item significantly differs from listing</li>
                <li>Seller fails to ship within timeframe</li>
                <li>Fraud is proven through dispute process</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">11. Seller Protection Rules</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Valid shipment proof is provided</li>
                <li>Buyer fails to respond within inspection window</li>
                <li>Buyer makes unsubstantiated claims</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">12. Platform Fees &amp; Transparency</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Escrow fee is deducted transparently before settlement.</li>
                <li>All charges are shown before transaction confirmation.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">13. Audit &amp; Logging System</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Payments</li>
                <li>Messages</li>
                <li>Shipment proofs</li>
                <li>Dispute history</li>
              </ul>
              <p className="mt-2 text-slate-600">
                Logs are immutable and used for fraud investigation.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">14. Enforcement Authority</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>The Trust &amp; Safety Team may freeze accounts, reverse transactions, permanently ban fraudulent users, or escalate serious fraud cases legally.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
