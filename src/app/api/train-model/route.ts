import { NextRequest, NextResponse } from 'next/server';
import { pickGenerator } from '@/lib/analytics/pick-generator';

/**
 * Train the model on available historical data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting model training...');
    
    // Train the model using pickGenerator's training method
    await pickGenerator.trainModel();
    
    console.log('Model training complete');
    
    return NextResponse.json({
      success: true,
      message: 'Model training complete',
    });
  } catch (error) {
    console.error('Model training error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
