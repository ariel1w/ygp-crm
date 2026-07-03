import { startOfWeek, endOfWeek, addWeeks, format, getYear, getMonth } from "date-fns";

export interface WeekInfo {
  key: string; // "2026-W27" etc
  label: string; // "30.6-4.7"
  start: Date;
  end: Date;
  month: number; // 0-11
  year: number;
}

const MONTH_NAMES_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function getMonthName(month: number): string {
  return MONTH_NAMES_HE[month];
}

export function generateWeeks(startYear: number, endYear: number): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  // Start from first Sunday of startYear
  let current = startOfWeek(new Date(startYear, 0, 1), { weekStartsOn: 0 });
  const end = new Date(endYear + 1, 0, 1);

  while (current < end) {
    const weekEnd = endOfWeek(current, { weekStartsOn: 0 });
    const label = `${format(current, "d.M")}-${format(weekEnd, "d.M")}`;
    const key = `${getYear(current)}-W${format(current, "ww")}`;

    weeks.push({
      key,
      label,
      start: current,
      end: weekEnd,
      // Use the month of the week's Thursday (ISO convention for which month a week belongs to)
      month: getMonth(addWeeks(current, 0)),
      year: getYear(current),
    });

    current = addWeeks(current, 1);
  }

  return weeks;
}

// Map old week names like "31.5-4.6" to a WeekInfo key
export function matchOldWeekToKey(oldWeek: string, allWeeks: WeekInfo[]): string | null {
  // Parse the start date from old format like "31.5-4.6" or "28.06-02.07"
  const match = oldWeek.match(/(\d{1,2})[./](\d{1,2})/);
  if (!match) return null;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // 0-indexed

  // Find the week that contains this date
  for (const w of allWeeks) {
    const d = new Date(2026, month, day);
    if (d >= w.start && d <= w.end) {
      return w.key;
    }
  }
  return null;
}
