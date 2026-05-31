"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  updateUserProfile,
  savePaymentMethods,
  uploadProfileImage,
} from "@/lib/firestore-helpers";
import {
  ArrowLeft,
  Camera,
  User,
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  Landmark,
  Smartphone,
  Save,
  Loader2,
  CheckCircle2,
  CheckCircle,
  Trash2,
  Plus,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAYMENT_TYPES = [
  { id: "jazzcash", label: "JazzCash", icon: Smartphone },
  { id: "easypaisa", label: "EasyPaisa", icon: Wallet },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
];

function SectionCard({ title, icon: Icon, children, className }) {
  return (
    <div className={cn("rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6", className)}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
          <Icon size={16} className="text-sky-700" />
        </div>
        <h2 className="text-sm font-black text-slate-900 sm:text-base">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InputRow({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="tk-input !py-2.5 text-sm"
      />
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 z-[600] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 sm:bottom-8",
        type === "success" ? "bg-emerald-500" : "bg-red-500"
      )}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} />
        {message}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef(null);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [uploadingPic, setUploadingPic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
      setAddress(profile.address || "");
      setPaymentMethods(Array.isArray(profile.paymentMethods) ? profile.paymentMethods : []);
    }
  }, [profile]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-sky-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <User size={40} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">Please log in to manage your settings</p>
        <button onClick={() => router.push("/auth/login")} className="tk-btn-primary">
          Login
        </button>
      </div>
    );
  }

  async function handlePicUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB", "error");
      return;
    }
    try {
      setUploadingPic(true);
      await uploadProfileImage(user.uid, file);
      await refreshProfile();
      showToast("Profile picture updated");
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploadingPic(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        city: city.trim(),
        address: address.trim(),
      });
      await refreshProfile();
      showToast("Profile saved successfully");
    } catch (err) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  function addPaymentMethod(type) {
    const defaults = {
      jazzcash: { type: "jazzcash", accountNumber: "", accountTitle: "" },
      easypaisa: { type: "easypaisa", accountNumber: "", accountTitle: "" },
      bank: { type: "bank", bankName: "", accountNumber: "", accountTitle: "" },
    };
    setPaymentMethods((prev) => [...prev, { id: crypto.randomUUID(), ...defaults[type] }]);
  }

  function updatePaymentMethod(id, field, value) {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  function removePaymentMethod(id) {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSavePayments() {
    try {
      setSavingPayments(true);
      const cleaned = paymentMethods.map((m) => ({
        id: m.id,
        type: m.type,
        accountNumber: m.accountNumber?.trim() || "",
        accountTitle: m.accountTitle?.trim() || "",
        bankName: m.bankName?.trim() || "",
      }));
      await savePaymentMethods(user.uid, cleaned);
      await refreshProfile();
      showToast("Payment methods saved");
    } catch (err) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setSavingPayments(false);
    }
  }

  const photo = profile?.photoURL || user?.photoURL;

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50 md:h-auto md:min-h-screen">
      {/* Fixed header — Settings title (mobile app feel) */}
      <div className="shrink-0 border-b border-slate-200/60 bg-white/95 shadow-sm md:sticky md:top-0 md:z-40">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-slate-100">
            <ArrowLeft size={18} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Settings</h1>
            <p className="text-xs font-medium text-slate-400">Manage your profile and preferences</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 sm:px-6 sm:py-5 md:pb-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {/* Profile Picture */}
        <SectionCard title="Profile Picture" icon={Camera}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-sky-100 bg-gradient-to-br from-sky-500 to-cyan-600 shadow-md">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User size={36} className="text-white" />
                )}
              </div>
              {uploadingPic && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                  <Loader2 size={24} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <p className="text-sm font-semibold text-slate-700">
                {displayName || "Your Profile"}
              </p>
              <p className="max-w-xs text-center text-xs text-slate-500 sm:text-left">
                Upload a clear photo so buyers and sellers can recognize you.
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPic}
                className="tk-btn-outline !px-4 !py-2 text-xs"
              >
                <Camera size={14} /> Change Photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePicUpload}
              />
            </div>
          </div>
        </SectionCard>

        {/* Personal Info */}
        <SectionCard title="Personal Information" icon={User}>
          <div className="flex flex-col gap-4">
            <InputRow
              label="Display Name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your full name"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Phone Number</label>
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <span className="flex h-11 items-center border-r border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-500 select-none">
                  +92
                </span>
                <input
                  type="tel"
                  disabled
                  readOnly
                  value={phone.replace(/^\+?92/, "").replace(/^0/, "")}
                  placeholder="3000000000"
                  className="h-11 flex-1 bg-transparent px-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
                {profile?.phoneVerified && (
                  <span className="mr-3 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle size={10} /> Verified
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Phone number cannot be changed after registration. Contact support for help.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="tk-input !py-2.5 text-sm"
              >
                <option value="">Select your city</option>
                {[
                  "Karachi",
                  "Lahore",
                  "Islamabad",
                  "Rawalpindi",
                  "Faisalabad",
                  "Gujranwala",
                  "Peshawar",
                  "Multan",
                  "Sialkot",
                  "Quetta",
                  "Other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Full Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House number, street, area, landmark..."
                rows={3}
                className="tk-input !py-2.5 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="tk-btn-primary !px-5 !py-2.5 text-sm"
              >
                {savingProfile ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Profile
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Account Type */}
        <SectionCard title="Account Type" icon={Briefcase}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/40 p-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Current: {profile?.accountType === "business" ? "Business User" : "Personal User"}
                </p>
                <p className="text-xs text-slate-500">
                  {profile?.accountType === "business"
                    ? "You can post ads and manage a store."
                    : "You can browse, buy, and sell as an individual."}
                </p>
              </div>
            </div>
            {profile?.accountType === "business" ? (
              <button
                type="button"
                onClick={() => router.push("/account-type")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-100"
              >
                <User size={16} /> Switch to Personal User
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/business-setup")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700"
              >
                <Briefcase size={16} /> Switch to Business User <ArrowRight size={14} />
              </button>
            )}
          </div>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard title="Payment Methods" icon={CreditCard}>
          <div className="flex flex-col gap-4">
            {paymentMethods.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <CreditCard size={28} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-600">No payment methods</p>
                <p className="text-xs text-slate-500">Add how buyers can pay you</p>
              </div>
            )}

            {paymentMethods.map((method) => {
              const typeMeta = PAYMENT_TYPES.find((t) => t.id === method.type);
              const TypeIcon = typeMeta?.icon || CreditCard;
              return (
                <div
                  key={method.id}
                  className="rounded-xl border border-sky-100 bg-sky-50/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={16} className="text-sky-700" />
                      <span className="text-sm font-bold text-slate-800">
                        {typeMeta?.label || method.type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(method.id)}
                      className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {method.type === "bank" && (
                      <InputRow
                        label="Bank Name"
                        value={method.bankName || ""}
                        onChange={(v) => updatePaymentMethod(method.id, "bankName", v)}
                        placeholder="HBL, UBL, Meezan Bank..."
                      />
                    )}
                    <InputRow
                      label={method.type === "bank" ? "Account Number / IBAN" : "Account Number"}
                      value={method.accountNumber || ""}
                      onChange={(v) => updatePaymentMethod(method.id, "accountNumber", v)}
                      placeholder={
                        method.type === "bank" ? "PK00XXXX..." : "03XX-XXXXXXX"
                      }
                    />
                    <InputRow
                      label="Account Title"
                      value={method.accountTitle || ""}
                      onChange={(v) => updatePaymentMethod(method.id, "accountTitle", v)}
                      placeholder="Name on account"
                    />
                  </div>
                </div>
              );
            })}

            {/* Add buttons */}
            <div className="flex flex-wrap gap-2">
              {PAYMENT_TYPES.map((t) => {
                const hasOne = paymentMethods.some((m) => m.type === t.id);
                if (hasOne) return null;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addPaymentMethod(t.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-sky-50"
                  >
                    <Plus size={13} className="text-sky-600" />
                    <Icon size={13} className="text-sky-600" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {paymentMethods.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePayments}
                  disabled={savingPayments}
                  className="tk-btn-primary !px-5 !py-2.5 text-sm"
                >
                  {savingPayments ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Payment Methods
                </button>
              </div>
            )}
          </div>
        </SectionCard>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
