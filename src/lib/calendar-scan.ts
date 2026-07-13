// Reads Ariel's private iCal feed and works out which events are actually
// task reminders (vs real meetings), plus the Sunday "מחסנית" topic list.

const ARIEL_EMAIL = "ariel1w@gmail.com";

export interface ScannedEvent {
  eventId: string;
  title: string;
  startAt: Date;
  category: string;
}

export interface ScanResult {
  candidates: ScannedEvent[]; // task reminders -> suggestion inbox
  yoavTopics: string[]; // from the מחסנית -> "For Yoav" tab
}

/** Unfold RFC5545 continuation lines (a leading space continues the line). */
function unfold(ics: string): string[] {
  const out: string[] = [];
  for (const line of ics.split(/\r?\n/)) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function unescapeText(v: string): string {
  return v
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function emailFrom(value: string): string {
  const m = value.match(/mailto:([^\s;:]+)/i);
  return (m ? m[1] : "").toLowerCase();
}

/** Parse DTSTART into a Date. Returns null for all-day events (we skip those). */
function parseStart(rawKey: string, value: string): Date | null {
  if (/VALUE=DATE(?!-TIME)/i.test(rawKey)) return null; // all-day
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    const y = +value.slice(0, 4),
      mo = +value.slice(4, 6) - 1,
      d = +value.slice(6, 8);
    const h = +value.slice(9, 11),
      mi = +value.slice(11, 13),
      s = +value.slice(13, 15);
    return new Date(Date.UTC(y, mo, d, h, mi, s));
  }
  if (/^\d{8}T\d{6}$/.test(value)) {
    // Floating/TZID local time — Israel is UTC+3 in summer.
    const y = +value.slice(0, 4),
      mo = +value.slice(4, 6) - 1,
      d = +value.slice(6, 8);
    const h = +value.slice(9, 11),
      mi = +value.slice(11, 13),
      s = +value.slice(13, 15);
    return new Date(Date.UTC(y, mo, d, h - 3, mi, s));
  }
  return null;
}

function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (/מיוצג|סוכן|אילן|גאני/.test(title)) return "clients";
  if (/אות קין|פרוייקט|פרויקט|דק |פיץ|סקריפט|תסריט/.test(title)) return "projects";
  if (/פולו ?אפ|followup|follow up|קונטקט|קונקט|לכתוב ל|לדבר עם|לשאול/.test(t + title))
    return "contacts";
  if (/אירוע|מסיבה|הקרנה|פרמיירה|כנס|צילומים/.test(title)) return "events";
  return "admin";
}

export function parseIcs(ics: string, now = new Date()): ScanResult {
  const lines = unfold(ics);
  const candidates: ScannedEvent[] = [];
  let yoavTopics: string[] = [];
  let bestManifestTime = -Infinity;

  const from = now.getTime() - 2 * 86400000; // small look-back
  const to = now.getTime() + 21 * 86400000;

  let inEvent = false;
  let uid = "",
    summary = "",
    description = "",
    organizer = "";
  let start: Date | null = null;
  let attendees: string[] = [];

  const reset = () => {
    uid = summary = description = organizer = "";
    start = null;
    attendees = [];
  };

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      reset();
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      finish();
      continue;
    }
    if (!inEvent) continue;

    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const rawKey = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = rawKey.split(";")[0].toUpperCase();

    if (key === "UID") uid = value.trim();
    else if (key === "SUMMARY") summary = unescapeText(value).trim();
    else if (key === "DESCRIPTION") description = unescapeText(value);
    else if (key === "ORGANIZER") organizer = emailFrom(rawKey + ":" + value);
    else if (key === "ATTENDEE") attendees.push(emailFrom(rawKey + ":" + value));
    else if (key === "DTSTART") start = parseStart(rawKey, value.trim());
  }

  function finish() {
    if (!uid || !summary || !start) return; // no title / all-day -> skip
    const t = start.getTime();
    if (t < from || t > to) return;

    // Google's iCal UID is "<eventId>@google.com" — normalise so dedup matches
    // the IDs already stored from the API scan.
    const eventId = uid.split("@")[0];

    // Auto-generated Gmail events ("Stay at ...") are not reminders.
    if (/automatically created|g\.co\/calendar/i.test(description)) return;

    // A real meeting: someone else organises it, or other people are invited.
    if (organizer && organizer !== ARIEL_EMAIL) return;
    if (attendees.some((a) => a && a !== ARIEL_EMAIL)) return;

    // Conferencing => a meeting, not a to-do.
    if (/zoom\.us|meet\.google\.com|teams\.microsoft/i.test(description)) return;

    // The מחסנית: Ariel's Sunday topic list — a comma-separated run of subjects.
    // It feeds the "For Yoav" tab, never the task inbox.
    const commas = (summary.match(/,/g) || []).length;
    if (commas >= 3) {
      if (t > bestManifestTime) {
        bestManifestTime = t;
        yoavTopics = summary
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return;
    }

    candidates.push({
      eventId,
      title: summary,
      startAt: start,
      category: guessCategory(summary),
    });
  }

  return { candidates, yoavTopics };
}
