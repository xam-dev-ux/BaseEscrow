import { NextRequest, NextResponse } from 'next/server';

// Farcaster Mini App webhook endpoint
// Handles notifications and events from the Farcaster client

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log webhook events for debugging
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Handle different event types
    const { event, data } = body;

    switch (event) {
      case 'frame_added':
        // User added the mini app
        console.log('Mini app added by user:', data?.fid);
        break;

      case 'frame_removed':
        // User removed the mini app
        console.log('Mini app removed by user:', data?.fid);
        break;

      case 'notifications_enabled':
        // User enabled notifications
        console.log('Notifications enabled by user:', data?.fid);
        break;

      case 'notifications_disabled':
        // User disabled notifications
        console.log('Notifications disabled by user:', data?.fid);
        break;

      default:
        console.log('Unknown event type:', event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    status: 'ok',
    service: 'BaseEscrow Webhook'
  });
}
