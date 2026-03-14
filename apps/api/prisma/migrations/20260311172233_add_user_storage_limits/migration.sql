-- AlterTable
ALTER TABLE "User" ADD COLUMN     "storageImageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storageVideoCount" INTEGER NOT NULL DEFAULT 0;
