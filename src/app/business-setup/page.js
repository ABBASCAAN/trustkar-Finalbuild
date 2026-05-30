"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { createBusinessProfile } from "@/lib/firestore-helpers";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { CITIES } from "@/lib/constants";
import {
  Loader2,
  ArrowLeft,
  Camera,
  ImagePlus,
  Store,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  CheckCircle,
  Tag,
  Building2,
} from "lucide-react";

export default function BusinessSetupPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const logoRef = useRef(null);
  const bannerRef = useRef(null);

  const [form, setForm] = useState({
    businessName: "",
    productTypes: [],
    productTypeInput: "",
    location: { city: "Karachi", state: "", country: "Pakistan" },
    phone: "",
    socialLinks: { instagram: "", facebook: "", linkedin: "", website: "" },
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?redirect=/business-setup");
    }
    if (!loading && profile?.accountType) {
      router.replace("/");
    }
  }, [user, profile, loading, router]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addProductType() {
    const val = form.productTypeInput.trim();
    if (!val) return;
    if (form.productTypes.includes(val)) return;
    setForm((f) => ({
      ...f,
      productTypes: [...f.productTypes, val],
      productTypeInput: "",
    }));
  }

  function removeProductType(val) {
    setForm((f) => ({
      ...f,
      productTypes: f.productTypes.filter((x) => x !== val),
    }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleBannerChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!user) return;
    if (!form.businessName.trim()) return;
    setSubmitting(true);
    try {
      let logoUrl = "";
      let bannerUrl = "";
      if (logoFile) {
        const res = await uploadImageToCloudinary(logoFile, { folder: "store_logos" });
        logoUrl = res.secureUrl || res.url;
      }
      if (bannerFile) {
        const res = await uploadImageToCloudinary(bannerFile, { folder: "store_banners" });
        bannerUrl = res.secureUrl || res.url;
      }
      await createBusinessProfile(user.uid, {
        businessName: form.businessName,
        logoUrl,
        bannerUrl,
        productTypes: form.productTypes,
        location: form.location,
        phone: form.phone,
        socialLinks: form.socialLinks,
      });
      router.replace("/?business_created=1");
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* Fixed header */}
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/account-type")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-700 text-[10px] font-black text-white shadow-sm">
              TK
            </span>
            <div>
              <h1 className="text-base font-black text-slate-900">Business Setup</h1>
              <p className="text-[10px] font-medium text-slate-400">Step {step} of 2</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-cyan-600 transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        {step === 1 && (
          <div className="space-y-5">
            {/* Business Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <Building2 size={14} /> Business Name *
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="e.g. TechWorld Pakistan"
                className="tk-input w-full"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <Camera size={14} /> Business Logo
              </label>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition ${
                  logoPreview
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:border-sky-300"
                }`}
              >
                {logoPreview ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                    <Image src={logoPreview} alt="Logo preview" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <ImagePlus size={20} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">Upload Logo</span>
                  </>
                )}
              </button>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <ImagePlus size={14} /> Store Banner
              </label>
              <input
                ref={bannerRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition ${
                  bannerPreview
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:border-sky-300"
                }`}
              >
                {bannerPreview ? (
                  <div className="relative h-24 w-full overflow-hidden rounded-xl">
                    <Image src={bannerPreview} alt="Banner preview" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <ImagePlus size={20} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">Upload Banner</span>
                  </>
                )}
              </button>
            </div>

            {/* Product Types */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <Tag size={14} /> Types of Products Sold
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.productTypeInput}
                  onChange={(e) => updateField("productTypeInput", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProductType())}
                  placeholder="e.g. Electronics"
                  className="tk-input flex-1"
                />
                <button
                  type="button"
                  onClick={addProductType}
                  className="tk-btn-primary !px-3"
                >
                  Add
                </button>
              </div>
              {form.productTypes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.productTypes.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeProductType(t)}
                        className="text-sky-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!form.businessName.trim()}
              className="tk-btn-primary w-full !py-3.5 text-sm font-bold"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Location */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                  <MapPin size={14} /> City
                </label>
                <select
                  value={form.location.city}
                  onChange={(e) =>
                    updateField("location", { ...form.location, city: e.target.value })
                  }
                  className="tk-input w-full"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                  State/Province
                </label>
                <input
                  type="text"
                  value={form.location.state}
                  onChange={(e) =>
                    updateField("location", { ...form.location, state: e.target.value })
                  }
                  placeholder="Punjab"
                  className="tk-input w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                  Country
                </label>
                <input
                  type="text"
                  value={form.location.country}
                  onChange={(e) =>
                    updateField("location", { ...form.location, country: e.target.value })
                  }
                  className="tk-input w-full"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <Phone size={14} /> Business Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+92 300 0000000"
                className="tk-input w-full"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <Globe size={14} /> Social Media (Optional)
              </label>
              <div className="relative">
                <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                <input
                  type="text"
                  value={form.socialLinks.instagram}
                  onChange={(e) =>
                    updateField("socialLinks", { ...form.socialLinks, instagram: e.target.value })
                  }
                  placeholder="Instagram URL"
                  className="tk-input w-full pl-10"
                />
              </div>
              <div className="relative">
                <Facebook size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                <input
                  type="text"
                  value={form.socialLinks.facebook}
                  onChange={(e) =>
                    updateField("socialLinks", { ...form.socialLinks, facebook: e.target.value })
                  }
                  placeholder="Facebook URL"
                  className="tk-input w-full pl-10"
                />
              </div>
              <div className="relative">
                <Linkedin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700" />
                <input
                  type="text"
                  value={form.socialLinks.linkedin}
                  onChange={(e) =>
                    updateField("socialLinks", { ...form.socialLinks, linkedin: e.target.value })
                  }
                  placeholder="LinkedIn URL"
                  className="tk-input w-full pl-10"
                />
              </div>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.socialLinks.website}
                  onChange={(e) =>
                    updateField("socialLinks", { ...form.socialLinks, website: e.target.value })
                  }
                  placeholder="Website URL"
                  className="tk-input w-full pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="tk-btn-outline flex-1 !py-3.5 text-sm font-bold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="tk-btn-primary flex-1 !py-3.5 text-sm font-bold"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-1" /> Create Store
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
