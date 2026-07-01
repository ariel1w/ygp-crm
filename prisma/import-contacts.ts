import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: "file:" + dbPath });
const prisma = new PrismaClient({ adapter });

const RAW = `Adam Giangi	NBC	adam.giangi@nbcuni.com	The Campaigner
Adam and Becca	NBC Universal	adam.giagni@nbcuni.com, Becca.Tesarfreund@nbcuni.com	Punch, Tito&Rojo, The Campaigner
Adam Mitchell		adam@carnegiehillent.com
Adrienne Mitchell	Bentframe	adriennem@bentframe.ca	Tokyo Wonderland
Albin Lewi	Cannes Series	al@canneseries.com
Alison Eakle	Shondaland	alison@shondaland.com	Pink Suitcases
Alon Aranya	Paper Plane	alon@paperplaneprods.com	Pushers
Amanda Krentzman	Fireside Access TV	amanda@firesideaccess.com	Pink Suitcases
Amanda Krentzman	Fireside Access TV	amandakrentzman@gmail.com	Pink Suitcases
Ami Oshima	U-next	a-oshima@unext.jp	Tokyo Wonderland
Amy Israel	North Road	ai@northroadcompany.com	I SHOT AMERICA
Amy Powell	Vice	amy.powell@vice.com	Pushers, Pipeline
Anaïs Neergaard	Beta Films	anais.deneergaard@betafilm.com	Patrick
Andrea Shay	Welle Entertainment	andrea@welleent.com	Patrick, Pink Suitcases
Andrew McQuinn	Netflix	amcquinn@netflix.com	Patrick, The Lampshade, Tokyo Wonderland
Anna Winger	Airlift	anna@studioairlift.com	The Lampshade
Anne Chow	The Jackal Group	annec@thejackalgroup.com	Tito&Rojo
Emma Gollagly	Fifth Season	egollagly@fifthseason.com	Tokyo Wonderland
Ava Mustos	Fifth Season	amustos@fifthseason.com	Pink Suitcases
Becca Teaserfruend	NBC	becca.tesarfreund@nbcuni.com	The Campaigner
Benjamin Purdy	Boulderlight Pictures	purdy@boulderlightpictures.com
Beth O'Brien	FOX	beth.obrien@fox.com	Patrick, Punch
Brian Boundent	Bound Entertainment	brian@boundent.com	Pushers, Tito&Rojo
Brian Dobbins	Artists First LA	bd@artistsfirst-la.com	Pushers, Tito&Rojo
Brie Neimand	FOX	brie.neimand@fox.com	Patrick, Punch
Carina Walker	Amazon	carina.walker@amazonstudios.com	Patrick, Pink Suitcases, The Lampshade, Tokyo Wonderland
Caroline Warner	Apple TV	caroline_warner@apple.com	The Campaigner
Carolyn Carbone	Apple TV	carolyn_carbone@apple.com	Tito&Rojo, Tokyo Wonderland
Carolyn Carbone	Apple TV	oliver_jones@apple.com	Tokyo Wonderland
Carrie Stein	Dynamic Television	cstein@dynamictelevision.com	Pink Suitcases, The Phisherman, Tito&Rojo
Chika Igwilo	FX	chika.igwilo@fxnetworks.com	Patrick, Punch, The Campaigner, The Phisherman, Tokyo Wonderland
Chloe Dan	SK Global	chloe.dan@skglobalent.com	The Campaigner, The Lampshade, Tokyo Wonderland
Chris Goble	Skybound	cgoble@skybound.com	I SHOT AMERICA, The Phisherman
Chris Grant	Osmosis	chris@osmosisww.com	Tito and Rojo
Chris Markey	The Jackal Group	chrism@thejackalgroup.com	Tito&Rojo
Chris Salvaterra	HBO	chris.salvaterra@hbo.com	Patrick
Jhon Clodfelter	Legendary	jclodfelter@legendary.com	Patrick, The Campaigner, The Lampshade
Cort Cass	ABC	cort.cass@abc.com	I SHOT AMERICA, Pink Suitcases, The Phisherman, Tito&Rojo
Dan Seligmann	87 North	kyle@87north.com	Pushers, The Phisherman, Tokyo Wonderland
Dan Morgan	Cineflix	dmorgan@cineflix.com	Patrick
Danielle Kreinik	JBTV	dkreinik@jbtv.com	I SHOT AMERICA, Punch, Pushers, The Campaigner, The Phisherman, Tito&Rojo
Dante Di Loreto	Fremantle	dante.dilorento@fremantle.com	I SHOT AMERICA
Darek Gasiorowski	Poland	dgasiorowski96@gmail.com	Pushers
David Well	Private	davidwell28@gmail.com	Pink Suitcases
David Kherl	Constantin	david.kehrl@constantin.film	The Lampshade
David Smyth	Fox	david.smyth@fox.com	The Lampshade
David Taghioff	CAA	David.Taghioff@caa.com, david.taghioffasst@caa.com
David Weil	Amazon	davidweil28@gmail.com	Tokyo Wonderland
Diane de Kervasdoue	Studio TF1	ddekervasdoue@studiotf1.com	Patrick
Doug Robinson	DRP	doug@drproductions.com	Patrick, The Phisherman, Tito&Rojo
Doug Robinson and Lauren Moffat	DR	noah@drproductions.com	The Lampshade
Maxfield Elins	Lionsgate	melins@lionsgate.com	The Phisherman, The Campaigner
Brian Weinstein	Lionsgate	bweinstein@3arts.com	Patrick
Elizabeth Newman	Literate	elizabethnewman@literateinc.com	I SHOT AMERICA, The Campaigner, The Lampshade, The Phisherman, Tokyo Wonderland
Elizabeth Nicholson	All3Media	elizabeth.nicholson@all3media.com	Patrick
Eric Phillips	Sony	eric_phillips@spe.sony.com	Patrick, The Lampshade, Tito&Rojo
Erik Barmack	WildSheep	erik@wildsheepcontent.com	I SHOT AMERICA, The Phisherman, Tito&Rojo, Tokyo Wonderland
Erik Feig	Arena SNK	efeig@arenasnk.com
Evan Gelb	De Maio	egelb@demaioent.com	Punch, Pushers, The Lampshade
Feri Pusztai	KMH Films	pusztai@kmh.hu	Ashes To Iron
Frans Van Gestel	TopKap Films	frans@toppkapfilms.nl	Pink Suitcases
Francisco Vina Perez	About Premium Content	francisco.vinaperez@aboutpremiumcontent.com	Patrick
Gideon Raff		gideonraff@gmail.com	I SHOT AMERICA
Glenn Geller	Skybound	ggeller@skybound.com	I SHOT AMERICA, The Phisherman
Greig Dymond	CBC	greig.dymond@cbc.ca	Tokyo Wonderland
Guillaume Pommier	Fedent	guillaume.pommier@fedent.com	Patrick
Hillary Marx	Broadway Video	hmarx@broadwayvideo.com
Hilary Zaitz	WME	hzmichael@wmeagency.com
Hugh Chang	Lotte / Desertbloom	hughcha@lotte.net	Tokyo Wonderland
Ilana Bouneau	About Premium Content	ilana.bouneau@aboutpremiumcontent.com	Patrick
India Harrison	6th and Idaho	ih@sixth-and-idaho.com
Jack Dudley	Will Packer Media	jack@willpackermedia.com	Pink Suitcases, Pushers, Tokyo Wonderland
Jake Fuller	Fox	jake.fuller1@fox.com
James Allen	101 Studios	jallen@101studiosco.com	Punch, Pushers
James Durie	Cineflix	jdurie@cineflix.com	I SHOT AMERICA, Patrick, The Phisherman
Jan David Frouman	Chernin Ent	jdf@cherninent.com	Patrick, Pushers
Janet Carol Norton	CAA	janetcarol.norton@caa.com	Patrick, Carthago
Jason Clodfelter	Legendary	jclodfelter@legendary.com	Punch
Jason Mondry	Skydance / Paramount	jason.mondry@paramount.com	Pink Suitcases, The Phisherman
Jason, Brian and Josh	Legendary	jhorowitz@legendary.com	Patrick, Punch, The Campaigner, The Lampshade
Jenna Santoianni	MRC Entertainment	jsantoianni@mrcentertainment.com	I SHOT AMERICA, Patrick, Pushers, The Campaigner, The Lampshade, Tito&Rojo
Jennifer Katz	The Jackal Group	jenniferk@thejackalgroup.com	Tito&Rojo
Jennice Lee	Lotte / Desertbloom	jennice@desertbloompictures.com	Tokyo Wonderland
Jennice and Hugh	Lotte / Desertbloom	kwak_jh@lotte.net	Tokyo Wonderland
Jens Richter	Fremantle	jens.richter@fremantle.com	Pink Suitcases
Jeff Grosvenor and Rebecca	No Notes	Jeff@nonotesproductions.com, Rebecca@nonotesproductions.co	The Campaigner, Punch, Nehama, Family Bonds
Jillian Kugler	Fox	jillian.kugler@fox.com	Punch, The Campaigner, Tokyo Wonderland
Jocelyn Wexler	Wild Sheep	jocelyn@wildsheepcontent.com	I SHOT AMERICA, Tito&Rojo
Joe Hipps	Paper Plane		Pushers
Joe Lewis	Amplify
Josh Pincus		josh@jwbent.com
Joey Chavez	WBD	joey.chavez@wbd.com	Pushers, The Phisherman, Tokyo Wonderland
Jonathan Gabay	Berlanti Productions	jonathan@berlantiproductions.com	I SHOT AMERICA, Cannon, The Phisherman
Joshua Horowitz	Legendary	bsegna@legendary.com	Patrick, Punch, The Campaigner, The Lampshade
Katia Kirby	Series Mania	katia.kirby@seriesmania.com	Patrick
Kevin Brown	Bender Brown	kbrown@abandapart.com	I SHOT AMERICA, The Campaigner, The Lampshade, The Phisherman
Kristen Zolner	Imagine Entertainment	kzolner@imagine-entertainment.com	Carthago, Pushers, Tito&Rojo
Kristin Jones	Chernin Ent	kj@cherninent.com	Patrick
Kristin Jones	North Road	kj@northroadcompany.com	Tokyo Wonderland
Kristin Jones	Independent	kristin.jones@me.com	Pink Suitcases
Kyle Smith	87 North	dan@87north.com	Pushers, The Phisherman, Tokyo Wonderland
Larry Tanz	Netflix	ltanz@netflix.com	Tito&Rojo
Lars Blomgren	Media Res	lars.blomgren@mediares.studio	Pushers
Lauren Jackson	All3Media	lauren.jackson@all3media.com	Patrick
Lawrence Bender	Bender Brown	jbender@abandapart.com	I SHOT AMERICA
Lawrence Bender	Bender Brown	lbender@abandapart.com	The Campaigner, The Lampshade
Lea Marin	CBC	lea.marin@cbc.ca	Tokyo Wonderland
Lee Broda	LB Entertainment	lee@lbentertainment.co	I SHOT AMERICA, The Campaigner, Tokyo Wonderland
Leo Maidenberg	Declaration Studio	leo.maidenberg@gmail.com	Tokyo Wonderland
Lionel Uzan	Fedent	lionel.uzan@fedent.com	Tokyo Wonderland
Linda Pfeiffer	KMH Films	linda.pfeiffer@kmhfilm.com	Ashes To Iron
Lisa Kreimeyer	Netflix Germany	lkreimeyer@netflix.com	The Lampshade
Lital Spitzer	3Arts	lspitzer@3arts.com	Punch, Pushers, Tito&Rojo
Louise Pedersen	All3Media	louise.pedersen@all3media.com	Patrick
Lynn and Matti	New Man Date Films	matti@newmandatefilms.com	I SHOT AMERICA
Lynn and Matti Leshem	WRPCO	matti@wrpco.com	The Phisherman
Maartje Horchner	All3Media	maartje.horchner@all3media.com	Patrick
Marc Forman	Electricave	marc@electricave.la	Patrick, Punch, The Campaigner, The Phisherman
Marie Jaffrennou	Gaumont	marie.jaffrennou@gaumont.com	Patrick
Mary Malloy	FOX	mary.malloy@fox.com
Mark Tuohy	WBD	mark.tuohy@wbd.com	Pushers, The Phisherman, Tokyo Wonderland
Marvin Peart	Wonder View	marvin@wonderview.com	Punch, Pushers, Tito&Rojo
Martin Moszkowicz		martin@moszkowicz.film, info@moszkowicz.film
Matt Thunell	Skydance / Paramount	matt.thunell@paramount.com	The Phisherman, Tokyo Wonderland
Matt Thunell	Skydance / Paramount	matt.thunell@skydance.com	Patrick, The Lampshade
Maxfield Elins	Lionsgate	melins@lionsgate.com	Patrick, The Campaigner, The Phisherman
Megan Reid	Media Res Studio	megan.reid@mediares.studio	I SHOT AMERICA, Pink Suitcases, Pushers, The Phisherman
Melis Hamamcioglu	Eccho Rights	melis@ecchorights.com	Patrick
Michael Degrandis	Nickelodeon	Michael.Degrandis@nick.com	AB Heroes
Michael Gordon	CAA	michael.gordonasst@caa.com
Michael Greenwald	A+E Networks	michael.greenwald@aenetworks.com	I SHOT AMERICA, Pink Suitcases
Michael Schaefer	Department M	ms@departmentm.com
Mickey Berman	United Talent	MBAssistant@unitedtalent.com
Mike Larocca	Department M	ml@departmentm.com
Mirsada Abdool Raman	Miramax	mraman@miramax.com	Pink Suitcases, Punch, Pushers, The Phisherman
Monica Levy	Fedent	monica.levy@fedent.com	Patrick
Montrel McKay	Hoorae	montrel@hoorae.co
Morgan Wandell	Apple TV	mwandell@apple.com, morgan.wandell@gmail.com	The Campaigner
Moritz Polter	Wind Light Pictures	moritz.polter@windlightpictures.com	Pink Suitcases, The Lampshade
Natalie Domengeaux	Esmail Corp	natalie@esmailcorp.com	The Phisherman, Tokyo Wonderland
Natalie Laine Williams		natalie.laine.williams@gmail.com	Pink Suitcases, The Phisherman
Natalie Laine Williams	Amazon	natalie.leine.williams@gmail.com	Tokyo Wonderland
Natasha Kaminsky		natashajkaminsky@gmail.com
Nicola Davey	Banijay	nicola.davey@banijayrights.com	Patrick
Nina R Lederman	NLP	nrlederman@outlook.com	I SHOT AMERICA, Pink Suitcases, The Childs Best Interest
Nina Tassler	Kismet Creative Group	arissa@kismetcreativegroup.com
Nne Ebong	Netflix	nebong@netflix.com	Patrick, Tokyo Wonderland
Noah Greenshner	Fifth Season	ngreenshner@fifthseason.com	I SHOT AMERICA, Patrick, The Phisherman
Noel Manzano	AMC Networks	noel.manzano@amcnetworks.com	I SHOT AMERICA, The Phisherman
Oliver Bachert	Beta Film	oliver.bachert@betafilm.com	Patrick
Pablo Salzman	Content C3	pablo@contentc3.com	Tokyo Wonderland
Patrick McDonald	Paper Plane		Pushers
Eva Turner	Fifth Season	eturner@fifthseason.com	Tokyo Wonderland
Pilar Perez	DCD Rights	pilar.perez@dcdrights.com	Patrick
Rachel Toffler	New Regency	rtoffler@newregency.com	Punch
Ram Bergman	TStreet	ram@tstreet.com	I SHOT AMERICA, Patrick, The Campaigner, Tokyo Wonderland
Rob Kenneally	CAA	rkenneally@caa.com
Rob Luchow	CBS Studios	rob.luchow@cbs.com	I SHOT AMERICA, Pink Suitcases, Pushers, The Phisherman, Tito&Rojo
Robert Samuelson	ITV Studios	robert.samuelson@itv.com	Patrick, Tito&Rojo, Tokyo Wonderland
Romain Rossi	Wild Bunch	rrossi@wildbunch.eu	Tito&Rojo
Rudiger Boess	Constantin	ruediger.boess@constantin.film	The Lampshade
Sabrina Wind	Will Packer Media	sabrina@willpackermedia.com	Pink Suitcases, Pushers, Tokyo Wonderland
Samantha Blanco	Netflix	sblanco@netflix.com	Punch, The Lampshade, Tito&Rojo
Samantha Perelman	AMC Networks	Samantha.Perelman@amcnetworks.com	Carthago, Nehama, Tito and Rojo, The Campaigner, The Pipeline, Family Bonds, Punch
Samuel Ha	Bound Entertainment	samha@boundent.com	Pushers, Tito&Rojo
Sayako Aoki	Nippon TV	intlprog@ntv.co.jp, sayako@ntv.co.jp	Tokyo Wonderland
Scott Nemes	AGBO	snemes@agbo.com	Pink Suitcases, The Campaigner, The Pipeline, Tokyo Wonderland
Sean Flanagan	Wild Sheep	sean@wiip.com	Pushers, The Lampshade
Shelley Zimmerman	Skydance / Paramount	shelley.zimmerman@paramount.com	Patrick, Pink Suitcases, The Phisherman
Simone Ruff	Wind Light Pictures	simone.ruff@windlightpictures.com	The Phisherman
Stephanie Rosenthal	FOX	stephanie.rosenthal@fox.com	Patrick, Punch
Stephen Carrier	Apple	stephen_carrier@apple.com	The Phisherman, Tito&Rojo
Suzanne Kendrick	NBC Universal	suzanne.kendrick@nbcuni.com	Wordle
Tami Sagher		tamisagher@gmail.com	Pushers, Tito&Rojo
Taylor Segal	Broadway Video	tsegal@broadwayvideo.com
The Winters	Paper Plane	office@paperplaneprods.com	Pushers
Tim Gerhartz	ZDF	tim.gerhartz@zdf-studios.com	Patrick
Tom Lerner	A+E Studios	tom.lerner@aenetworks.com	Carthago, Pushers, Tito&Rojo
Tom Misselbrook	Cineflix	tmisselbrook@cineflix.com	I SHOT AMERICA, Patrick, The Phisherman, Tokyo Wonderland
Tony Sabistina	Fox	tony.sabiistina@fox.com, tony.sabistina@fox.com	The Phisherman, The Campaigner
Trish Williams	CBC	trish.williams@cbc.ca	Tokyo Wonderland
Charles Touboul	Mediawan	charles.touboul@mediawan.com	Pink Suitcases
William Lau	Ladder Ideas	william@quizdb.com	Patrick, Tito&Rojo
Yuliya Fischer	ZDF	yuliya.fischer@zdf-studios.com	Patrick, Pink Suitcases
Zach Marcovici	Bentframe	zachm@bentframe.ca	Tokyo Wonderland
Matthew Weiner		matthew.weiner65@gmail.com	Punch
Emilio Shenkar	Sipur	emilio@sipurstudios.com	Tokyo Wonderland, Wild South, Love Me
Neta Mor	West End Films	Neta@westendfilms.com, maya@westendfilms.com	I Shot America, The Lampshade
Michael Degrandis	Nickelodeon	Michael.Degrandis@nick.com	AB Heroes
Melissa Lintott	DCD Rights	pilar.perez@dcdrights.com	Patrick		`;

// Normalize project names
function normalizeProject(name: string): string {
  const n = name.trim();
  const map: Record<string, string> = {
    "tito&rojo": "Tito and Rojo",
    "tito & rojo": "Tito and Rojo",
    "tito and rojo": "Tito and Rojo",
    "charthago": "Carthago",
    "carthago": "Carthago",
    "i shot america": "I Shot America",
    "the pipeline": "Pipeline",
    "pipeline": "Pipeline",
    "cannon": "Cannon",
    "the childs best interest": "The Child's Best Interest",
    "wild south": "Wild South",
    "love me": "Love Me",
    "ab heroes": "AB Heroes",
    "wordle": "Wordle",
    "nehama": "Nehama",
    "family bonds": "Family Bonds",
    "ashes to iron": "Ashes To Iron",
    "sad city girls": "Sad City Girls",
    "little mom": "Little Mom",
    "hullraisers": "Hullraisers",
    "while supplies last": "While Supplies Last",
    "rats": "RATS",
  };
  const lower = n.toLowerCase();
  if (map[lower]) return map[lower];
  return n;
}

async function main() {
  // Collect all unique project names
  const projectNames = new Set<string>();
  const rows = RAW.split("\n").filter(l => l.trim());

  for (const row of rows) {
    const cols = row.split("\t");
    const projectsStr = cols[3]?.trim() || "";
    if (projectsStr) {
      for (const p of projectsStr.split(",")) {
        const name = normalizeProject(p);
        if (name) projectNames.add(name);
      }
    }
  }

  // Ensure all projects exist
  const projectMap = new Map<string, string>(); // name -> id
  for (const name of projectNames) {
    const existing = await prisma.project.findUnique({ where: { name } });
    if (existing) {
      projectMap.set(name, existing.id);
    } else {
      const p = await prisma.project.create({ data: { name } });
      projectMap.set(name, p.id);
      console.log("Created project:", name);
    }
  }

  // Import contacts
  let imported = 0;
  for (const row of rows) {
    const cols = row.split("\t");
    const name = cols[0]?.trim();
    const company = cols[1]?.trim() || null;
    const email = cols[2]?.trim() || null;
    const projectsStr = cols[3]?.trim() || "";

    if (!name) continue;

    const contact = await prisma.contact.create({
      data: {
        name,
        company,
        email,
      },
    });

    // Link projects
    if (projectsStr) {
      const projectNames = projectsStr.split(",").map(p => normalizeProject(p)).filter(Boolean);
      for (const pName of projectNames) {
        const pid = projectMap.get(pName);
        if (pid) {
          try {
            await prisma.contactProject.create({
              data: { contactId: contact.id, projectId: pid },
            });
          } catch {
            // duplicate, skip
          }
        }
      }
    }

    imported++;
  }

  console.log(`Imported ${imported} contacts`);
  console.log(`Total projects: ${projectMap.size}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
