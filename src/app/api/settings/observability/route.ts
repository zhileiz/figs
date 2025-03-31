import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VaultTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: "Key content is required" },
        { status: 400 }
      );
    }

    await db.insert(VaultTable).values({
      name: "langsmith",
      type: "observability",
      content,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing API key:", error);
    return NextResponse.json(
      { error: "Failed to store API key" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const apiKeys = await db
      .select({
        name: VaultTable.name,
        content: VaultTable.content,
      })
      .from(VaultTable)
      .where(and(eq(VaultTable.type, "observability"), eq(VaultTable.name, "langsmith")));

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}