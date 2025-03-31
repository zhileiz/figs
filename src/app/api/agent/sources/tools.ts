import { tool } from 'ai';
import { db } from '@/lib/db';
import { NodeTypeTable, EdgeTypeTable } from '@/lib/db/schema';
import { z } from 'zod';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { driver } from '@/lib/memgraph'
import Papa from 'papaparse';

const endpoint = process.env.S3_ENDPOINT;

const s3Client = new S3Client({
    endpoint: endpoint,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'any',
        secretAccessKey: process.env.S3_SECRET_KEY || 'any',
    },
    region: 'us-east-1',
    forcePathStyle: true
});

const downloadCSV = async (csvFilePath: string) => {
    const urlObj = new URL(csvFilePath);
    const pathParts = urlObj.pathname.split('/');
    // The last part of the path should be the file name
    const fileName = pathParts[pathParts.length - 1];

    const command = new GetObjectCommand({
        Bucket: 'testbucket', // Matching the bucket name used in upload
        Key: fileName
    });

    const response = await s3Client.send(command);
    const text = await response.Body?.transformToString('utf-8');
    return text;
}


async function getCSVSchema(csvFilePath: string) {
    const text = await downloadCSV(csvFilePath);
    if (!text) {
        return "Could not read file as CSV. Download failed.";
    }
    const csv = Papa.parse(text, { header: true });
    const fields = csv.meta.fields;
    if (!fields) {
        return "Could not read file as CSV. Parsing failed.";
    }
    return `The CSV file has the following fields: ${fields.join(', ')}`;
}

export const getCSVSchemaTool = tool({
    description: 'Get the schema of a CSV file',
    parameters: z.object({
        csvFilePath: z.string().describe('The file path of the CSV file')
    }),
    execute: async (params) => {
        return getCSVSchema(params.csvFilePath);
    }
});

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

export const sampleCSVData = tool({
    description: 'Get a sample of the CSV data',
    parameters: z.object({
        csvFilePath: z.string().describe('The file path of the CSV file')
    }),
    execute: async (params) => {
        const text = await downloadCSV(params.csvFilePath);
        if (!text) {
            return "Could not read file as CSV. Download failed.";
        }
        const csv = Papa.parse(text, { header: true });
        const totalRows = csv.data.length;
        const numSamples = Math.min(5, totalRows);
        // Generate random indices
        const indices = new Set<number>();
        while (indices.size < numSamples) {
            indices.add(Math.floor(Math.random() * totalRows));
        }
        const res = Array.from(indices).map(index => csv.data[index]);
        return res;
    }
});

export const insertNodesToKG = async (nodes: { nodeType: string, properties: Record<string, string> }[], csvFilePath: string, id_field: string | undefined) => {
    const session = driver.session();

    // Filter out nodes where all properties are empty strings
    const validNodes = nodes.filter(node =>
        Object.values(node.properties).some(value => value !== '')
    );

    let successCount = 0;
    let errorCount = 0;
    let firstError: { nodeType: string; properties: Record<string, string>; error: string } | null = null;

    try {
        for (const node of validNodes) {
            try {
                // Add csvFilePath to properties
                const propertiesWithSource: Record<string, string> = {
                    ...node.properties,
                    source_path: csvFilePath
                };

                // If id_field is specified, use that property as the node ID
                let createQuery;
                console.log("propertiesWithSource", propertiesWithSource);
                console.log("id_field", id_field);
                if (id_field && id_field in propertiesWithSource) {
                    // Remove the id field from properties since it will be set as the node ID
                    const { [id_field]: idValue } = propertiesWithSource;
                    createQuery = `
                        CREATE (n:${node.nodeType} {id: "${idValue}", ${Object.entries(propertiesWithSource).map(([key, value]) => `${key}: "${value}"`).join(', ')}})
                        RETURN n
                    `;
                    console.log(`CREATE QUERY WITH ID FIELD ${id_field}`, createQuery);
                } else {
                    createQuery = `
                        CREATE (n:${node.nodeType} {${Object.entries(propertiesWithSource).map(([key, value]) => `${key}: "${value}"`).join(', ')}})
                        RETURN n
                    `;
                    console.log(`CREATE QUERY WITHOUT ID FIELD ${id_field}`, createQuery);
                }

                const result = await session.run(createQuery);

                if (result.records.length > 0) {
                    successCount++;
                }
            } catch (error) {
                errorCount++;
                if (!firstError) {
                    firstError = {
                        nodeType: node.nodeType,
                        properties: node.properties,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
                console.error('Error creating node:', error);
            }
        }

        return {
            total: validNodes.length,
            successful: successCount,
            failed: errorCount,
            firstError: firstError
        };
    } catch (error) {
        console.error('Session error:', error);
        return {
            total: validNodes.length,
            successful: successCount,
            failed: errorCount + (validNodes.length - (successCount + errorCount)),
            firstError: firstError || {
                nodeType: 'unknown',
                properties: {},
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    } finally {
        await session.close();
    }
}

export const createNodeInKGForCSV = tool({
    description: 'Create nodes in the knowledge graph for the entire CSV file',
    parameters: z.object({
        nodeType: z.string().describe(`
            The exact name of the node type in the KG to create. 
            If you are unsure, use the getAllNodeSchemasFromKG tool to get all the node types in the KG.
        `),
        fieldNamesArray: z.array(z.string()).describe(`
            The names of the properties of the node type, ordered as they appear in the rows of the CSV file. 
            If you are unsure, use the sampleCSVData tool to get a sample of the CSV data.
        `),
        csvFilePath: z.string().describe('The file path of the CSV file'),
        id_field: z.optional(z.string()).describe(`
            The name of the field in the CSV file that should be used as the id of the node. 
            If not provided, the node will be created without an id. 
            Make sure the id_field is the property name in the node type schema.
        `)
    }),
    execute: async (params) => {
        const text = await downloadCSV(params.csvFilePath);
        if (!text) {
            return "Could not read file as CSV. Download failed.";
        }
        const csv = Papa.parse(text, { header: true });
        const fields = csv.meta.fields;
        if (!fields) {
            return "Could not read file as CSV. Parsing failed.";
        } else if (fields.length !== params.fieldNamesArray.length) {
            return "The number of fields in the CSV file does not match the number of field names provided. Please try again.";
        }
        try {
            const rows = csv.data as Record<string, string>[];
            const nodes = rows.map((row) => {
                const properties: Record<string, string> = {};
                params.fieldNamesArray.forEach((fieldName, index) => {
                    properties[fieldName] = row[fields[index]] || '';
                });
                return {
                    nodeType: params.nodeType,
                    properties
                };
            });
            const creationResults = await insertNodesToKG(nodes, params.csvFilePath, params.id_field);
            return creationResults;
        } catch (error: unknown) {
            console.error('Error creating nodes:', error);
            return {
                success: false,
                error: 'An error occurred while creating nodes',
                results: null
            };
        }
    }
});

export const insertEdgesToKG = async (edges: { edgeType: string, properties: Record<string, string>, fromNodeId: string, toNodeId: string, fromNodeType: string, toNodeType: string }[], csvFilePath: string) => {
    const session = driver.session();

    // First filter out edges with empty IDs
    const nonEmptyEdges = edges.filter(edge => edge.fromNodeId !== '' && edge.toNodeId !== '');
    
    let successCount = 0;
    let errorCount = 0;
    let firstError: { 
        edgeType: string;
        fromNodeId: string;
        toNodeId: string;
        properties: Record<string, string>;
        error: string 
    } | null = null;

    try {
        for (const edge of nonEmptyEdges) {
            try {
                // Format edge type to uppercase and replace spaces with underscores
                const formattedEdgeType = edge.edgeType.toUpperCase().replace(/\s+/g, '_');
                
                // Check if both nodes exist
                const checkResult = await session.run(`
                    MATCH (n1:${edge.fromNodeType} {id: $fromId}), (n2:${edge.toNodeType} {id: $toId})
                    RETURN n1, n2
                `, { fromId: edge.fromNodeId, toId: edge.toNodeId });

                if (checkResult.records.length === 0) {
                    errorCount++;
                    if (!firstError) {
                        firstError = {
                            edgeType: formattedEdgeType,
                            fromNodeId: edge.fromNodeId,
                            toNodeId: edge.toNodeId,
                            properties: edge.properties,
                            error: 'One or both nodes not found'
                        };
                    }
                    continue;
                }

                // Add csvFilePath to properties
                const propertiesWithSource = {
                    ...edge.properties,
                    source_path: csvFilePath
                };

                // Try to create the edge
                const createResult = await session.run(`
                    MATCH (n1:${edge.fromNodeType} {id: $fromId}), (n2:${edge.toNodeType} {id: $toId})
                    CREATE (n1)-[e:${formattedEdgeType} {${Object.entries(propertiesWithSource).map(([key, value]) => `${key}: "${value}"`).join(', ')}}]->(n2)
                    RETURN e
                `, { fromId: edge.fromNodeId, toId: edge.toNodeId });

                if (createResult.records.length > 0) {
                    successCount++;
                }
            } catch (error) {
                errorCount++;
                if (!firstError) {
                    firstError = {
                        edgeType: edge.edgeType,
                        fromNodeId: edge.fromNodeId,
                        toNodeId: edge.toNodeId,
                        properties: edge.properties,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
                console.error('Error creating edge:', error);
            }
        }

        return {
            total: nonEmptyEdges.length,
            successful: successCount,
            failed: errorCount,
            firstError: firstError
        };
    } catch (error) {
        console.error('Session error:', error);
        return {
            total: nonEmptyEdges.length,
            successful: successCount,
            failed: errorCount + (nonEmptyEdges.length - (successCount + errorCount)),
            firstError: firstError || {
                edgeType: 'unknown',
                fromNodeId: 'unknown',
                toNodeId: 'unknown',
                properties: {},
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    } finally {
        await session.close();
    }
}

export const createEdgesInKGForCSV = tool({
    description: 'Create edges in the knowledge graph for the entire CSV file',
    parameters: z.object({
        edgeType: z.string().describe(`
            The exact name of the edge type in the KG to create. 
            If you are unsure, use the getKGSchemas tool to get node and edge types in the KG.
        `),
        fromNodeColumnIdx: z.number().describe(`
            The index of the column in the CSV file that contains the node id of the node that the edge will be created from.
        `),
        fromNodeType: z.string().describe(`
            The exact name of the node type of the node that the edge will be created from.
            If you are unsure, use the getKGSchemas tool to get node and edge types in the KG.
        `),
        toNodeColumnIdx: z.number().describe(`
            The index of the column in the CSV file that contains the node id of the node that the edge will be created to.
        `),
        toNodeType: z.string().describe(`
            The exact name of the node type of the node that the edge will be created to.
            If you are unsure, use the getKGSchemas tool to get node and edge types in the KG.
        `),
        fieldNamesArray: z.array(z.string()).describe(`
            The names of the properties of the edgeType, as specified in the edgeType schema, ordered as they appear in the rows of the CSV file.
            Make sure to exclude the fromNodeColumnIdx and toNodeColumnIdx columns of the CSV file.
            If you are unsure what properties or fields are available, use the sampleCSVData tool to get a sample of the CSV data, 
            and double check the edgeType schema using the getKGSchemas tool to ensure the field names are correct.  
        `),
        csvFilePath: z.string().describe('The file path of the CSV file')
    }),
    execute: async (params) => {
        const text = await downloadCSV(params.csvFilePath);
        if (!text) {
            return "Could not read file as CSV. Download failed.";
        }
        const csv = Papa.parse(text, { header: true });
        const fields = csv.meta.fields;
        if (!fields) {
            return "Could not read file as CSV. Parsing failed.";
        } else if (fields.length !== params.fieldNamesArray.length + 2) {
            return "The number of fields in the CSV file does not match the number of field names provided. Please try again.";
        }
        try {
            const rows = csv.data as Record<string, string>[];
            const edges = rows.map((row) => {
                const properties: Record<string, string> = {};
                params.fieldNamesArray.forEach((fieldName, index) => {
                    properties[fieldName] = row[fields[index]] || '';
                });
                return {
                    edgeType: params.edgeType,
                    fromNodeId: row[fields[params.fromNodeColumnIdx]],
                    toNodeId: row[fields[params.toNodeColumnIdx]],
                    fromNodeType: params.fromNodeType,
                    toNodeType: params.toNodeType,
                    properties
                };
            });
            const creationResults = await insertEdgesToKG(edges, params.csvFilePath);
            return creationResults;
        } catch (error: unknown) {
            console.error('Error creating nodes:', error);
            return {
                success: false,
                error: 'An error occurred while creating nodes',
                results: null
            };
        }
    }
});