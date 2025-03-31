import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SourcesTable } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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

const downloadFile = async (url: string, encoding: string) => {
    // Extract file name from URL
    // The URL format is: ${endpoint}/testbucket/${fileName}
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The last part of the path should be the file name
    const fileName = pathParts[pathParts.length - 1];
    
    const command = new GetObjectCommand({
        Bucket: 'testbucket', // Matching the bucket name used in upload
        Key: fileName
    });
    
    const response = await s3Client.send(command);
    const text = await response.Body?.transformToString(encoding);
    return text;
}

export async function POST(request: NextRequest) {
  try {
    const { sid } = await request.json();

    // Fetch one source from the database
    const source = await db.select()
      .from(SourcesTable)
      .where(eq(SourcesTable.id, parseInt(sid)))
      .orderBy(desc(SourcesTable.created_at)).limit(1).then(res => res[0]);

    if (!source) { 
        return NextResponse.json({
            success: false,
            message: 'Source not found',
        }, { status: 404 });
    }

    if (!source.mime_type.includes('csv')) {
        return NextResponse.json({
            success: false,
            message: 'Source is not a CSV file',
        }, { status: 400 });
    }

    const fileData = await downloadFile(source.file_url, 'utf8');
    
    // Parse CSV data using PapaParse
    let rows: Record<string, string>[] = [];
    if (fileData) {
      const parseResult = Papa.parse<Record<string, string>>(fileData, {
        header: true,           // First line is headers
        skipEmptyLines: true,   // Skip empty lines
        transformHeader: (header) => header.trim(), // Trim whitespace from headers
        dynamicTyping: false    // Keep all values as strings
      });
      
      rows = parseResult.data;
    }
    
    return NextResponse.json({
      success: true,
      source,
      data: {
        rows,
        totalRows: rows.length
      }
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