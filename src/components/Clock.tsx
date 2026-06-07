import React, { useState, useEffect } from "react";
import { Clock as ClockIcon, Calendar } from "lucide-react";

export function Clock({ timezone }: { timezone?: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: timezone && timezone !== "local" ? timezone : undefined,
  });

  const dateStr = time.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone && timezone !== "local" ? timezone : undefined,
  });

  // User-friendly display label for timezones
  const tzLabel = !timezone || timezone === "local" 
    ? "Local Time" 
    : timezone.replace("_", " ").split("/").pop() || timezone;

  return (
    <div 
      className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-inner"
      id="live-clock-container"
    >
      <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold uppercase tracking-widest mb-3">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
        Live Kiosk Time ({tzLabel})
      </div>

      {/* Large Digit Clock */}
      <h1 
        className="text-5xl md:text-6xl font-black tracking-tight text-slate-800 dark:text-white font-mono select-none drop-shadow-sm flex items-center gap-2"
        id="live-clock-time"
      >
        <ClockIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse hidden md:inline" />
        {timeStr}
      </h1>

      {/* Calendar Date descriptor */}
      <p 
        className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5"
        id="live-clock-date"
      >
        <Calendar className="w-4 h-4 text-indigo-500" />
        {dateStr}
      </p>
    </div>
  );
}
