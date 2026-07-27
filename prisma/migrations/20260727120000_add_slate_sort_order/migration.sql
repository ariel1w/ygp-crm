-- AlterTable
ALTER TABLE "SlateProject" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill so the list keeps the exact order it is displayed in today
-- (per stage, oldest created first). Nothing appears to move.
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY stage ORDER BY "createdAt" ASC) AS rn
    FROM "SlateProject"
)
UPDATE "SlateProject" p
SET "sortOrder" = ranked.rn
FROM ranked
WHERE p.id = ranked.id;

-- CreateIndex
CREATE INDEX "SlateProject_stage_sortOrder_idx" ON "SlateProject"("stage", "sortOrder");
