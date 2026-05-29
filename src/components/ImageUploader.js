"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Upload, Star, X, Loader2 } from "lucide-react";
import { uploadImagesToCloudinary } from "@/lib/cloudinary";

const MIN_IMAGES = 4;
const MAX_IMAGES = 8;

export default function ImageUploader({ images, setImages, mainIndex, setMainIndex }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onFiles = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }

      const toAdd = files.slice(0, remaining);
      setError("");
      setUploading(true);

      try {
        const uploaded = await uploadImagesToCloudinary(toAdd, { folder: "trustkar/ads" });
        const newItems = uploaded.map((u) => ({
          url: u.secureUrl,
          publicId: u.publicId,
        }));
        setImages((prev) => [...prev, ...newItems]);
        if (images.length === 0 && newItems.length) setMainIndex(0);
      } catch (err) {
        setError(err.message || "Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [images.length, setImages, setMainIndex]
  );

  function removeAt(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    if (mainIndex === i) setMainIndex(0);
    else if (mainIndex > i) setMainIndex(mainIndex - 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Photos ({images.length}/{MAX_IMAGES}) — min {MIN_IMAGES}
        </label>
        {uploading && (
          <span className="flex items-center gap-1 text-sm text-sky-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div
            key={img.publicId || img.url}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
              mainIndex === i ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"
            }`}
          >
            <Image src={img.url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white"
            >
              <X className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setMainIndex(i)}
              className={`absolute bottom-1 left-1 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs ${
                mainIndex === i ? "bg-amber-400 text-slate-900" : "bg-black/50 text-white"
              }`}
            >
              <Star className="h-3 w-3" />
              {mainIndex === i ? "Main" : "Set main"}
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50">
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="mt-2 text-xs text-slate-500">Add photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onFiles}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {images.length > 0 && images.length < MIN_IMAGES && (
        <p className="text-sm text-amber-600">Add at least {MIN_IMAGES - images.length} more image(s).</p>
      )}
    </div>
  );
}

export { MIN_IMAGES, MAX_IMAGES };
