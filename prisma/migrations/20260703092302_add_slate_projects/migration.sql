-- CreateTable
CREATE TABLE "SlateProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "creator" TEXT,
    "format" TEXT,
    "episodeLength" TEXT,
    "genre" TEXT,
    "keyPeople" TEXT,
    "broadcaster" TEXT,
    "shootingDates" TEXT,
    "locations" TEXT,
    "budget" TEXT,
    "status" TEXT,
    "nextStep" TEXT,
    "priority" TEXT,
    "contact" TEXT,
    "whereAired" TEXT,
    "distributor" TEXT,
    "airDate" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlateProject_pkey" PRIMARY KEY ("id")
);
