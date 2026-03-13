-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "avatar" TEXT;
ALTER TABLE "Admin" ADD COLUMN "nickname" TEXT;
ALTER TABLE "Admin" ADD COLUMN "title" TEXT;

-- AlterTable
ALTER TABLE "News" ADD COLUMN "authorAvatar" TEXT;

-- CreateTable
CREATE TABLE "DailyTip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "avatar" TEXT,
    "unit" TEXT,
    "achievements" TEXT,
    "score" REAL,
    "introduction" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expert_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Expert" ("achievements", "avatar", "categoryId", "createdAt", "id", "introduction", "name", "score", "title", "unit", "updatedAt") SELECT "achievements", "avatar", "categoryId", "createdAt", "id", "introduction", "name", "score", "title", "unit", "updatedAt" FROM "Expert";
DROP TABLE "Expert";
ALTER TABLE "new_Expert" RENAME TO "Expert";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
