import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EdgeTypeTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { 
  edgeTypeSchema, 
  edgeNameChangeSchema 
} from "@/lib/validations/edge-type";

// Utility function to convert string to SCREAMING_SNAKE_CASE
function toScreamingSnakeCase(str: string): string {
  return str
    .split(/[\s-]+/) // Split on spaces and hyphens
    .map(word => word.toUpperCase())
    .join('_');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      // If no name parameter is provided, return all edge types
      const edgeTypes = await db.select().from(EdgeTypeTable);
      return NextResponse.json(edgeTypes);
    } else {
      // If name parameter is provided, return the specific edge type
      const edge = await db
        .select()
        .from(EdgeTypeTable)
        .where(eq(EdgeTypeTable.name, name))
        .limit(1);
      
      if (!edge[0]) {
        return NextResponse.json(
          { error: "Edge type not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(edge[0]);
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = edgeTypeSchema.parse(json);

    // Convert name to SCREAMING_SNAKE_CASE
    const transformedBody = {
      ...body,
      name: toScreamingSnakeCase(body.name)
    };

    const edgeType = await db.insert(EdgeTypeTable).values(transformedBody).returning();

    return NextResponse.json(edgeType[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const updateType = searchParams.get("type");
    const json = await req.json();

    if (!updateType) {
      return NextResponse.json(
        { error: "Update type parameter is required" },
        { status: 400 }
      );
    }

    let updatedEdgeType;

    switch (updateType) {
      case "full":
        const fullBody = edgeTypeSchema.parse(json);
        const transformedFullBody = {
          ...fullBody,
          name: toScreamingSnakeCase(fullBody.name)
        };
        updatedEdgeType = await db
          .update(EdgeTypeTable)
          .set(transformedFullBody)
          .where(and(
            eq(EdgeTypeTable.name, fullBody.name),
            eq(EdgeTypeTable.from, fullBody.from),
            eq(EdgeTypeTable.to, fullBody.to)
          ))
          .returning();
        break;

      case "name":
        const nameBody = edgeNameChangeSchema.parse(json);
        const newName = toScreamingSnakeCase(nameBody.name);
        updatedEdgeType = await db
          .update(EdgeTypeTable)
          .set({ name: newName })
          .where(and(
            eq(EdgeTypeTable.name, nameBody.old_name),
            eq(EdgeTypeTable.from, nameBody.from),
            eq(EdgeTypeTable.to, nameBody.to)
          ))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: "Invalid update type. Must be 'full' or 'name'" },
          { status: 400 }
        );
    }

    if (!updatedEdgeType?.length) {
      return NextResponse.json(
        { error: "Edge type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedEdgeType[0]);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Name parameter is required" },
        { status: 400 }
      );
    }

    const deletedEdgeType = await db
      .delete(EdgeTypeTable)
      .where(eq(EdgeTypeTable.name, name))
      .returning();

    if (!deletedEdgeType.length) {
      return NextResponse.json(
        { error: "Edge type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(deletedEdgeType[0]);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}
