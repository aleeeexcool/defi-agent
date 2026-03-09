import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { formatUnits } from 'viem';

const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
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

    let tokenAddresses: string[] = [];

    if (body.tokenAddresses && Array.isArray(body.tokenAddresses)) {
      tokenAddresses = body.tokenAddresses;
    } else if (body.tokenAddress && typeof body.tokenAddress === 'string') {
      tokenAddresses = [body.tokenAddress]; // single token fallback
    } else {
      return NextResponse.json(
        { error: 'Missing or invalid tokenAddresses' },
        { status: 400 }
      );
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.ALCHEMY_API_KEY_MAINNET_URL!),
    });

    const walletAddress =
      '0xdF1C7676c27a35cf460c350BDF7Fe90123109b1D' as `0x${string}`;

    const results: Record<string, string> = {};

    for (const tokenAddress of tokenAddresses) {
      const formattedTokenAddress = tokenAddress as `0x${string}`;

      const decimalsRaw = await publicClient.readContract({
        address: formattedTokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: [],
      });

      const decimals = Number(decimalsRaw);

      const balanceRaw = await publicClient.readContract({
        address: formattedTokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      });

      results[tokenAddress] = formatUnits(balanceRaw as bigint, decimals);
    }

    if (tokenAddresses.length === 1) {
      return NextResponse.json({
        balances: results,
        balance: results[tokenAddresses[0]],
      });
    }

    return NextResponse.json({ balances: results });
  } catch (error: any) {
    console.error('[check-token-balance] Error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
