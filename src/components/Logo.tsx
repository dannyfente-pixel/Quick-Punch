import React from "react";

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} id="app-logo">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-600/20 text-white font-black overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-violet-500 opacity-100 transition-opacity" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 relative z-10 animate-pulse"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
          Quick<span className="text-indigo-600 dark:text-indigo-400">Punch</span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Kiosk Terminal
        </span>
      </div>
    </div>
  );
}
