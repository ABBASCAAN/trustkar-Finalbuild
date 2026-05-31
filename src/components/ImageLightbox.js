"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export default function ImageLightbox({
  images = [],
  activeIndex = 0,
  onClose,
  onChangeIndex,
  title = "",
}) {
  const go = useCallback(
    (dir) => {
      if (!images.length) return;
      const next = (activeIndex + dir + images.length) % images.length;
      onChangeIndex?.(next);
    },
    [activeIndex, images.length, onChangeIndex]
  );

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [activeIndex]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    function preventScroll(e) {
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${window.scrollY}px`;
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    };
  }, [go, onClose]);

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => {
      const next = Math.min(5, Math.max(1, prev + delta));
      if (next === 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }

  function onMouseDown(e) {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  }

  function onMouseMove(e) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({ x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
  }

  function onMouseUp() {
    setDragging(false);
  }

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/95 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image zoom"
    >
      <div
        className="relative flex w-full max-w-5xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="mb-2 flex w-full items-center justify-between">
          <span className="text-sm font-bold text-slate-500">
            {activeIndex + 1} / {images.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setScale((s) => Math.min(5, s + 0.3)); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setScale((s) => Math.max(1, s - 0.3)); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setScale(1); setTranslate({ x: 0, y: 0 }); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              aria-label="Reset"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main image viewer with zoom + pan */}
        <div
          ref={containerRef}
          className="relative aspect-video w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: dragging ? "grabbing" : scale > 1 ? "grab" : "default" }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transition: dragging ? "none" : "transform 0.15s ease-out",
            }}
          >
            <Image
              src={images[activeIndex]}
              alt={title || "Product"}
              fill
              className="object-contain"
              unoptimized
              priority
              draggable={false}
            />
          </div>

          {/* Nav arrows */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Scroll to zoom · Drag to pan when zoomed
        </p>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChangeIndex?.(i)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === activeIndex ? "border-slate-800 opacity-100" : "border-transparent opacity-50"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
