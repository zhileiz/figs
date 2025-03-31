'use server'

import { driver } from '@/lib/memgraph'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const { source_path } = await request.json();
    const session = driver.session()
    try {
        const nodeResult = await session.run(`
            MATCH (n) WHERE n.source_path = "${source_path}" RETURN COUNT(n) as nodeCount
        `)
        const edgeResult = await session.run(`
            MATCH ()-[r]->() WHERE r.source_path = "${source_path}" RETURN COUNT(r) as edgeCount
        `)
        return NextResponse.json({
            success: true,
            result: {
                nodeCount: nodeResult.records[0].get('nodeCount').toNumber(),
                edgeCount: edgeResult.records[0].get('edgeCount').toNumber()
            }
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