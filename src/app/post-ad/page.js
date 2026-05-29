"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_TREE, getCategoryPathLabels } from "@/lib/categories";
import { getFieldsForCategory } from "@/lib/category-form-fields";
import ImageUploader, { MIN_IMAGES } from "@/components/ImageUploader";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { createAd, fetchAdById, updateAd } from "@/lib/firestore-helpers";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { CONDITIONS, CITIES } from "@/lib/constants";
import RequireAuth from "@/components/RequireAuth";
import { Loader2, PlusCircle, Pencil } from "lucide-react";

function PostAdInner() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);

  const [images, setImages] = useState([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAd, setLoadingAd] = useState(isEdit);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    negotiable: false,
    condition: "Used",
    brand: "",
    model: "",
    year: "",
    ram: "",
    storage: "",
    color: "",
    warranty: "",
    city: "Karachi",
    categoryId: "",
    subcategoryId: "",
    leafId: "",
    contactPhone: "",
  });
  const [extraAttrs, setExtraAttrs] = useState({});

  useEffect(() => {
    if (!isEdit || !editId) return;
    let cancelled = false;
    fetchAdById(editId, { viewerId: user?.uid }).then((ad) => {
      if (cancelled || !ad) return;
      setForm({
        title: ad.title || "",
        description: ad.description || "",
        price: String(ad.price || ""),
        negotiable: ad.negotiable || false,
        condition: ad.condition || "Used",
        brand: ad.brand || "",
        model: ad.model || "",
        year: ad.year || "",
        ram: "",
        storage: "",
        color: "",
        warranty: "",
        city: ad.city || ad.location || "Karachi",
        categoryId: ad.categoryId || "",
        subcategoryId: ad.subcategoryId || "",
        leafId: ad.leafId || "",
        contactPhone: ad.contactPhone || profile?.phone || "",
      });
      if (ad.attributes) setExtraAttrs(ad.attributes);
      if (ad.images?.length) {
        setImages(ad.images.map((url) => ({ url, publicId: "" })));
        setMainIndex(0);
      }
      setLoadingAd(false);
    });
    return () => { cancelled = true; };
  }, [isEdit, editId, user, profile]);

  const dynamicFields = useMemo(
    () => getFieldsForCategory(form.categoryId, form.subcategoryId),
    [form.categoryId, form.subcategoryId]
  );

  const subcategories = useMemo(() => {
    const cat = CATEGORY_TREE.find((c) => c.id === form.categoryId);
    return cat?.subcategories || [];
  }, [form.categoryId]);

  const leafCategories = useMemo(() => {
    const sub = subcategories.find((s) => s.id === form.subcategoryId);
    return sub?.subcategories || [];
  }, [form.categoryId, form.subcategoryId, subcategories]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!user) {
      router.push("/auth/login?redirect=/post-ad");
      return;
    }
    if (images.length < MIN_IMAGES) {
      setError(`Please upload at least ${MIN_IMAGES} images.`);
      return;
    }
    if (!form.categoryId || !form.title || !form.price || !form.description) {
      setError("Fill all required fields including category and title.");
      return;
    }

    const pathLabels = getCategoryPathLabels(form.categoryId, form.subcategoryId, form.leafId);
    const categoryName = pathLabels.join(" › ") || "General";

    setSubmitting(true);
    try {
      const imageUrls = images.map((i) => i.url);
      if (isEdit) {
        await updateAd(editId, {
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          negotiable: form.negotiable,
          condition: form.condition,
          brand: (extraAttrs.brand || form.brand || "").trim(),
          model: (extraAttrs.model || form.model || "").trim(),
          year: (extraAttrs.year || form.year || "").trim(),
          attributes: Object.fromEntries(
            dynamicFields
              .map((f) => [f.key, String(extraAttrs[f.key] || "").trim()])
              .filter(([k, v]) => v && !["brand", "model", "year"].includes(k.toLowerCase()))
          ),
          city: form.city,
          location: form.city,
          categoryId: form.categoryId,
          subcategoryId: form.subcategoryId || null,
          leafId: form.leafId || null,
          categoryName,
          images: imageUrls,
          mainImage: images[mainIndex]?.url || imageUrls[0],
          contactPhone: form.contactPhone || profile?.phone || "",
          status: "pending_approval",
        });
        router.push(`/ad/${editId}?posted=1&pending=1`);
      } else {
        const { id: adId } = await createAd(
          {
            title: form.title.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            negotiable: form.negotiable,
            condition: form.condition,
            brand: (extraAttrs.brand || form.brand || "").trim(),
            model: (extraAttrs.model || form.model || "").trim(),
            year: (extraAttrs.year || form.year || "").trim(),
            attributes: Object.fromEntries(
              dynamicFields
                .map((f) => [f.key, String(extraAttrs[f.key] || "").trim()])
                .filter(([k, v]) => v && !["brand", "model", "year"].includes(k.toLowerCase()))
            ),
            city: form.city,
            location: form.city,
            delivery: "Courier / parcel (included in escrow)",
            categoryId: form.categoryId,
            subcategoryId: form.subcategoryId || null,
            leafId: form.leafId || null,
            categoryName,
            images: imageUrls,
            mainImage: images[mainIndex]?.url || imageUrls[0],
            contactPhone: form.contactPhone || profile?.phone || "",
            sellerTrustRating: profile?.trustRating ?? 5,
            sellerName: profile?.displayName || user.displayName || "Seller",
          },
          user.uid
        );
        router.push(`/ad/${adId}?posted=1&pending=1`);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err.code || err.message) || `Failed to ${isEdit ? "update" : "post"} ad. Sign in + Firestore rules check karein.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth>
    <div className="tk-container max-w-3xl py-10">
      <div className="mb-8 flex items-center gap-3">
        {isEdit ? <Pencil className="h-10 w-10 text-cyan-600" /> : <PlusCircle className="h-10 w-10 text-cyan-600" />}
        <div>
          <h1 className="text-2xl font-black text-slate-900">{isEdit ? "Edit your ad" : "Post a new ad"}</h1>
          <p className="text-sm text-slate-600">{isEdit ? "Changes will be reviewed by TrustKar admin before going live." : "Escrow-ready · category-specific form · courier-friendly items"}</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-sky-700">
        Signed in as <strong>{profile?.displayName || user?.email}</strong>
      </p>

      <form onSubmit={handleSubmit} className="tk-card space-y-8">
        {/* Category */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Category *</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <SearchableDropdown
              value={form.categoryId}
              onChange={(v) =>
                setForm((f) => ({ ...f, categoryId: v, subcategoryId: "", leafId: "" }))
              }
              options={[
                { value: "", label: "Main category" },
                ...CATEGORY_TREE.map((c) => ({ value: c.id, label: c.name })),
              ]}
              placeholder="Main category"
              hoverOpen={false}
            />
            <SearchableDropdown
              value={form.subcategoryId}
              onChange={(v) => setForm((f) => ({ ...f, subcategoryId: v, leafId: "" }))}
              options={[
                { value: "", label: "Subcategory" },
                ...subcategories.map((s) => ({ value: s.id, label: s.name })),
              ]}
              placeholder="Subcategory"
              hoverOpen={false}
            />
            <SearchableDropdown
              value={form.leafId}
              onChange={(v) => update("leafId", v)}
              options={[
                { value: "", label: "Type" },
                ...leafCategories.map((l) => ({ value: l.id, label: l.name })),
              ]}
              placeholder="Type / model"
              hoverOpen={false}
            />
          </div>
          <p className="text-xs font-semibold text-amber-700">
            All listings are reviewed by TrustKar admin before they appear on the site.
          </p>
        </fieldset>

        {/* Images */}
        <fieldset>
          <legend className="mb-4 text-lg font-semibold text-slate-900">Photos *</legend>
          <ImageUploader
            images={images}
            setImages={setImages}
            mainIndex={mainIndex}
            setMainIndex={setMainIndex}
          />
        </fieldset>

        {/* Basic info */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Item details *</legend>
          <input
            required
            placeholder="Title (e.g. iPhone 14 Pro Max 256GB)"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <textarea
            required
            rows={5}
            placeholder="Full description — condition, accessories, reason for sale..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              type="number"
              min="1"
              placeholder="Price (PKR)"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={form.condition}
              onChange={(e) => update("condition", e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.negotiable}
              onChange={(e) => update("negotiable", e.target.checked)}
            />
            Price negotiable
          </label>
        </fieldset>

        {form.categoryId && form.subcategoryId && dynamicFields.length > 0 && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-slate-900">
              Details for this category
            </legend>
            <p className="text-xs text-slate-500">Only relevant fields for your selection — no random RAM/storage for wrong items.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {dynamicFields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-bold text-slate-600">{f.label}</label>
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    placeholder={f.placeholder}
                    value={extraAttrs[f.key] || ""}
                    onChange={(e) => setExtraAttrs((a) => ({ ...a, [f.key]: e.target.value }))}
                    className="tk-input"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-slate-900">Location</legend>
          <SearchableDropdown
            value={form.city}
            onChange={(v) => update("city", v)}
            options={CITIES.map((c) => ({ value: c, label: c }))}
            placeholder="City"
            hoverOpen={false}
          />
          <p className="text-xs text-slate-500">Courier / parcel delivery is included in TrustKar escrow — no separate shipping option.</p>
          <input
            placeholder="Contact phone"
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            className="tk-input"
          />
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isEdit && (
          <p className="text-sm font-bold text-amber-700">
            After saving, your ad will be sent for admin approval before it appears on the site.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || loadingAd}
          className="flex w-full items-center justify-center gap-2 rounded-xl tk-btn-primary w-full !py-3 disabled:opacity-50"
        >
          {submitting || loadingAd ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isEdit ? "Save changes & send for approval" : "Publish on TRUSTKAR"}
        </button>
      </form>
    </div>
    </RequireAuth>
  );
}

export default function PostAdPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>}>
      <PostAdInner />
    </Suspense>
  );
}
