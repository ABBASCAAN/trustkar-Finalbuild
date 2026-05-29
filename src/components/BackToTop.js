"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-[calc(4.5rem+var(--safe-bottom))] right-4 z-40 hidden h-11 w-11 items-center justify-center rounded-full bg-sky-700 text-white shadow-lg transition hover:bg-sky-800 md:bottom-6 md:flex md:h-12 md:w-12"
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}
