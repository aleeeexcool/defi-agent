import { NextResponse } from 'next/server';
import { getClient } from '@/app/lib/agentkit';
import { isAddress, formatUnits } from 'viem/utils';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

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
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const KNOWN_TOKENS: Record<string, `0x${string}`> = {
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export async function POST(req: Request) {
  try {
    const client = await getClient();
    const { tokenAddress: inputToken } = await req.json();

    const tokenAddress = isAddress(inputToken)
      ? inputToken
      : KNOWN_TOKENS[inputToken.toUpperCase()];

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json(
        { error: 'Invalid or unknown token address provided.' },
        { status: 400 }
      );
    }

    const walletAddress = (await client.getAddress()).address;

    // Use public client to read allowance
    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.ALCHEMY_API_KEY_MAINNET_URL!),
    });

    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [walletAddress, ROUTER_ADDRESS],
    });

    if (allowance === BigInt(0)) {
      return NextResponse.json({
        alreadyZero: true,
        message: 'Allowance already zero — nothing to revoke.',
      });
    }

    // Proceed with onchain revoke
    const { txHash } = await client.sendOnchainAction({
      contractAddress: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, BigInt(0)],
    });

    return NextResponse.json({
      success: true,
      message: 'Allowance successfully revoked.',
      txHash,
    });
  } catch (error: any) {
    console.error('[RemoveTokenAllowance] Error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke token allowance' },
      { status: 500 }
    );
  }
}
