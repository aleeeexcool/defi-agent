import { NextResponse } from 'next/server';
import { getClient } from '@/app/lib/agentkit';

const ERC20_ABI = [
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
const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export async function POST(request: Request) {
  try {
    const client = await getClient();
    const body = await request.json().catch(() => ({}));

    const tokenAddress =
      body.tokenAddress || '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42';

    const amount = body.amount || MAX_UINT256;

    console.log(
      `Approving ${amount} of token ${tokenAddress} to router ${ROUTER_ADDRESS}`
    );

    const { txHash } = await client.sendOnchainAction({
      contractAddress: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, amount],
    });

    return NextResponse.json({
      success: true,
      message: 'Token approval submitted',
      txHash,
      tokenAddress,
      amount,
    });
  } catch (error: any) {
    console.error('Approve Tokens Error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
