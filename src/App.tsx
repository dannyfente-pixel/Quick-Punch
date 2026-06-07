/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Clock as ClockIcon, 
  ClipboardList, 
  Settings, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Lock, 
  Unlock,
  Building,
  KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Clock } from "./components/Clock.tsx";
import { Logo } from "./components/Logo.tsx";
import { PunchStation } from "./components/PunchStation.tsx";
import { RecordsTable } from "./components/RecordsTable.tsx";
import { AdminDashboard } from "./components/AdminDashboard.tsx";
import { PunchRecord } from "./types.ts";
import { getPunches, deletePunch, forceClockOut } from "./lib/attendanceService.ts";

export default function App() {
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [currentTab, setCurrentTab] = useState<"punch" | "logs" | "admin">("punch");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("quickpunch_theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // PIN code dialog for entering Admin panel
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const ADMIN_PIN = "1234";

  // Load and synchronize state on boots
  const syncRecords = async () => {
    try {
      const punchData = await getPunches();
      setRecords(punchData);
    } catch (e) {
      console.error("Failed to sync punches: ", e);
    }
  };

  useEffect(() => {
    syncRecords();
  }, []);

  // Sync dark theme classes on document body
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("quickpunch_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("quickpunch_theme", "light");
    }
  }, [darkMode]);

  // Handle click on admin tab
  const handleTabClick = (tab: "punch" | "logs" | "admin") => {
    if (tab === "admin") {
      setShowPinPrompt(true);
      setPinInput("");
      setPinError("");
    } else {
      setCurrentTab(tab);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setShowPinPrompt(false);
      setCurrentTab("admin");
      setPinError("");
    } else {
      setPinError("Invalid PIN Code. Please try again.");
    }
  };

  // Administration actions
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee punch record irrevocably?")) {
      try {
        await deletePunch(id);
        await syncRecords();
      } catch (e) {
        console.error("Failed to delete punch: ", e);
      }
    }
  };

  const handleForceClockOut = async (id: string) => {
    try {
      await forceClockOut(id);
      await syncRecords();
    } catch (e) {
      console.error("Failed to force clock out: ", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-all duration-300">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2">
            <nav className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40 shadow-inner">
              <button
                type="button"
                id="tab-kiosk"
                onClick={() => setCurrentTab("punch")}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === "punch"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm"
                    : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Punch Kiosk</span>
              </button>

              <button
                type="button"
                id="tab-logs"
                onClick={() => setCurrentTab("logs")}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === "logs"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm"
                    : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Log</span>
              </button>

              <button
                type="button"
                id="tab-admin"
                onClick={() => handleTabClick("admin")}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === "admin"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm"
                    : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
                {currentTab === "admin" ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </nav>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-slate-800/80 active:scale-95 transition-all cursor-pointer"
              title="Toggle Theme"
              id="theme-toggler"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* PRIMARY CENTRAL SCREEN LAYOUT */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <AnimatePresence mode="wait">
          {/* Punch Tab */}
          {currentTab === "punch" && (
            <motion.div
              key="punch-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Giant Clock Header */}
              <Clock />

              {/* Central punch panel */}
              <PunchStation onPunchSuccess={syncRecords} />
            </motion.div>
          )}

          {/* Logs Tab */}
          {currentTab === "logs" && (
            <motion.div
              key="logs-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RecordsTable records={records} />
            </motion.div>
          )}

          {/* Admin Tab */}
          {currentTab === "admin" && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboard 
                records={records}
                onDeleteRecord={handleDeleteRecord}
                onForceClockOut={handleForceClockOut}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER AREA */}
      <footer className="py-6 border-t border-slate-100 dark:border-slate-900 bg-white/50 dark:bg-slate-950/20 text-center text-xs text-slate-450 dark:text-slate-505 select-none space-y-1">
        <p>© 2026 Quick Punch Inc. All rights reserved.</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Created by Danial Fente</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
          Contact: Mihiret Alemayehu • <a href="tel:+251918067414" className="text-indigo-500 dark:text-indigo-400 hover:underline font-mono">+251918067414</a>
        </p>
      </footer>

      {/* ADMIN PIN CODE ENTRANCE DIALOG */}
      <AnimatePresence>
        {showPinPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-sm"
              id="admin-pin-dialog"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <KeyRound className="w-8 h-8" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-50">
                Unlock Administrative Panel
              </h3>
              <p className="text-xs text-slate-400 text-center mt-1">
                A verification passcode is required to guard the attendance logs from unauthorized edits.
              </p>

              <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
                <div>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    className="block w-full py-3.5 px-4 text-center font-mono text-2xl font-black tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 focus:border-indigo-500"
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError("");
                    }}
                    autoFocus
                  />
                  {pinError && (
                    <span className="text-[11px] font-bold text-rose-500 block text-center mt-2">
                      {pinError}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/10 rounded-xl text-[11px] text-center font-bold text-slate-500 dark:text-slate-450">
                  Default Passcode: <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs font-black">1234</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPinPrompt(false)}
                    className="py-3 px-4 rounded-xl text-xs font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Verify Passcode
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
