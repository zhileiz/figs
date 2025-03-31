import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VaultTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { name, content } = await request.json();
    
    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    await db.insert(VaultTable).values({
      name,
      type: "llm",
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
      .where(eq(VaultTable.type, "llm"));

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { name, content } = await request.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    const result = await db
      .update(VaultTable)
      .set({ content })
      .where(
        and(
          eq(VaultTable.name, name),
          eq(VaultTable.type, "llm")
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Name parameter is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(VaultTable)
      .where(
        and(
          eq(VaultTable.name, name),
          eq(VaultTable.type, "llm")
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
