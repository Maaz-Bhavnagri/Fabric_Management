import { NextResponse } from 'next/server';
import { simpleDb } from '@/lib/db-simple';

export async function GET() {
  try {
    const data = await simpleDb.healthCheck();
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: message,
        database: 'disconnected'
      }, 
      { status: 500 }
    );
  }
}
