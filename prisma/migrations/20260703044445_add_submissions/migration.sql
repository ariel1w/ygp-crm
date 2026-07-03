-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "senderName" TEXT,
    "dateReceived" TIMESTAMP(3),
    "ygpContact" TEXT,
    "senderEmail" TEXT,
    "status" TEXT,
    "updatedBy" TEXT,
    "wasUpdated" TEXT,
    "week" TEXT,
    "inProgress" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);
