import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Helper to parse dates like "04/06/26" or "07/06" to ISO
function parseDate(d: string): Date | null {
  if (!d) return null;
  const parts = d.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(`20${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }
  if (parts.length === 2) {
    const [day, month] = parts;
    return new Date(`2026-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }
  return null;
}

// Extract next action date from Hebrew text like "נקבע זום ל27/08" or "נקבע זום ל14/07"
function extractNextDate(text: string): Date | null {
  // Match patterns like ל27/08, ל14/07, ל06/07, ל2/7
  const match = text.match(/ל(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    return new Date(`2026-${month}-${day}`);
  }
  return null;
}

function extractNextAction(text: string): string | null {
  if (text.includes("נקבע זום")) return "זום מתוכנן";
  if (text.includes("מחכים למענה") || text.includes("מחכה לעדכונים")) return "מחכים למענה";
  if (text.includes("נשלחו אופציות לזום")) return "מחכים לאישור זום";
  if (text.includes("בקרוב נהיה איתה בקשר")) return "ליצור קשר בקרוב";
  if (text.includes("בקרוב יישלחו")) return "לשלוח אופציות";
  return null;
}

interface UpdateRow {
  name: string;
  company: string;
  email: string;
  projects: string;
  date: string;
  status: string;
  isNew?: boolean;
}

const UPDATES: UpdateRow[] = [
  { name: "Chika Igwilo", company: "FX", email: "chika.igwilo@fxnetworks.com", projects: "Patrick, Punch, The Campaigner, The Phisherman, Tokyo Wonderland", date: "04/06/26", status: "התקיים זום ונשלח שוב הPhisherman, שאלה אם יש פרויקטים נוספים שמעניינים אותנו. נהיה בקשר כשיהיה במה לשתף אותה" },
  { name: "Andrew McQuinn", company: "Netflix", email: "amcquinn@netflix.com", projects: "Patrick, The Lampshade, Tokyo Wonderland", date: "29/06/26", status: "נקבע זום ל27/08" },
  { name: "Nne Ebong", company: "Netflix", email: "nebong@netflix.com", projects: "Patrick, Tokyo Wonderland", date: "29/06/26", status: "נקבע זום ל27/08" },
  { name: "Amy Powell", company: "Vice", email: "amy.powell@vice.com", projects: "Pushers, Pipeline, Informer", date: "10/06/26", status: "התקיים זום ב16/06" },
  { name: "Carina Walker", company: "Amazon", email: "carina.walker@amazonstudios.com", projects: "Patrick, Pink Suitcases, The Lampshade, Tokyo Wonderland", date: "18/03/26", status: "נשלח מייל" },
  { name: "Alison Eakle", company: "Shondaland", email: "alison@shondaland.com", projects: "Pink Suitcases", date: "14/06/26", status: "נקבע זום ל21/07" },
  { name: "Marc Forman", company: "Electricave", email: "marc@electricave.la", projects: "Patrick, Punch, The Campaigner, The Phisherman", date: "18/03/26", status: "נשלח מייל" },
  { name: "Noah Greenshner", company: "Fifth Season", email: "ngreenshner@fifthseason.com", projects: "I Shot America, Patrick, The Phisherman", date: "18/03/26", status: "נשלח מייל" },
  { name: "Carrie Stein", company: "Dynamic Television", email: "cstein@dynamictelevision.com", projects: "Pink Suitcases, The Phisherman, Tito and Rojo", date: "16/06/26", status: "נקבע זום ל16/07" },
  { name: "Chris Markey", company: "The Jackal Group", email: "chrism@thejackalgroup.com", projects: "Tito and Rojo", date: "14/05/26", status: "נקבע זום ל14/05" },
  { name: "Jennifer Katz", company: "The Jackal Group", email: "jenniferk@thejackalgroup.com", projects: "Tito and Rojo", date: "14/05/26", status: "נקבע זום ל14/05" },
  { name: "David Smyth", company: "Fox", email: "david.smyth@fox.com", projects: "The Lampshade", date: "10/04/26", status: "כרגע אין לו המלצות לשיתופי פעולה" },
  { name: "Morgan Wandell", company: "Apple TV", email: "mwandell@apple.com", projects: "The Campaigner", date: "18/03/26", status: "נשלח מייל" },
  { name: "Hillary Marx", company: "Broadway Video", email: "hmarx@broadwayvideo.com", projects: "Love Me, Sad City Girls, Little Mom, Hullraisers", date: "26/05/26", status: "התקיים זום ב26/05" },
  { name: "Hilary Zaitz", company: "WME", email: "hzmichael@wmeagency.com", projects: "", date: "19/04/26", status: "קישרה אותנו למקורות חדשים" },
  { name: "Jake Fuller", company: "Fox", email: "jake.fuller1@fox.com", projects: "While Supplies Last", date: "16/06/26", status: "נקבע זום ל17/06" },
  { name: "Tiffany Moore", company: "Fox", email: "tiffany.moore1@fox.com", projects: "While Supplies Last", date: "16/06/26", status: "נקבע זום ל17/06", isNew: true },
  { name: "Janet Carol Norton", company: "CAA", email: "janetcarol.norton@caa.com", projects: "Patrick, Carthago, Red Skies", date: "17/03/26", status: "נשלח מייל" },
  { name: "Jeff Grosvenor and Rebecca", company: "No Notes", email: "Jeff@nonotesproductions.com", projects: "Nehama, Uri&Ella, The Campaigner, Family Bonds, Punch", date: "11/05/26", status: "עשינו פולואו-אפ, מחכים למענה" },
  { name: "Mirsada Abdool Raman", company: "Miramax", email: "mraman@miramax.com", projects: "Pink Suitcases, Punch, Pushers, The Phisherman", date: "17/03/26", status: "נשלח מייל" },
  { name: "Megan Reid", company: "Media Res Studio", email: "megan.reid@mediares.studio", projects: "I Shot America, Pink Suitcases, Pushers, The Phisherman", date: "17/03/26", status: "נשלח מייל" },
  { name: "Michael Greenwald", company: "A+E Networks", email: "michael.greenwald@aenetworks.com", projects: "I Shot America, Pink Suitcases", date: "18/03/26", status: "נשלח מייל" },
  { name: "David Taghioff", company: "CAA", email: "David.Taghioff@caa.com", projects: "", date: "08/06/26", status: "יואב עשה פולואו-אפ" },
  { name: "Dan Seligmann", company: "87 North", email: "dan@87north.com", projects: "Pushers, The Phisherman, Tokyo Wonderland", date: "26/04/26", status: "ביטלו, מחכים לאופציות חדשות לזום. כרגע משחררים." },
  { name: "Jack Dudley", company: "Will Packer Media", email: "jack@willpackermedia.com", projects: "Pink Suitcases, Pushers, Tokyo Wonderland", date: "16/03/26", status: "התקיים זום, בנושא המיקרו-דרמה בעיקר" },
  { name: "Joe Lewis", company: "Amplify", email: "gabriel.carusetta@amplifypics.com", projects: "", date: "15/06/26", status: "נקבע זום ל14/07" },
  { name: "Kristen Zolner", company: "Imagine Entertainment", email: "kzolner@imagine-entertainment.com", projects: "Carthago, Pushers, Tito and Rojo", date: "17/03/26", status: "נשלח מייל" },
  { name: "Samantha Perelman", company: "AMC Networks", email: "Samantha.Perelman@amcnetworks.com", projects: "Tito and Rojo, The Campaigner, Pipeline, Family Bonds, Punch, The Phisherman", date: "12/05/26", status: "מתעניינת כרגע בPipeline, מחכה לעדכונים לגבי Family Bonds, לא תתקדם עם Campaigner. שלחה איזה עוד פרויקטים הייתה רוצה. נשלח Phisherman. לפי אושר אין כרגע מה לעשות פולואו-אפ" },
  { name: "Moritz Polter", company: "Wind Light Pictures", email: "moritz.polter@windlightpictures.com", projects: "Pink Suitcases, The Lampshade", date: "31/03/26", status: "החליט לא להתקדם עם הפרויקט" },
  { name: "Brian Dobbins", company: "Artists First LA", email: "bd@artistsfirst-la.com", projects: "Pushers, Tito and Rojo", date: "", status: "לא לשלוח לו." },
  { name: "Natasha Kaminsky", company: "", email: "natashajkaminsky@gmail.com", projects: "", date: "07/06", status: "התחילה התמחות" },
  { name: "Malick Diop", company: "Hoorae", email: "malick@hoorae.co", projects: "micro-drama", date: "12/05/26", status: "מתקיים זום ב12/05", isNew: true },
  { name: "India Harrison", company: "6th and Idaho", email: "ih@sixth-and-idaho.com", projects: "RATS", date: "23/04/26", status: "נשלחו טיוטה ופורמטים מעודכנים" },
  { name: "Benjamin Purdy", company: "Boulderlight Pictures", email: "purdy@boulderlightpictures.com", projects: "", date: "14/06/26", status: "נקבע זום ל14/07" },
  { name: "Adam Mitchell", company: "Carnegie Hill Entertainment", email: "adam@carnegiehillent.com", projects: "", date: "10/06/26", status: "התקיים זום עם גיא המאירי" },
  { name: "Erik Feig", company: "Arena SNK", email: "efeig@arenasnk.com", projects: "", date: "03/05/26", status: "נקבע זום ל04/05" },
  { name: "Michael Schaefer", company: "Department M", email: "ms@departmentm.com", projects: "", date: "04/05/26", status: "נקבע זום ל05/05" },
  { name: "Mike Larocca", company: "Department M", email: "ml@departmentm.com", projects: "", date: "09/06/26", status: "יואב עשה פולואו-אפ" },
  { name: "Michael Degrandis", company: "Nickelodeon", email: "Michael.Degrandis@nick.com", projects: "AB Heroes", date: "29/04/26", status: "התקיים זום ב29/04" },
  { name: "Jenna Santoianni", company: "MRC Entertainment", email: "jsantoianni@mrcentertainment.com", projects: "The Lampshade, The Campaigner", date: "30/04/26", status: "נשלח תסריט קמפיינר" },
  { name: "Adam and Becca", company: "NBC Universal", email: "adam.giagni@nbcuni.com", projects: "Punch, Tito and Rojo, The Campaigner", date: "01/05/26", status: "נשלח תסריט קמפיינר" },
  { name: "Lee Broda", company: "LB Entertainment", email: "lee@lbentertainment.co", projects: "I Shot America, The Campaigner, Tokyo Wonderland", date: "30/04/26", status: "נשלח תסריט קמפיינר" },
  { name: "Feri Pusztai", company: "KMH Films", email: "pusztai@kmh.hu", projects: "Ashes To Iron, Micro-Drama", date: "07/05/26", status: "התקיים זום עם אפפריל באמצע מאי" },
  { name: "Linda Pfeiffer", company: "KMH Films", email: "linda.pfeiffer@kmhfilm.com", projects: "", date: "27/05/26", status: "התקיים זום עם יואב ב27/05" },
  { name: "Josh Pincus", company: "", email: "josh@jwbent.com", projects: "", date: "07/05/26", status: "כנראה שלא יתקדם" },
  { name: "Joe Hipps and Patrick McDonald", company: "Paper Plane", email: "", projects: "Pushers", date: "01/06/26", status: "התקיים זום ב01/06" },
  { name: "Suzanne Kendrick", company: "NBC Universal", email: "suzanne.kendrick@nbcuni.com", projects: "Wordle", date: "11/05/26", status: "נשלח מייל מאושר" },
  { name: "Martin Moszkowicz", company: "", email: "martin@moszkowicz.film", projects: "Tokyo Wonderland, The Lampshade", date: "28/06/26", status: "מרטין הגיב שפחות מתעניין כרגע בסדרות אלא יותר בסרטים, אבל התרשם מהפרויקטים וישמח להישאר בקשר ולעזור לקשר אותנו לגורמים רלוונטים. אריאל השיב במייל שבו הציע עוד אופציות לחיבור. מרטין כתב גם את Susanne Bauknecht ושלח מייל נוסף בנוגע לאפפריל. תואם זום מעקב ל06/07" },
  { name: "Tom Misselbrook", company: "Cineflix", email: "tmisselbrook@cineflix.com", projects: "I Shot America, Patrick, The Phisherman, Tokyo Wonderland", date: "09/06/26", status: "הם עובדים על הסכם בשביל פטריק" },
  { name: "Morgan Wandell", company: "", email: "morgan.wandell@gmail.com", projects: "The Campaigner", date: "27/05/26", status: "נשלח מייל" },
  { name: "Eben Davidson", company: "Vice", email: "eben.davidson@vice.com", projects: "Pushers, Pipeline, Informer", date: "10/06/26", status: "התקיים זום ב16/06", isNew: true },
  { name: "Tana Jamieson and Kiel Elliot", company: "A&E", email: "", projects: "Pushers", date: "01/07/26", status: "נקבע ל06/08", isNew: true },
  { name: "Jenil Parmar", company: "", email: "jenil@eloelo.in", projects: "", date: "04/06/26", status: "שלחו מייל והתעניינו בנו, נשלח לאושר ויתקדמו עם אפפריל", isNew: true },
  { name: "Nina R Lederman", company: "NLP", email: "nrlederman@outlook.com", projects: "I Shot America, Pink Suitcases, The Child's Best Interest", date: "07/06/26", status: "נקבע זום ל15/06" },
  { name: "Judit Stalter", company: "Laokoon Films", email: "stalter@laokoonfilm.com", projects: "", date: "10/06/26", status: "התקיים זום, בקרוב נהיה איתה בקשר.", isNew: true },
  { name: "Nina Tassler", company: "Kismet Creative Group", email: "arissa@kismetcreativegroup.com", projects: "", date: "18/06/26", status: "נקבע זום עם אריאל ל2/7" },
  { name: "Mickey Berman", company: "United Talent", email: "MBAssistant@unitedtalent.com", projects: "", date: "23/06/26", status: "נקבע זום ל09/07" },
  { name: "Michael Gordon", company: "CAA", email: "michael.gordon@caa.com", projects: "", date: "17/06/26", status: "נשלח מייל בנושא השוטר הטוב מאושר" },
  { name: "Jim Benson", company: "Lippin Group", email: "jbenson@lippingroup.com", projects: "", date: "25/06/26", status: "נקבע זום ל06/07", isNew: true },
  { name: "Lili", company: "Post Office Films", email: "makk.lili@postofficefilms.com", projects: "", date: "23/06/26", status: "זיו שלח מייל לבדיקת עלויות", isNew: true },
  { name: "Albin Lewi", company: "Cannes Series", email: "al@canneseries.com", projects: "", date: "24/06/26", status: "נשלח מייל לקביעת זום" },
  { name: "Shelley Zimmerman", company: "Skydance / Paramount", email: "shelley.zimmerman@paramount.com", projects: "Patrick, Pink Suitcases, The Phisherman, Pushers", date: "25/06/26", status: "בקרוב יישלחו עוד אופציות לזום" },
  { name: "Chris Grant", company: "Osmosis", email: "chris@osmosisww.com", projects: "Tito and Rojo", date: "30/06/26", status: "נקבע זום ל21/07" },
  { name: "Carmen Pepelea", company: "", email: "carmen.pepelea@gmail.com", projects: "", date: "01/07/26", status: "נקבע זום ל06/07", isNew: true },
  { name: "Miriam Luciow", company: "FOX", email: "miriam.luciow@fox.com", projects: "", date: "01/07/26", status: "נשלחו אופציות לזום עם אריאל", isNew: true },
  { name: "Arturo Interian", company: "MGM", email: "arturointerian24@gmail.com", projects: "", date: "01/07/26", status: "נשלחו אופציות לזום עם אריאל", isNew: true },
];

// Project name normalization
function normalizeProject(name: string): string {
  const n = name.trim();
  const map: Record<string, string> = {
    "tito&rojo": "Tito and Rojo",
    "tito and rojo": "Tito and Rojo",
    "i shot america": "I Shot America",
    "the pipeline": "Pipeline",
    "pipeline": "Pipeline",
    "charthago": "Carthago",
    "carthago": "Carthago",
    "the childs best interest": "The Child's Best Interest",
    "the child's best interest": "The Child's Best Interest",
    "micro-drama": "Micro-Drama",
    "phisherman": "The Phisherman",
    "sad city girls": "Sad City Girls",
    "little mom": "Little Mom",
    "hullraisers": "Hullraisers",
    "love me": "Love Me",
    "while supplies last": "While Supplies Last",
    "rats": "RATS",
    "uri&ella": "Uri & Ella",
    "red skies": "Red Skies",
    "informer": "Informer",
    "ab heroes": "AB Heroes",
    "wordle": "Wordle",
    "ashes to iron": "Ashes To Iron",
    "nehama": "Nehama",
    "family bonds": "Family Bonds",
  };
  const lower = n.toLowerCase();
  if (map[lower]) return map[lower];
  return n;
}

async function main() {
  // Ensure all projects exist
  const allProjectNames = new Set<string>();
  for (const row of UPDATES) {
    if (row.projects) {
      for (const p of row.projects.split(",")) {
        const name = normalizeProject(p);
        if (name) allProjectNames.add(name);
      }
    }
  }

  const projectMap = new Map<string, string>();
  for (const name of allProjectNames) {
    const existing = await prisma.project.findUnique({ where: { name } });
    if (existing) {
      projectMap.set(name, existing.id);
    } else {
      const p = await prisma.project.create({ data: { name } });
      projectMap.set(name, p.id);
      console.log("Created project:", name);
    }
  }

  let created = 0;
  let updated = 0;

  for (const row of UPDATES) {
    const lastContactDate = parseDate(row.date);
    const nextActionDate = extractNextDate(row.status);
    const nextAction = extractNextAction(row.status);

    // Find existing contact by email or name
    let contact = null;
    if (row.email) {
      contact = await prisma.contact.findFirst({
        where: { email: { contains: row.email.split(",")[0].trim() } },
        include: { projects: { include: { project: true } } },
      });
    }
    if (!contact) {
      contact = await prisma.contact.findFirst({
        where: { name: { equals: row.name, mode: "insensitive" } },
        include: { projects: { include: { project: true } } },
      });
    }

    if (contact) {
      // Update existing contact
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          ...(lastContactDate ? { lastContactDate } : {}),
          lastInteraction: row.status || undefined,
          ...(nextAction ? { nextAction } : {}),
          ...(nextActionDate ? { nextActionDate } : {}),
          ...(row.company ? { company: row.company } : {}),
        },
      });

      // Sync projects
      if (row.projects) {
        const wantedNames = row.projects.split(",").map(p => normalizeProject(p)).filter(Boolean);
        const existingNames = contact.projects.map((p: { project: { name: string } }) => p.project.name);
        for (const pName of wantedNames) {
          if (!existingNames.includes(pName)) {
            const pid = projectMap.get(pName);
            if (pid) {
              try {
                await prisma.contactProject.create({
                  data: { contactId: contact.id, projectId: pid },
                });
              } catch { /* duplicate */ }
            }
          }
        }
      }

      updated++;
      console.log("Updated:", row.name);
    } else {
      // Create new contact
      const c = await prisma.contact.create({
        data: {
          name: row.name,
          company: row.company || null,
          email: row.email || null,
          lastContactDate,
          lastInteraction: row.status || null,
          nextAction,
          nextActionDate,
        },
      });

      if (row.projects) {
        const projectNames = row.projects.split(",").map(p => normalizeProject(p)).filter(Boolean);
        for (const pName of projectNames) {
          const pid = projectMap.get(pName);
          if (pid) {
            try {
              await prisma.contactProject.create({
                data: { contactId: c.id, projectId: pid },
              });
            } catch { /* duplicate */ }
          }
        }
      }

      created++;
      console.log("Created:", row.name);
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
