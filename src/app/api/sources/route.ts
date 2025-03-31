import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SourcesTable } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { driver } from '@/lib/memgraph';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

export async function GET(request: NextRequest) {
  try {
    // Fetch all sources from the database, ordered by most recent first
    const sources = await db.select()
      .from(SourcesTable)
      .orderBy(desc(SourcesTable.created_at));
    
    return NextResponse.json({
      success: true,
      sources,
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch sources',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sid } = await request.json();
    
    if (!sid) {
      return NextResponse.json({
        success: false,
        message: 'Source ID is required'
      }, { status: 400 });
    }

    const source = await db.select()
      .from(SourcesTable)
      .where(eq(SourcesTable.id, parseInt(sid)))
      .orderBy(desc(SourcesTable.created_at));
    
    return NextResponse.json({
      success: true,
      source
    });
  } catch (error) {
    console.error('Error fetching source details:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch source details',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Source ID is required'
      }, { status: 400 });
    }

    // Get the source first to get the file URL
    const source = await db.select().from(SourcesTable).where(eq(SourcesTable.id, id)).limit(1);
    if (!source[0]) {
      return NextResponse.json({
        success: false,
        message: 'Source not found'
      }, { status: 404 });
    }

    // Delete from S3
    const urlObj = new URL(source[0].file_url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    const deleteCommand = new DeleteObjectCommand({
      Bucket: 'testbucket',
      Key: fileName
    });
    await s3Client.send(deleteCommand);

    // Delete from Memgraph
    const session = driver.session();
    try {
      await session.run(`
        MATCH (n) WHERE n.source_path = "${source[0].file_url}"
        DETACH DELETE n
      `);
    } finally {
      await session.close();
    }

    // Delete from database
    await db.delete(SourcesTable).where(eq(SourcesTable.id, id));

    return NextResponse.json({
      success: true,
      message: 'Source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete source',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 