"use client";

import { Pen } from "lucide-react";

export default function FloatingLogButton() {
  const handleOpenCapture = () => {
    window.dispatchEvent(new CustomEvent("open-quick-capture"));
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
      <button
        onClick={handleOpenCapture}
        type="button"
        aria-label="Log activity"
        className="group relative flex items-center h-12 rounded-full bg-charcoal hover:bg-black text-white px-3.5 hover:px-5 transition-all duration-300 ease-out shadow-lg hover:shadow-xl active:scale-95 overflow-hidden"
      >
        <Pen className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
        <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap text-sm font-medium">
          Log Activity
        </span>
      </button>
    </div>
  );
}
