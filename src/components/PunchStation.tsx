import React, { useState, useRef, useEffect } from "react";
import { UserCheck, LogIn, LogOut, CheckCircle, Clock, AlertTriangle, ArrowRight, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clockIn, clockOut, formatTime, getPunches } from "../lib/attendanceService.ts";

export function PunchStation({ onPunchSuccess }: { onPunchSuccess: () => void }) {
  const [employeeName, setEmployeeName] = useState("");
  const [lastPunchedName, setLastPunchedName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Success states
  const [successState, setSuccessState] = useState<{
    show: boolean;
    type: "in" | "out" | null;
    name: string;
    date: string;
    time: string;
    outTime?: string;
    durationDetail?: string;
  }>({
    show: false,
    type: null,
    name: "",
    date: "",
    time: "",
  });

  const [recentNames, setRecentNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load a list of unique recent employee names to aid fast typing/autocomplete
  const updateRecentNames = async () => {
    try {
      const records = await getPunches();
      const names = Array.from(new Set(records.map(r => r.employee_name)))
        .slice(0, 5); // top 5 unique names
      setRecentNames(names);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    updateRecentNames();
  }, [successState.show]);

  // Handle auto-clearing success card after 5 seconds to reset kiosk for next worker
  useEffect(() => {
    if (successState.show) {
      const timer = setTimeout(() => {
        handleReset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successState.show]);

  const handleReset = () => {
    setSuccessState({
      show: false,
      type: null,
      name: "",
      date: "",
      time: "",
    });
    setEmployeeName("");
    setErrorMessage("");
    // Re-focus input for next employee
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleClockIn = async () => {
    const name = employeeName.trim();
    if (!name) {
      setErrorMessage("Please enter your name to clock in.");
      return;
    }

    const result = await clockIn(name);
    if (result.success && result.record) {
      setSuccessState({
        show: true,
        type: "in",
        name: result.record.employee_name,
        date: result.record.date,
        time: formatTime(result.record.clock_in_time),
      });
      setLastPunchedName(result.record.employee_name);
      setErrorMessage("");
      onPunchSuccess();
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleClockOut = async () => {
    const name = employeeName.trim();
    if (!name) {
      setErrorMessage("Please enter your name to clock out.");
      return;
    }

    const result = await clockOut(name);
    if (result.success && result.record) {
      setSuccessState({
        show: true,
        type: "out",
        name: result.record.employee_name,
        date: result.record.date,
        time: formatTime(result.record.clock_in_time),
        outTime: formatTime(result.record.clock_out_time!),
        durationDetail: result.durationDetail,
      });
      setLastPunchedName(result.record.employee_name);
      setErrorMessage("");
      onPunchSuccess();
    } else {
      setErrorMessage(result.message);
    }
  };

  // Quick select helper
  const handleSelectRecentName = (name: string) => {
    setEmployeeName(name);
    setErrorMessage("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" id="punch-station-root">
      <AnimatePresence mode="wait">
        {!successState.show ? (
          <motion.div
            key="punch-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Punch Station Terminal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Type your name below to register your current shift status.
                </p>
              </div>

              {/* Form Content */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Input with large touch-friendly target */}
                <div className="space-y-2">
                  <label htmlFor="employee-name-input" className="block text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Your Full Name
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserCheck className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <input
                      id="employee-name-input"
                      ref={inputRef}
                      type="text"
                      className="block w-full pl-12 pr-4 py-4 md:py-5 text-base md:text-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 focus:border-indigo-500 font-medium transition-all"
                      placeholder="e.g. Sarah Jenkins"
                      value={employeeName}
                      onChange={(e) => {
                        setEmployeeName(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          // Prevent random default triggers
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-medium"
                    id="punch-error-banner"
                  >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </motion.div>
                )}

                {/* Touch helper: Recent workers */}
                {recentNames.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Quick Touch Autocomplete
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {recentNames.map((name, i) => (
                        <button
                          key={i}
                          type="button"
                          className="px-3.5 py-2 text-xs md:text-sm font-semibold bg-indigo-50/50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 active:scale-95 border border-indigo-100/50 dark:border-indigo-900/30 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
                          onClick={() => handleSelectRecentName(name)}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Large Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    id="clock-in-btn"
                    onClick={handleClockIn}
                    type="button"
                    className="relative py-4 md:py-5 px-6 rounded-2xl flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-500 active:from-emerald-700 active:to-teal-600 text-white font-extrabold text-base md:text-lg shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer group overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <LogIn className="w-6 h-6 z-10 transition-transform group-hover:translate-x-0.5" />
                    <span className="relative z-10">Clock In</span>
                  </button>

                  <button
                    id="clock-out-btn"
                    onClick={handleClockOut}
                    type="button"
                    className="relative py-4 md:py-5 px-6 rounded-2xl flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-pink-500 active:from-rose-700 active:to-pink-600 text-white font-extrabold text-base md:text-lg shadow-lg shadow-rose-500/20 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer group overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <LogOut className="w-6 h-6 z-10 transition-transform group-hover:translate-x-0.5" />
                    <span className="relative z-10">Clock Out</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* SUCCESS SCREEN OVERLAY */
          <motion.div
            key="punch-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg mx-auto"
          >
            <div 
              className={`rounded-3xl border shadow-2xl p-8 text-center bg-white dark:bg-slate-900 ${
                successState.type === "in" 
                  ? "border-emerald-100 dark:border-emerald-950 shadow-emerald-500/5" 
                  : "border-rose-100 dark:border-rose-950 shadow-rose-500/5"
              }`}
              id="success-punch-card"
            >
              {/* Visual Icon Header */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`p-4 rounded-full ${
                    successState.type === "in" 
                      ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-400" 
                      : "bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400"
                  }`}
                >
                  {successState.type === "in" ? (
                    <CheckCircle className="w-16 h-16" />
                  ) : (
                    <LogIn className="w-16 h-16 rotate-180" strokeWidth={1.5} />
                  )}
                </motion.div>
              </div>

              {/* Success Main Banner */}
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-50 tracking-tight">
                {successState.type === "in" ? "Successfully Clocked In!" : "Successfully Clocked Out!"}
              </h3>

              <div className="mt-4 space-y-4">
                {/* Employee Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Employee
                  </span>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                    {successState.name}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50/65 dark:bg-slate-950/45 rounded-xl border border-slate-100/50 dark:border-slate-800/40 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Date
                    </span>
                    <span className="text-xs md:text-sm font-extrabold text-slate-700 dark:text-slate-300">
                      {successState.date}
                    </span>
                  </div>

                  {successState.type === "in" ? (
                    <div className="p-3.5 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/30 dark:border-emerald-900/20 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block mb-1">
                        Clock In Time
                      </span>
                      <span className="text-xs md:text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        {successState.time}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-rose-50/30 dark:bg-rose-950/10 rounded-xl border border-rose-100/30 dark:border-rose-900/20 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                        Clock Out Time
                      </span>
                      <span className="text-xs md:text-sm font-extrabold text-rose-700 dark:text-rose-400">
                        {successState.outTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Extracted stats for Clock-outs (Total Hours Worked info box) */}
                {successState.type === "out" && successState.durationDetail && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/10 dark:to-pink-950/10 rounded-2xl border border-rose-100/70 dark:border-rose-900/30"
                  >
                    <div className="flex justify-between items-center text-left">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 block">
                          Total Worked Today
                        </span>
                        <span className="text-base font-black text-rose-700 dark:text-rose-400">
                          {successState.durationDetail}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Clock In
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {successState.time}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions & Auto countdown helper */}
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-black font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Ready for Next Punch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-slate-400 tracking-wide block animate-pulse">
                  Kiosk auto-reset in 5 seconds...
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
