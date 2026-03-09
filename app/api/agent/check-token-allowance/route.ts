import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';

const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export async function POST(req: Request) {
  try {
    const { tokenAddress } = await req.json();

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.ALCHEMY_API_KEY_MAINNET_URL!),
    });

    const smartWalletAddress =
      '0xdF1C7676c27a35cf460c350BDF7Fe90123109b1D' as `0x${string}`;

    const allowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [smartWalletAddress, ROUTER_ADDRESS],
    });

    return NextResponse.json({ allowance: allowance.toString() });
  } catch (error: any) {
    console.error('Allowance Check Error:', error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
