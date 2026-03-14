import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// ERC20 ABI for decimals
const ERC20_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tokenAddress } = body;

    if (!tokenAddress || typeof tokenAddress !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid tokenAddress' },
        { status: 400 }
      );
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.ALCHEMY_API_KEY_MAINNET_URL!),
    });

    const formattedTokenAddress = tokenAddress as `0x${string}`;

    const decimalsRaw = await publicClient.readContract({
      address: formattedTokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
      args: [],
    });

    const decimals = Number(decimalsRaw);

    return NextResponse.json({ decimals });
  } catch (error: any) {
    console.error('[fetch-token-decimals] Error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
