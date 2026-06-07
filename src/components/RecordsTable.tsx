import React, { useState } from "react";
import { Search, RotateCcw, Building2, User, Clock, Calendar, Check, Play } from "lucide-react";
import { PunchRecord } from "../types.ts";
import { formatTime, formatDate } from "../lib/attendanceService.ts";

export function RecordsTable({ records }: { records: PunchRecord[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = records.filter(r => 
    r.employee_name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden" id="attendance-records-root">
      {/* Header Panel */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-50/20 to-violet-50/10 dark:from-indigo-950/20 dark:to-violet-950/10 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Attendance Log
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime punch-in records and shift duration tracking.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative rounded-2xl w-full md:max-w-xs shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center hover:text-indigo-600 transition-colors text-slate-400 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {filtered.length > 0 ? (
          <table className="w-full text-left border-collapse" id="records-table">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/80 text-nowrap">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Employee Name
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Date
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Clock In
                </th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Clock Out
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">
                  Hours Worked
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filtered.map((record) => {
                const isWorking = record.clock_out_time === null;
                return (
                  <tr 
                    key={record.id}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-950/30 transition-colors group"
                  >
                    {/* Name column */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                          {record.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {record.employee_name}
                          </span>
                          {isWorking && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Shift
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date column */}
                    <td className="px-5 py-4.5 text-xs text-slate-600 dark:text-slate-400 font-semibold text-nowrap">
                      {formatDate(record.clock_in_time)}
                    </td>

                    {/* Clock In column */}
                    <td className="px-5 py-4.5 text-xs font-mono text-slate-700 dark:text-slate-300 text-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-emerald-500" />
                        {formatTime(record.clock_in_time)}
                      </div>
                    </td>

                    {/* Clock Out column */}
                    <td className="px-5 py-4.5 text-xs font-mono text-slate-700 dark:text-slate-300 text-nowrap">
                      {isWorking ? (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100/30 dark:border-amber-900/20 rounded-full">
                          On Duty
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-rose-500" />
                          {formatTime(record.clock_out_time!)}
                        </div>
                      )}
                    </td>

                    {/* Hours Worked column */}
                    <td className="px-6 py-4.5 text-right font-mono">
                      {isWorking ? (
                        <span className="text-xs text-slate-400 italic">Calculating...</span>
                      ) : (
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {record.total_hours?.toFixed(2)}{" "}
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">hrs</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-bold text-base">No punches found</p>
            <p className="text-xs text-slate-400 mt-1">Try searching for another employee name.</p>
          </div>
        )}
      </div>
    </div>
  );
}
