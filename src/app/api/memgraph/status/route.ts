'use server'

import { driver } from '@/lib/memgraph'
import { NextResponse } from 'next/server'

export async function GET() {
    const session = driver.session()
    try {
        await session.run('RETURN true')
        return NextResponse.json({
            success: true,
            message: 'Memgraph is running'
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