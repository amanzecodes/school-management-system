/*
  Warnings:

  - A unique constraint covering the columns `[subjectId,test]` on the table `TestScore` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."TestScore" DROP CONSTRAINT "TestScore_studentId_fkey";

-- DropIndex
DROP INDEX "public"."TestScore_studentId_subjectId_test_key";

-- AlterTable
ALTER TABLE "public"."TestScore" ALTER COLUMN "studentId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TestScore_subjectId_test_key" ON "public"."TestScore"("subjectId", "test");

-- AddForeignKey
ALTER TABLE "public"."TestScore" ADD CONSTRAINT "TestScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
