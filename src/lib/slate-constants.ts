export const STAGES = [
  { key: "development", label: "In Development", labelHe: "בפיתוח" },
  { key: "production", label: "In Production", labelHe: "בהפקה" },
  { key: "sales", label: "In Sales", labelHe: "במכירה" },
  { key: "reality", label: "Reality / Docu", labelHe: "ריאליטי/דוקו" },
  { key: "library", label: "Library", labelHe: "ספריה" },
] as const;

export const GENRES = ["דרמה", "קומדיה", "דרמה קומית", "פשע", "דוקו-ריאליטי"];

export const FORMATS = [
  "סיטקום", "דרמה", "קומדיה", "סרט דרמה", "סרט", "דוקו-ריאליטי",
  "שיחות באולפן", "תכנית ראיונות", "תוכנית תיעודית קומית",
  "תוכנית בידור קומדת", "תוכנית אירוח",
];

export const BROADCASTERS = [
  "כאן", "הוט", "רשת", "יס", "קשת", "פוקס", "16",
  "רשת + הוט", "נטפליקס",
];

export const PRODUCTION_STATUSES = ["פרה- פרודקשן", "בצילומים", "פוסט- פרודקשן"];

export const LOCATIONS = ["ישראל", "הונגריה"];

// Columns per stage
export const STAGE_COLUMNS: Record<string, { key: string; label: string; type: "text" | "select"; options?: string[] }[]> = {
  development: [
    { key: "name", label: "Project", type: "text" },
    { key: "creator", label: "Creator", type: "text" },
    { key: "format", label: "Format", type: "select", options: FORMATS },
    { key: "episodeLength", label: "Ep. Length", type: "text" },
    { key: "genre", label: "Genre", type: "select", options: GENRES },
    { key: "keyPeople", label: "Key People", type: "text" },
    { key: "broadcaster", label: "Broadcaster", type: "select", options: BROADCASTERS },
    { key: "status", label: "Status", type: "text" },
  ],
  production: [
    { key: "name", label: "Project", type: "text" },
    { key: "creator", label: "Creator", type: "text" },
    { key: "format", label: "Format", type: "select", options: FORMATS },
    { key: "broadcaster", label: "Broadcaster", type: "select", options: BROADCASTERS },
    { key: "shootingDates", label: "Shooting Dates", type: "text" },
    { key: "locations", label: "Locations", type: "select", options: LOCATIONS },
    { key: "status", label: "Status", type: "select", options: PRODUCTION_STATUSES },
    { key: "nextStep", label: "Next Step", type: "text" },
    { key: "priority", label: "Priority", type: "text" },
  ],
  sales: [
    { key: "name", label: "Project", type: "text" },
    { key: "broadcaster", label: "Broadcaster", type: "select", options: BROADCASTERS },
    { key: "contact", label: "Contact", type: "text" },
    { key: "status", label: "Status", type: "text" },
    { key: "whereAired", label: "Where Aired", type: "text" },
    { key: "distributor", label: "Distributor", type: "text" },
    { key: "nextStep", label: "Next Step", type: "text" },
    { key: "priority", label: "Priority", type: "text" },
  ],
  reality: [
    { key: "name", label: "Project", type: "text" },
    { key: "creator", label: "Creator", type: "text" },
    { key: "format", label: "Format", type: "select", options: FORMATS },
    { key: "broadcaster", label: "Broadcaster", type: "select", options: BROADCASTERS },
    { key: "shootingDates", label: "Shooting Dates", type: "text" },
    { key: "locations", label: "Locations", type: "select", options: LOCATIONS },
    { key: "status", label: "Status", type: "select", options: PRODUCTION_STATUSES },
    { key: "nextStep", label: "Next Step", type: "text" },
    { key: "priority", label: "Priority", type: "text" },
  ],
  library: [
    { key: "name", label: "Project", type: "text" },
    { key: "creator", label: "Creators", type: "text" },
    { key: "broadcaster", label: "Broadcaster", type: "select", options: BROADCASTERS },
    { key: "status", label: "Status", type: "text" },
    { key: "whereAired", label: "Where Aired", type: "text" },
    { key: "distributor", label: "Distributor", type: "text" },
    { key: "nextStep", label: "Next Step", type: "text" },
    { key: "airDate", label: "Air Date", type: "text" },
    { key: "ip", label: "IP", type: "text" },
  ],
};
