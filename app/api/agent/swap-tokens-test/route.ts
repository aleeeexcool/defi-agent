// app/api/agent/swap-tokens-test/route.ts
import { NextResponse } from 'next/server';
import { testStableSwap } from '@/scripts/test-swap';

export async function POST() {
  try {
    const { txHash } = await testStableSwap();
    return NextResponse.json({ success: true, txHash });
  } catch (error) {
    console.error('Swap failed:', error);
    return NextResponse.json({ success: false, error: error?.message || 'unknown' }, { status: 500 });
  }
}
