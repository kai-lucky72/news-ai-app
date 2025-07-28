"use client";

export default function Header() {
  return (
    <header className="w-full px-8 py-4 flex items-center justify-between bg-white shadow border-b border-gray-100 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <span className="text-3xl font-heading font-extrabold tracking-tight text-primary italic drop-shadow-sm">Parrot</span>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-1 rounded border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition">Sign In</button>
        <button className="px-4 py-1 rounded bg-primary text-white font-semibold hover:bg-accent transition">Subscribe</button>
      </div>
    </header>
  );
} 