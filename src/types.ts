export interface PunchRecord {
  id: string;
  employee_name: string;
  date: string; // YYYY-MM-DD
  clock_in_time: string; // ISO String (e.g., "2026-06-06T08:00:00Z")
  clock_out_time: string | null; // ISO String or null (e.g., "2026-06-06T17:00:00Z")
  total_hours: number | null; // Decimal numeric value (e.g., 9.00)
}

export interface AttendanceStats {
  activeToday: number;
  totalPunches: number;
  totalHours: number;
  completedShifts: number;
}

