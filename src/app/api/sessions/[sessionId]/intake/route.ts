/**
 * API Route: Run Data Intake
 * POST /api/sessions/[sessionId]/intake
 * 
 * Triggered when user clicks "Proceed to Refine" on Page 1
 * Runs Data Intake algorithm and saves results to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAndSaveDataIntake } from '@/lib/session-intake';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }
    
    // Run Data Intake and save to database
    const intakeStats = await runAndSaveDataIntake(sessionId);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalPhrases: intakeStats.totalPhrases,
        uniqueWords: intakeStats.uniqueWords,
        uniquePrefixes: Object.keys(intakeStats.prefixes).length,
        uniqueSeedPlus1: Object.keys(intakeStats.seedPlus1).length,
        uniqueSeedPlus2: Object.keys(intakeStats.seedPlus2).length,
        uniqueSuffixes: Object.keys(intakeStats.suffixes).length,
        processedAt: intakeStats.processedAt,
      },
    });
  } catch (error) {
    console.error('Data Intake error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Data Intake failed' },
      { status: 500 }
    );
  }
}
