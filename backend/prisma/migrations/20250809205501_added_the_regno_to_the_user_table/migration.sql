/*
  Warnings:

  - You are about to drop the column `regNo` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[regNo]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `regNo` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Student_regNo_key";

-- AlterTable
ALTER TABLE "public"."Student" DROP COLUMN "regNo";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "regNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_regNo_key" ON "public"."User"("regNo");
