import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NodeTypeTable } from '@/lib/db/schema';

// GET /api/db-status - Check database connection
export async function GET() {
  try {
    // Try to query the database
    await db.select().from(NodeTypeTable).limit(1);
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to the database!',
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to the database. Check your configuration.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 