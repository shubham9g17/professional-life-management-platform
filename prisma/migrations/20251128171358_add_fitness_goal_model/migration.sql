-- CreateTable
CREATE TABLE "FitnessGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FitnessGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FitnessGoal_userId_idx" ON "FitnessGoal"("userId");

-- CreateIndex
CREATE INDEX "FitnessGoal_status_idx" ON "FitnessGoal"("status");

-- CreateIndex
CREATE INDEX "FitnessGoal_userId_status_idx" ON "FitnessGoal"("userId", "status");
