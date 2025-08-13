import { prisma } from "./prisma";

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

export async function getDatabaseInfo() {
  try {
    const result = (await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version
    `) as any[];

    console.log("📊 Database Info:", result[0]);
    return result[0];
  } catch (error) {
    console.error("Failed to get database info:", error);
    return null;
  }
}
