import { tool } from 'ai';
import { z } from 'zod';
import { driver } from '@/lib/memgraph'
import { db } from '@/lib/db'
import { NodeTypeTable, EdgeTypeTable } from '@/lib/db/schema'

export const getKGSchemas = tool({
    description: 'Retrieve all node and edge schemas that exist in the knowledge graph',
    parameters: z.object({}),
    execute: async () => {
        try {
            const nodeTypes = await db.select().from(NodeTypeTable);
            const edgeTypes = await db.select().from(EdgeTypeTable);
            return {
                success: true,
                schemas: {
                    nodeTypes,
                    edgeTypes
                }
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

export const countNodes = tool({
    description: 'Count the number of nodes in the knowledge graph',
    parameters: z.object({}),
    execute: async () => {
        const count = await driver.executeQuery('MATCH (n) RETURN COUNT(n)');
        return { count };
    }
});

export const countEdges = tool({
    description: 'Count the number of edges in the knowledge graph',
    parameters: z.object({}),
    execute: async () => {
        const count = await driver.executeQuery('MATCH ()-[r]->() RETURN COUNT(r)');
        return { count };
    }
});

export const runCypherQuery = tool({
    description: 'Run a Cypher query on the knowledge graph, before you do this, (1) check the KG schemas (2) generate a query that is most likely to return the information you need (3) make sure the query is a READ query, not a WRITE query',
    parameters: z.object({ query: z.string().describe('The Cypher query to run') }),
    execute: async (params) => {
        console.log("QUERY", params.query);
        const result = await driver.executeQuery(params.query);
        return { result };
    }
});