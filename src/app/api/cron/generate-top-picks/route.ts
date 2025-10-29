import { NextRequest, NextResponse } from 'next/server';
import { generateTopPicks } from '@/lib/analytics/top-picks';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting top picks generation...');
    
    const result = await generateTopPicks();
    
    if (result.success) {
      console.log(`Top picks generation completed: ${result.picksGenerated} picks generated`);
      
      return NextResponse.json({
        success: true,
        message: 'Top picks generation completed',
        results: {
          picksGenerated: result.picksGenerated,
          errors: result.errors,
        },
      });
    } else {
      console.error('Top picks generation failed:', result.errors);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Top picks generation failed',
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Top picks generation failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Top picks generation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
