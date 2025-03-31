'use server'

import { driver } from '@/lib/memgraph'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const session = driver.session()
    const { searchParams } = new URL(req.url)
    const edgeType = searchParams.get('edgeType')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const source = searchParams.get('source')
    
    try {
        let query = 'MATCH '
        
        if (from && to && edgeType) {
            query += `(a:${from})-[r:${edgeType}]->(b:${to})`
        } else if (edgeType) {
            query += `()-[r:${edgeType}]-()`
        } else {
            query += '()-[r]->()'
        }
        
        if (source) {
            query += ` WHERE r.source_path = "${source}"`
        }
        
        if (from && to) {
            query += ' RETURN a.id as fromId, b.id as toId, r'
        } else {
            query += ' RETURN r'
        }

        const result = await session.run(query)
        return NextResponse.json({
            success: true,
            result: result.records.map((record) => {
                const res = record.get('r')
                return {
                    edgeId: res.elementId,
                    from: from && to ? record.get('fromId') : res.startNodeElementId,
                    to: from && to ? record.get('toId') : res.endNodeElementId,
                    type: res.type,
                    properties: res.properties
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
            `MATCH ()-[r]->() 
             WHERE r.source_path = $source 
             DELETE r 
             RETURN count(r) as deletedCount`,
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