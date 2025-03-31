import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SourcesTable } from '@/lib/db/schema';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    // Generate a unique file name
    const fileName = file.name;
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: 'testbucket',
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });
    
    await s3Client.send(command);
    
    // Generate the URL to access the file
    const fileUrl = `${endpoint}/testbucket/${fileName}`;
    
    // Insert the file information into the sources table
    const [newSource] = await db.insert(SourcesTable)
      .values({
        file_name: fileName,
        mime_type: file.type,
        file_size: file.size,
        file_url: fileUrl,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileName,
      fileUrl,
      source: newSource
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 