'use server'

import { driver } from '@/lib/memgraph'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { NodeTypeTable } from '@/lib/db/schema'

export async function GET(req: Request) {
    const session = driver.session()
    const { searchParams } = new URL(req.url)
    const nodeType = searchParams.get('nodeType')
    const source = searchParams.get('source')
    try {
        const nodeTypes = await db.select().from(NodeTypeTable)
        const colorMap = nodeTypes.reduce((acc, nodeType) => {
            acc[nodeType.name] = nodeType.color || '#2563EB'
            return acc
        }, {} as Record<string, string>)
        
        const query = nodeType 
            ? `MATCH (n:${nodeType}) ${source ? `WHERE n.source_path = "${source}"` : ''} RETURN n`
            : 'MATCH (n) RETURN n'
            
        const result = await session.run(query)
        return NextResponse.json({
            success: true,
            result: result.records.map((record) => {
                const res = record.get('n')
                const color = colorMap[res.labels[0]] || '#2563EB'
                return {
                    id: res.elementId,
                    label: res.labels[0],
                    properties: res.properties,
                    color: color
                }
            })
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Failed to connect to Memgraph',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    } finally {
        await session.close()
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)
    const source = searchParams.get('source')
    if (!source) {
        return NextResponse.json({
            success: false,
            message: 'Source is required'
        }, { status: 400 })
    }
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (n) 
             WHERE n.source_path = $source 
             DELETE n 
             RETURN count(n) as deletedCount`,
            { source }
        )
        const deletedCount = result.records[0].get('deletedCount').toNumber()
        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${deletedCount} edges`,
            deletedCount
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Failed to delete edges',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    } finally {
        await session.close()
    }
}

export async function PUT(request: Request) {
    const { nodeId, properties } = await request.json();
    const session = driver.session()
    try {
        const nodeTypes = await db.select().from(NodeTypeTable)
        const colorMap = nodeTypes.reduce((acc, nodeType) => {
            acc[nodeType.name] = nodeType.color || '#2563EB'
            return acc
        }, {} as Record<string, string>)

        // Convert properties object to Cypher SET clause
        const setClause = Object.entries(properties)
            .map(([key, value]) => `n.${key} = "${value}"`)
            .join(', ');

        const query = `
            MATCH (n)
            WHERE elementId(n) = "${nodeId}"
            SET ${setClause}
            RETURN n
        `;

        const result = await session.run(query);
        
        if (result.records.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Node not found'
            }, { status: 404 });
        }

        const updatedNode = result.records[0].get('n');
        const color = colorMap[updatedNode.labels[0]] || '#2563EB'
        
        return NextResponse.json({
            success: true,
            result: {
                id: updatedNode.elementId,
                label: updatedNode.labels[0],
                properties: updatedNode.properties,
                color: color
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Failed to update node',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    } finally {
        await session.close();
    }
}