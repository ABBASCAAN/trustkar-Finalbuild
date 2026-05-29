"use client";

import { useState, useMemo } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { adminUpdateUser } from "@/lib/firestore-helpers";
import { useToast } from "@/context/ToastContext";
import {
  Search,
  Ban,
  Star,
  Package,
  Calendar,
  X,
  CheckCircle,
  Loader2,
  Pencil,
  Lock,
} from "lucide-react";

const SORTS = [
  { id: "date_desc", label: "Newest" },
  { id: "date_asc", label: "Oldest" },
  { id: "rating_desc", label: "Rating high" },
  { id: "rating_asc", label: "Rating low" },
  { id: "listings_desc", label: "Most listings" },
];

export default function AdminUserManager({ users, ads, onRefresh }) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [busy, setBusy] = useState(false);

  const enriched = useMemo(() => {
    let list = users.map((u) => ({
      ...u,
      listingCount: ads.filter((a) => a.sellerId === u.uid).length,
    }));
    const t = search.trim().toLowerCase();
    if (t) {
      list = list.filter(
        (u) =>
          (u.email || "").toLowerCase().includes(t) ||
          (u.phone || "").includes(t) ||
          (u.displayName || "").toLowerCase().includes(t) ||
          u.uid === t
      );
    }
    switch (sort) {
      case "date_asc":
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        break;
      case "rating_desc":
        list.sort((a, b) => (b.trustRating || 0) - (a.trustRating || 0));
        break;
      case "rating_asc":
        list.sort((a, b) => (a.trustRating || 0) - (b.trustRating || 0));
        break;
      case "listings_desc":
        list.sort((a, b) => b.listingCount - a.listingCount);
        break;
      default:
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
    return list;
  }, [users, search, sort, ads]);

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      await adminUpdateUser(editing, {
        displayName: editForm.displayName,
        phone: editForm.phone,
        trustRating: Number(editForm.trustRating) || 5,
      });
      showToast("User updated", "success");
      setEditing(null);
      onRefresh();
    } catch (e) {
      showToast(e.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSuspend(uid, suspended) {
    try {
      await adminUpdateUser(uid, { suspended: !suspended });
      showToast(!suspended ? "User suspended" : "User restored", "success");
      onRefresh();
    } catch (e) {
      showToast("Failed", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email, mobile, or name"
            className="tk-input !py-2 text-sm"
          />
          <button type="button" className="tk-btn-primary !px-3 !py-2">
            <Search size={16} />
          </button>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="tk-input !w-auto !py-2 text-xs">
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-500">{enriched.length} users</p>

      <ul className="space-y-2">
        {enriched.map((u) => (
          <li key={u.uid} className="tk-card !p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{u.displayName || u.email}</p>
                <p className="text-xs text-slate-500">{u.email} · {u.phone || "—"}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Star size={10} className="text-amber-500" /> {Number(u.trustRating || 0).toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Package size={10} /> {u.listingCount}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "—"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setEditing(u.uid); setEditForm({ displayName: u.displayName || "", phone: u.phone || "", trustRating: u.trustRating || 5 }); }}
                  className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700"
                >
                  <Pencil size={12} className="inline" /> Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await sendPasswordResetEmail(auth, u.email);
                      showToast("Password reset email sent", "success");
                    } catch { showToast("Failed to send reset email", "error"); }
                  }}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700"
                >
                  <Lock size={12} className="inline" /> Reset
                </button>
                <button
                  type="button"
                  onClick={() => toggleSuspend(u.uid, u.suspended)}
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${u.suspended ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                >
                  <Ban size={12} className="inline" /> {u.suspended ? "Restore" : "Suspend"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="tk-card w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Edit User</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <input
              className="tk-input !py-2 text-sm"
              placeholder="Display name"
              value={editForm.displayName || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
            />
            <input
              className="tk-input !py-2 text-sm"
              placeholder="Phone"
              value={editForm.phone || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              type="number"
              step="0.1"
              max={5}
              min={0}
              className="tk-input !py-2 text-sm"
              placeholder="Trust rating"
              value={editForm.trustRating || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, trustRating: e.target.value }))}
            />
            <p className="text-xs text-slate-500">Use the Reset button in the list to send a password reset email.</p>
            <div className="flex gap-2">
              <button type="button" onClick={saveEdit} disabled={busy} className="tk-btn-primary flex-1">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="tk-btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
