import { S3Client, ListBucketsCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

// Get the endpoint from environment variable or use localhost for local development
const endpoint = process.env.S3_ENDPOINT;

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'any',
    secretAccessKey: process.env.S3_SECRET_KEY || 'any',
  },
  region: 'us-east-1',
  forcePathStyle: true
});

// Utility function with retry logic
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

export async function GET() {
  try {
    // Try to list buckets with retry logic
    const listResponse = await retryOperation(async () => {
      const command = new ListBucketsCommand({});
      return await s3Client.send(command);
    });
    
    // Check if we have any buckets, if not, create one
    if (!listResponse.Buckets || listResponse.Buckets.length === 0) {
      try {
        console.log('No buckets found, creating a test bucket...');
        const createCommand = new CreateBucketCommand({
          Bucket: 'testbucket'
        });
        await s3Client.send(createCommand);
        console.log('Test bucket created successfully.');
      } catch (error) {
        console.log('Failed to create bucket, but connection is working:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to S3',
      endpoint: endpoint,
      buckets: listResponse.Buckets?.map(b => b.Name) || []
    });
  } catch (error) {
    console.error('S3 connection error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to S3',
      endpoint: endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 