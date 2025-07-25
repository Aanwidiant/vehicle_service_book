/*
  Warnings:

  - The primary key for the `ReminderSetting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ReminderSetting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ServiceRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ServiceRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ReminderSetting" DROP CONSTRAINT "ReminderSetting_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ReminderSetting_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ServiceRecord" DROP CONSTRAINT "ServiceRecord_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id");
