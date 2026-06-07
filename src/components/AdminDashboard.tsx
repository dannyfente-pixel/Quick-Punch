import React, { useState } from "react";
import { Download, Users, Clock, CalendarRange, ClipboardCheck, Trash2, ShieldCheck, FileSpreadsheet, Search } from "lucide-react";
import { PunchRecord } from "../types.ts";
import { formatTime, formatDate, exportToCSVFile, exportToExcelFile } from "../lib/attendanceService.ts";

export function AdminDashboard({ 
  records, 
  onDeleteRecord, 
  onForceClockOut,
  timezone
}: { 
  records: PunchRecord[]; 
  onDeleteRecord: (id: string) => void;
  onForceClockOut: (id: string) => void;
  timezone?: string;
}) {
  const [adminSearch, setAdminSearch] = useState("");

  // Calculate metrics
  const activeToday = records.filter(r => r.clock_out_time === null).length;
  const totalPunches = records.length;
  
  const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const completedShifts = records.filter(r => r.clock_out_time !== null).length;

  // Aggregate Hours by Employee for the week/total
  const employeeAggregate: { [name: string]: number } = {};
  records.forEach(r => {
    if (r.total_hours) {
      employeeAggregate[r.employee_name] = (employeeAggregate[r.employee_name] || 0) + r.total_hours;
    }
  });

  const aggregateList = Object.entries(employeeAggregate)
    .map(([name, hours]) => ({ name, hours: Math.round(hours * 100) / 100 }))
    .sort((a, b) => b.hours - a.hours);

  // Maximum hours for scaling the chart
  const maxHours = Math.max(...aggregateList.map(e => e.hours), 1);

  // Filter for admin log table
  const filteredRecords = records.filter(r => 
    r.employee_name.toLowerCase().includes(adminSearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-8" id="admin-dashboard-root">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active staff */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            {activeToday > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {activeToday} Active
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-4">{activeToday}</p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Staff On Duty Now</p>
        </div>

        {/* Metric 2: Completed Shifts */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-4">{completedShifts}</p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Completed Shifts</p>
        </div>

        {/* Metric 3: Total Hours */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-4">
            {totalHours.toFixed(2)} <span className="text-xs font-bold text-slate-400">h</span>
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Cumulative Hours</p>
        </div>

        {/* Metric 4: Cumulative Punches */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-50 dark:bg-purple-950/30 text-purple-500 rounded-2xl">
            <CalendarRange className="w-6 h-6" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-4">{totalPunches}</p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">All Kiosk Registries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly hours chart side block */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 md:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Staff Standings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accumulated work hours by employee.
            </p>
          </div>

          {aggregateList.length > 0 ? (
            <div className="space-y-4">
              {aggregateList.map((emp, idx) => {
                const percentage = (emp.hours / maxHours) * 100;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {emp.name}
                      </span>
                      <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">
                        {emp.hours.toFixed(1)} hrs
                      </span>
                    </div>
                    {/* Visual Bar Graph */}
                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-200/20">
                      <div 
                        className="bg-indigo-500 dark:bg-indigo-400 h-full rounded-full transition-all duration-700" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-6">
              No accumulated hours logged yet.
            </p>
          )}
        </div>

        {/* Master Log & Export Area with Correction Commands */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden">
          {/* Top Panel Actions */}
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/25 dark:bg-slate-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                Administrative Punch Registry
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit, delete, manually close active entries, and compile reports.
              </p>
            </div>

            {/* Export buttons */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => exportToCSVFile(records, timezone)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => exportToExcelFile(records, timezone)}
                className="px-3.5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Search box within registry */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="relative rounded-xl w-full max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-medium"
                placeholder="Lookup employee punches..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="overflow-x-auto">
            {filteredRecords.length > 0 ? (
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Punches</th>
                    <th className="px-4 py-3 text-right">Hours</th>
                    <th className="px-6 py-3 text-right">Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850/50">
                  {filteredRecords.map((r) => {
                    const activeShift = r.clock_out_time === null;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-xs transition-all">
                        <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {r.employee_name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">
                          {r.clock_in_time ? formatDate(r.clock_in_time, timezone) : r.date}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                          <div className="flex flex-col gap-0.5">
                            <span>In: {formatTime(r.clock_in_time, timezone)}</span>
                            {activeShift ? (
                              <button
                                type="button"
                                onClick={() => onForceClockOut(r.id)}
                                className="text-[9px] font-extrabold text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-900/40 mt-1 cursor-pointer w-max"
                              >
                                Force Clock Out
                              </button>
                            ) : (
                              <span>Out: {formatTime(r.clock_out_time!, timezone)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold">
                          {activeShift ? (
                            <span className="text-amber-500">Active</span>
                          ) : (
                            <span>{r.total_hours?.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer inline-flex items-center justify-center align-middle"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-450 dark:text-slate-505 max-w-sm mx-auto">
                <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-400">No punches log match found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
