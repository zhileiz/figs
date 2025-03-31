import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NodeTypeTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { 
  nodeTypeSchema, 
  nodeNameChangeSchema, 
  nodePositionChangeSchema 
} from "@/lib/validations/node-type";

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
      // If no name parameter is provided, return all node types
      const nodeTypes = await db.select().from(NodeTypeTable);
      return NextResponse.json(nodeTypes);
    } else {
      // If name parameter is provided, return the specific node type
      const node = await db
        .select()
        .from(NodeTypeTable)
        .where(eq(NodeTypeTable.name, name))
        .limit(1);
      
      if (!node[0]) {
        return NextResponse.json(
          { error: "Node type not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(node[0]);
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
    const body = nodeTypeSchema.parse(json);

    // Convert name to SCREAMING_SNAKE_CASE
    const transformedBody = {
      ...body,
      name: toScreamingSnakeCase(body.name)
    };

    const nodeType = await db.insert(NodeTypeTable).values(transformedBody).returning();

    return NextResponse.json(nodeType[0], { status: 201 });
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

    let updatedNodeType;

    switch (updateType) {
      case "full":
        const fullBody = nodeTypeSchema.parse(json);
        const transformedFullBody = {
          ...fullBody,
          name: toScreamingSnakeCase(fullBody.name)
        };
        updatedNodeType = await db
          .update(NodeTypeTable)
          .set(transformedFullBody)
          .where(eq(NodeTypeTable.name, fullBody.name))
          .returning();
        break;

      case "name":
        const nameBody = nodeNameChangeSchema.parse(json);
        const newName = toScreamingSnakeCase(nameBody.name);
        updatedNodeType = await db
          .update(NodeTypeTable)
          .set({ name: newName })
          .where(eq(NodeTypeTable.name, nameBody.old_name))
          .returning();
        break;

      case "position":
        const posBody = nodePositionChangeSchema.parse(json);
        updatedNodeType = await db
          .update(NodeTypeTable)
          .set({ x_pos: posBody.x_pos, y_pos: posBody.y_pos })
          .where(eq(NodeTypeTable.name, posBody.name))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: "Invalid update type. Must be 'full', 'name', or 'position'" },
          { status: 400 }
        );
    }

    if (!updatedNodeType?.length) {
      return NextResponse.json(
        { error: "Node type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedNodeType[0]);
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

    const deletedNodeType = await db
      .delete(NodeTypeTable)
      .where(eq(NodeTypeTable.name, name))
      .returning();

    if (!deletedNodeType.length) {
      return NextResponse.json(
        { error: "Node type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(deletedNodeType[0]);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}
