import { AnalysisResult } from "./types";

const STORAGE_KEY = "beforebuy_scan_history_v1";
const MAX_HISTORY_ITEMS = 25;

export function loadScanHistory(): AnalysisResult[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Failed to read scan history from localStorage", err);
    return [];
  }
}

export function saveScanToHistory(scan: AnalysisResult): AnalysisResult[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const current = loadScanHistory();
    // Filter out if duplicate ID exists
    const filtered = current.filter((item) => item.id !== scan.id);
    const updated = [scan, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to write scan to localStorage", err);
    return [];
  }
}

export function deleteScanFromHistory(id: string): AnalysisResult[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const current = loadScanHistory();
    const updated = current.filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to delete scan from localStorage", err);
    return [];
  }
}

export function clearScanHistory(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear scan history from localStorage", err);
  }
}
