// This quote tool is deprecated and no longer used by the agent
// You can safely remove this file from the toolchain registration

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    amountOut: null,
    tokenIn: null,
    tokenOut: null,
    amountIn: null,
    disabled: true,
    message: 'Quote functionality has been disabled. Please use direct swap logic.'
  });
}
