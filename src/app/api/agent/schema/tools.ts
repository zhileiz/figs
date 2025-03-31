import { tool } from 'ai';
import { nodeTypeSchema } from '@/lib/validations/node-type';
import { edgeTypeSchema } from '@/lib/validations/edge-type';
import { db } from '@/lib/db';
import { NodeTypeTable, EdgeTypeTable } from '@/lib/db/schema';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

function randomColor(existingColors: string[]) {
    const colorPalette = [
        "#4E79A7", // Steel Blue
        "#F28E2B", // Bright Orange
        "#E15759", // Coral Red
        "#76B7B2", // Teal Green
        "#59A14F", // Forest Green
        "#EDC948", // Saffron Yellow
        "#B07AA1", // Muted Purple
        "#FF9DA7", // Soft Pink
        "#9C755F", // Warm Brown
        "#BAB0AC"  // Slate Gray
      ];
    const palette = colorPalette.filter(color => !existingColors.includes(color));
    if (palette.length > 0) {
        return palette[Math.floor(Math.random() * palette.length)];
    } else {
        return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }
}

export const createNodeSchema = tool({
    description: 'Create a node schema for the knowledge graph',
    parameters: nodeTypeSchema,
    execute: async (params) => {
        try {
            const validatedData = nodeTypeSchema.parse(params);
            const existingColors = await db.select({ color: NodeTypeTable.color }).from(NodeTypeTable);
            const color = randomColor(existingColors.map(node => node.color || ''));

            const nodeType = await db.insert(NodeTypeTable).values({
                ...validatedData,
                color: color
            }).returning();

            return {
                success: true,
                schema: validatedData,
                message: `Successfully created schema for "${nodeType[0].name}" node type`
            };
        } catch (error: unknown) {
            console.error('Error creating schema:', error);

            // Check if this is a validation error
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: 'Schema validation failed: ' + error.message,
                    schema: params
                };
            }

            return {
                success: false,
                error: 'An error occurred while creating the schema',
                schema: params
            };
        }
    }
});

export const retrieveNodeSchema = tool({
    description: 'Retrieve a node schema that exists in the knowledge graph',
    parameters: z.object({
        name: z.string()
    }),
    execute: async (params) => {
        try {
            const nodeTypes = await db.select().from(NodeTypeTable).where(eq(NodeTypeTable.name, params.name));
            if (nodeTypes.length === 0) {
                return {
                    success: false,
                    error: 'Node type not found',
                    schema: params
                };
            } else {
                return {
                    success: true,
                    schema: nodeTypes[0]
                };
            }
        } catch (error: unknown) {
            console.error('Error retrieving schema:', error);
            return {
                success: false,
                error: 'An error occurred while retrieving the schema',
                schema: params
            };
        }
    }
});

export const getAllNodeSchemas = tool({
    description: 'Retrieve all node schemas that exist in the knowledge graph',
    parameters: z.object({}),
    execute: async () => {
        try {
            const nodeTypes = await db.select().from(NodeTypeTable);
            return {
                success: true,
                schemas: nodeTypes
            };
        } catch (error: unknown) {
            console.error('Error retrieving all schemas:', error);
            return {
                success: false,
                error: 'An error occurred while retrieving all schemas',
                schemas: []
            };
        }
    }
});

export const updateNodeSchema = tool({
    description: 'Update a node schema that exists in the knowledge graph',
    parameters: nodeTypeSchema,
    execute: async (params) => {
        try {
            const validatedData = nodeTypeSchema.parse(params);
            const nodeType = await db.update(NodeTypeTable).set({
                schema: validatedData.schema
            }).where(eq(NodeTypeTable.name, params.name)).returning();
            return {
                success: true,
                schema: validatedData,
                message: `Successfully updated schema for "${nodeType[0].name}" node type`
            };
        } catch (error: unknown) {
            console.error('Error updating schema:', error);
            return {
                success: false,
                error: 'An error occurred while updating the schema',
                schema: params
            };
        }
    }
});

export const deleteNodeSchema = tool({
    description: 'Delete a node schema that exists in the knowledge graph',
    parameters: z.object({
        name: z.string()
    }),
    execute: async (params) => {
        try {
            const nodeType = await db.delete(NodeTypeTable).where(eq(NodeTypeTable.name, params.name)).returning();
            return {
                success: true,
                message: `Successfully deleted schema for "${nodeType[0].name}" node type`
            };
        } catch (error: unknown) {
            console.error('Error deleting schema:', error);
            return {
                success: false,
                error: 'An error occurred while deleting the schema',
                schema: params
            };
        }
    }
});

export const renameNodeSchema = tool({
    description: 'Rename a node schema that exists in the knowledge graph',
    parameters: z.object({
        name: z.string(),
        newName: z.string()
    }),
    execute: async (params) => {
        try {
            const nodeType = await db.update(NodeTypeTable).set({ name: params.newName }).where(eq(NodeTypeTable.name, params.name)).returning();
            return {
                success: true,
                message: `Successfully renamed schema for "${nodeType[0].name}" node type`
            };
        } catch (error: unknown) {
            console.error('Error renaming schema:', error);
            return {
                success: false,
                error: 'An error occurred while renaming the schema',
                schema: params
            };
        }
    }
});

export const createEdgeSchema = tool({
    description: 'Create an edge schema that exists in the knowledge graph',
    parameters: edgeTypeSchema,
    execute: async (params) => {
        try {
            const validatedData = edgeTypeSchema.parse(params);
            
            const edgeType = await db.insert(EdgeTypeTable).values(validatedData).returning();
            
            return {
                success: true,
                schema: validatedData,
                message: `Successfully created schema for "${edgeType[0].name}" edge type`
            };
        } catch (error: unknown) {
            console.error('Error creating edge schema:', error);
            
            // Check if this is a validation error
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: 'Schema validation failed: ' + error.message,
                    schema: params
                };
            }
            
            return {
                success: false,
                error: 'An error occurred while creating the edge schema',
                schema: params
            };
        }
    }
});

export const retrieveEdgeSchema = tool({
    description: 'Retrieve an edge schema that exists in the knowledge graph',
    parameters: z.object({
        name: z.string(),
        from: z.string(),
        to: z.string()
    }),
    execute: async (params) => {
        try {
            const edgeTypes = await db.select().from(EdgeTypeTable).where(
                and(
                    eq(EdgeTypeTable.name, params.name),
                    eq(EdgeTypeTable.from, params.from),
                    eq(EdgeTypeTable.to, params.to)
                )
            );
            if (edgeTypes.length === 0) {
                return {
                    success: false,
                    error: 'Edge type not found',
                    schema: params
                };
            } else {
                return {
                    success: true,
                    schema: edgeTypes[0]
                };
            }
        } catch (error: unknown) {
            console.error('Error retrieving edge schema:', error);
            return {
                success: false,
                error: 'An error occurred while retrieving the edge schema',
                schema: params
            };
        }
    }
});

export const getAllEdgeSchemas = tool({
    description: 'Retrieve all edge schemas that exist in the knowledge graph',
    parameters: z.object({}),
    execute: async () => {
        try {
            const edgeTypes = await db.select().from(EdgeTypeTable);
            return {
                success: true,
                schemas: edgeTypes
            };
        } catch (error: unknown) {
            console.error('Error retrieving all edge schemas:', error);
            return {
                success: false,
                error: 'An error occurred while retrieving all edge schemas',
                schemas: []
            };
        }
    }
});

export const updateEdgeSchema = tool({
    description: 'Update an edge schema that exists in the knowledge graph',
    parameters: edgeTypeSchema,
    execute: async (params) => {
        try {
            const validatedData = edgeTypeSchema.parse(params);
            const edgeType = await db.update(EdgeTypeTable).set({
                schema: validatedData.schema
            }).where(
                and(
                    eq(EdgeTypeTable.name, params.name),
                    eq(EdgeTypeTable.from, params.from),
                    eq(EdgeTypeTable.to, params.to)
                )
            ).returning();
            return {
                success: true,
                schema: validatedData,
                message: `Successfully updated schema for "${edgeType[0].name}" edge type`
            };
        } catch (error: unknown) {
            console.error('Error updating edge schema:', error);
            return {
                success: false,
                error: 'An error occurred while updating the edge schema',
                schema: params
            };
        }
    }
});

export const deleteEdgeSchema = tool({
    description: 'Delete an edge schema that exists in the knowledge graph',
    parameters: z.object({
        name: z.string(),
        from: z.string(),
        to: z.string()
    }),
    execute: async (params) => {
        try {
            const edgeType = await db.delete(EdgeTypeTable).where(
                and(
                    eq(EdgeTypeTable.name, params.name),
                    eq(EdgeTypeTable.from, params.from),
                    eq(EdgeTypeTable.to, params.to)
                )
            ).returning();
            return {
                success: true,
                message: `Successfully deleted schema for "${edgeType[0].name}" edge type`
            };
        } catch (error: unknown) {
            console.error('Error deleting edge schema:', error);
            return {
                success: false,
                error: 'An error occurred while deleting the edge schema',
                schema: params
            };
        }
    }
});

export const renameEdgeSchema = tool({
    description: 'Rename an edge schema that exists in the knowledge graph',
    parameters: z.object({
        name: z.string(),
        from: z.string(),
        to: z.string(),
        newName: z.string()
    }),
    execute: async (params) => {
        try {
            const edgeType = await db.update(EdgeTypeTable).set({ name: params.newName }).where(
                and(
                    eq(EdgeTypeTable.name, params.name),
                    eq(EdgeTypeTable.from, params.from),
                    eq(EdgeTypeTable.to, params.to)
                )
            ).returning();
            return {
                success: true,
                message: `Successfully renamed schema for "${edgeType[0].name}" edge type`
            };
        } catch (error: unknown) {
            console.error('Error renaming edge schema:', error);
            return {
                success: false,
                error: 'An error occurred while renaming the edge schema',
                schema: params
            };
        }
    }
});

