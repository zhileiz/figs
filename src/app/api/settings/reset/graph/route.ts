import { NextResponse } from 'next/server'
import { driver } from '@/lib/memgraph'

export async function DELETE() {
    const session = driver.session()
    try {
        // Delete all relationships and nodes in the graph
        const result = await session.run(
            `MATCH (n)
             DETACH DELETE n
             RETURN count(n) as deletedCount`
        )
        const deletedCount = result.records[0].get('deletedCount').toNumber()
        
        return NextResponse.json({
            success: true,
            message: `Successfully deleted all nodes and relationships. ${deletedCount} nodes were removed.`,
            deletedCount
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Failed to reset graph',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    } finally {
        await session.close()
    }
}
