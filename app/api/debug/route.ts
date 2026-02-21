import { NextResponse } from 'next/server';
import { getAIConfig } from '@/lib/ai-service';

export async function GET() {
  const config = getAIConfig();
  
  return NextResponse.json({
    aiConfig: config,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    },
    timestamp: new Date().toISOString(),
  });
}
