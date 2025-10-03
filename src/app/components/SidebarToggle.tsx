"use client";
import { useSidebar } from "./SidebarProvider";

export default function SidebarToggle() {
  const { isOpen, toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md hover:bg-white/10 transition-colors"
      aria-label="Toggle sidebar"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isOpen ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
}
