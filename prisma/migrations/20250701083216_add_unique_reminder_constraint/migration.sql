/*
  Warnings:

  - A unique constraint covering the columns `[vehicleId,type]` on the table `ReminderSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReminderSetting_vehicleId_type_key" ON "ReminderSetting"("vehicleId", "type");
