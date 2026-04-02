"use client";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] font-sans">
      {/* Logo + Name */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-[#1a3a4a] rounded-xl flex items-center justify-center shadow-md">
          <span className="text-white text-2xl font-bold">S</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#1a3a4a] tracking-tight">
          Sajilo Baas
        </h1>
      </div>

      {/* Progress Bar */}
      <div className="mt-12 w-60 h-1.5 bg-slate-100 rounded-lg overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full bg-[#1a3a4a] animate-progress-bar rounded-lg"></div>
      </div>

      {/* Subtext */}
      <p className="mt-5 text-sm text-slate-400 font-medium tracking-wider">
        NEPAL STAYS
      </p>
    </div>
  );
}
