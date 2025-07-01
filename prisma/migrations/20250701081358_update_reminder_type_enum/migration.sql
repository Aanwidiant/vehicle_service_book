/*
  Warnings:

  - Changed the type of `type` on the `ReminderSetting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('km', 'time');

-- AlterTable
ALTER TABLE "ReminderSetting" DROP COLUMN "type",
ADD COLUMN     "type" "ReminderType" NOT NULL;
