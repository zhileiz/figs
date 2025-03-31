import { NextResponse } from 'next/server'
import { driver } from '@/lib/memgraph'
import { db } from '@/lib/db'
import { SourcesTable, NodeTypeTable } from '@/lib/db/schema'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'any',
        secretAccessKey: process.env.S3_SECRET_KEY || 'any',
    },
    region: 'us-east-1',
    forcePathStyle: true
});

export async function DELETE() {
    try {
        // 1. Clear Memgraph
        let deletedNodesCount = 0
        const graphSession = driver.session()
        try {
            const graphResult = await graphSession.run(
                `MATCH (n)
                 DETACH DELETE n
                 RETURN count(n) as deletedCount`
            )
            deletedNodesCount = graphResult.records[0].get('deletedCount').toNumber()
        } finally {
            await graphSession.close()
        }

        // 2. Clear S3 bucket
        const listCommand = new ListObjectsV2Command({
            Bucket: 'testbucket'
        })
        const listResponse = await s3Client.send(listCommand)
        let deletedFilesCount = 0
        
        if (listResponse.Contents) {
            for (const object of listResponse.Contents) {
                if (object.Key) {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: 'testbucket',
                        Key: object.Key
                    })
                    await s3Client.send(deleteCommand)
                    deletedFilesCount++
                }
            }
        }

        // 3. Clear database tables
        await db.delete(SourcesTable)
        await db.delete(NodeTypeTable)

        return NextResponse.json({
            success: true,
            message: 'Project reset successful',
            details: {
                graphNodes: deletedNodesCount,
                s3Files: deletedFilesCount,
                databaseCleared: true
            }
        })
    } catch (error) {
        console.error('Error resetting project:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to reset project',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
