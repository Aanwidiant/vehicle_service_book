/*
  Warnings:

  - You are about to drop the column `serviceType` on the `ServiceRecord` table. All the data in the column will be lost.
  - Added the required column `serviceTitle` to the `ServiceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceRecord" DROP COLUMN "serviceType",
ADD COLUMN     "serviceTitle" TEXT NOT NULL;
