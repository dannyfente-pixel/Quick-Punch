import { PunchRecord } from "../types.ts";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  getDocFromServer, 
  orderBy, 
  query, 
  deleteDoc, 
  addDoc
} from "firebase/firestore";
import { db, auth } from "./firebase.ts";

const STORAGE_KEY = "quickpunch_attendance_records";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Custom error logger complying with schema
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial seed data to make the app look mature and populated with records on first load
const SEED_RECORDS: PunchRecord[] = [
  {
    id: "punch_1",
    employee_name: "Sarah Jenkins",
    date: "2026-06-05",
    clock_in_time: "2026-06-05T08:02:14Z",
    clock_out_time: "2026-06-05T17:05:43Z",
    total_hours: 9.06
  },
  {
    id: "punch_2",
    employee_name: "Marcus Aurelius",
    date: "2026-06-05",
    clock_in_time: "2026-06-05T08:45:00Z",
    clock_out_time: "2026-06-05T16:30:00Z",
    total_hours: 7.75
  },
  {
    id: "punch_3",
    employee_name: "Diana Prince",
    date: "2026-06-05",
    clock_in_time: "2026-06-05T07:55:00Z",
    clock_out_time: "2026-06-05T17:00:00Z",
    total_hours: 9.08
  },
  {
    id: "punch_4",
    employee_name: "Sarah Jenkins",
    date: "2026-06-04",
    clock_in_time: "2026-06-04T08:00:00Z",
    clock_out_time: "2026-06-04T12:00:00Z",
    total_hours: 4.00
  },
  {
    id: "punch_5",
    employee_name: "Michael Scott",
    date: "2026-06-04",
    clock_in_time: "2026-06-04T09:15:30Z",
    clock_out_time: "2026-06-04T17:15:10Z",
    total_hours: 8.00
  },
  {
    id: "punch_6",
    employee_name: "Pam Beesly",
    date: "2026-06-04",
    clock_in_time: "2026-06-04T08:30:22Z",
    clock_out_time: "2026-06-04T17:03:15Z",
    total_hours: 8.55
  },
  {
    id: "punch_7",
    employee_name: "Jim Halpert",
    date: "2026-06-03",
    clock_in_time: "2026-06-03T08:50:00Z",
    clock_out_time: "2026-06-03T16:55:00Z",
    total_hours: 8.08
  }
];

// MANDATORY connection testing on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client appears to stand offline. Running with sync caches.");
    }
  }
}
testConnection();

// Fetch punches from Firestore (with automatic seeding if empty, and localStorage caching fallback)
export async function getPunches(): Promise<PunchRecord[]> {
  const collectionName = "punches";
  try {
    const q = query(collection(db, collectionName), orderBy("clock_in_time", "desc"));
    const querySnapshot = await getDocs(q);
    
    let dbRecords: PunchRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      dbRecords.push(docSnap.data() as PunchRecord);
    });

    // Seed empty databases on first launch with presentation data automatically
    if (dbRecords.length === 0) {
      console.log("Seeding Firestore with quick-start presentation punches...");
      for (const record of SEED_RECORDS) {
        await setDoc(doc(db, collectionName, record.id), record);
      }
      dbRecords = [...SEED_RECORDS];
    }

    // Backup to local storage cache for extreme robustness
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbRecords));
    return dbRecords;
  } catch (error) {
    console.warn("Unable to pull real-time punches. Reverting to persistent sync cache", error);
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    // Comply with strict error wrapping requirements
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

// Clock In an employee
export async function clockIn(employeeName: string): Promise<{ success: boolean; message: string; record?: PunchRecord }> {
  const normalized = employeeName.trim();
  if (!normalized) {
    return { success: false, message: "Please enter your name." };
  }

  const collectionName = "punches";
  try {
    const records = await getPunches();
    
    // Check for any active shifts registered right now
    const activePunch = records.find(
      r => r.employee_name.toLowerCase() === normalized.toLowerCase() && r.clock_out_time === null
    );

    if (activePunch) {
      return { 
        success: false, 
        message: `${normalized} is already clocked in! (Since ${formatTime(activePunch.clock_in_time)} today)` 
      };
    }

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const newId = "punch_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    
    const newRecord: PunchRecord = {
      id: newId,
      employee_name: normalized,
      date: dateStr,
      clock_in_time: now.toISOString(),
      clock_out_time: null,
      total_hours: null
    };

    // Save to Firestore
    await setDoc(doc(db, collectionName, newId), newRecord);

    // Update local storage backup immediately
    const updatedRecords = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

    return {
      success: true,
      message: "Successfully Clocked In",
      record: newRecord
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${normalized}`);
    return { success: false, message: "An error occurred during clock-in." };
  }
}

// Clock Out an employee
export async function clockOut(employeeName: string): Promise<{ success: boolean; message: string; record?: PunchRecord; durationDetail?: string }> {
  const normalized = employeeName.trim();
  if (!normalized) {
    return { success: false, message: "Please enter your name." };
  }

  const collectionName = "punches";
  try {
    const records = await getPunches();
    
    // Find the current active shift
    const activeIndex = records.findIndex(
      r => r.employee_name.toLowerCase() === normalized.toLowerCase() && r.clock_out_time === null
    );

    if (activeIndex === -1) {
      return { 
        success: false, 
        message: `No active work shift found for "${normalized}". Did you clock in?`
      };
    }

    const record = records[activeIndex];
    const now = new Date();
    
    // Calculate total hours
    const clockInDate = new Date(record.clock_in_time);
    const diffMs = now.getTime() - clockInDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    const roundedHours = Math.round(hours * 100) / 100;

    // Time representation details (e.g. 8 hrs 30 mins)
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const displayHrs = Math.floor(diffMins / 60);
    const displayMins = diffMins % 60;
    const durationStr = displayHrs > 0 
      ? `${displayHrs} hr${displayHrs > 1 ? "s" : ""} ${displayMins} min${displayMins > 1 ? "s" : ""}`
      : `${displayMins} min${displayMins > 1 ? "s" : ""}`;

    const updatedRecord: PunchRecord = {
      ...record,
      clock_out_time: now.toISOString(),
      total_hours: roundedHours
    };

    // Save update to Firestore
    await setDoc(doc(db, collectionName, record.id), updatedRecord);

    // Save to sync cache layer
    records[activeIndex] = updatedRecord;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    return {
      success: true,
      message: "Successfully Clocked Out",
      record: updatedRecord,
      durationDetail: durationStr
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${normalized}`);
    return { success: false, message: "An error occurred during clock-out." };
  }
}

// Administrative: Delete record
export async function deletePunch(id: string): Promise<void> {
  const collectionName = "punches";
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// Administrative: Force clock out an active shift
export async function forceClockOut(id: string): Promise<PunchRecord | null> {
  const collectionName = "punches";
  try {
    const qSnapshot = await getDocs(collection(db, collectionName));
    let originalRecord: PunchRecord | null = null;
    
    qSnapshot.forEach((docSnap) => {
      const data = docSnap.data() as PunchRecord;
      if (data.id === id) {
        originalRecord = data;
      }
    });

    if (!originalRecord) return null;

    const now = new Date();
    const clockInDate = new Date((originalRecord as PunchRecord).clock_in_time);
    const diffMs = now.getTime() - clockInDate.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    const updatedRecord: PunchRecord = {
      ...originalRecord,
      clock_out_time: now.toISOString(),
      total_hours: hours > 0 ? hours : 0.05
    };

    await setDoc(doc(db, collectionName, id), updatedRecord);
    return updatedRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
    return null;
  }
}

// Helper formats
export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoString;
  }
}

// Export logs to CSV file
export function exportToCSVFile(records: PunchRecord[]): void {
  const headers = ["ID", "Employee Name", "Date", "Clock In Time", "Clock Out Time", "Total Hours Worked"];
  
  const rows = records.map(r => [
    r.id,
    r.employee_name,
    r.date,
    r.clock_in_time ? formatTime(r.clock_in_time) : "",
    r.clock_out_time ? formatTime(r.clock_out_time) : "STILL CLOCKED IN",
    r.total_hours !== null ? r.total_hours.toFixed(2) : "0.00"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `quick_punch_attendance_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export logs formatted for Excel with UTF-8 BOM
export function exportToExcelFile(records: PunchRecord[]): void {
  const headers = ["Punch ID", "Employee Name", "Date", "Clock In", "Clock Out", "Hours Worked"];
  
  const rows = records.map(r => [
    r.id,
    r.employee_name,
    r.date,
    r.clock_in_time ? formatTime(r.clock_in_time) : "",
    r.clock_out_time ? formatTime(r.clock_out_time) : "ACTIVE SHIFT",
    r.total_hours !== null ? r.total_hours.toFixed(2) : "-"
  ]);

  const csvContent = "\uFEFF" + [  // BOM
    headers.join(","),
    ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `quick_punch_register_${new Date().toISOString().split('T')[0]}.xlsx`); 
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
