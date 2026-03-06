import { NextResponse } from 'next/server';
import { getClient } from '@/lib/agentkit';
import { parseUnits } from 'viem';
import axios from 'axios';

const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43'; // Aerodrome Router on Base
const TOKEN0_ADDRESS = '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42'; // EURC
const TOKEN1_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC

const ROUTER_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_tokenA', type: 'address' },
      { internalType: 'address', name: '_tokenB', type: 'address' },
      { internalType: 'uint256', name: '_amountADesired', type: 'uint256' },
      { internalType: 'uint256', name: '_amountBDesired', type: 'uint256' },
      { internalType: 'uint256', name: '_amountAMin', type: 'uint256' },
      { internalType: 'uint256', name: '_amountBMin', type: 'uint256' },
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'uint256', name: '_deadline', type: 'uint256' },
    ],
    name: 'addLiquidity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export async function POST() {
  try {
    const client = await getClient(); // Connect AgentKit client

    // Fetch recommended liquidity range
    const { data } = await axios.get('http://localhost:3000/api/range');

    const { tickLower, tickUpper } = data.tickRange;

    console.log('Using tick range:', tickLower, tickUpper);

    const amountToken0 = parseUnits('10', 6); // 10 EURC
    const amountToken1 = parseUnits('13', 6); // 13 USDC (slightly skewed to current price)

    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // +10 minutes

    const { txHash } = await client.sendOnchainAction({
      chainId: 8453, // Base Mainnet
      contractAddress: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [
        TOKEN0_ADDRESS,
        TOKEN1_ADDRESS,
        amountToken0,
        amountToken1,
        amountToken0, // minAmountA (for now: same as desired)
        amountToken1, // minAmountB
        client.account.address, // receiver
        deadline,
      ],
    });

    return NextResponse.json({ success: true, txHash });
  } catch (error: any) {
    console.error('Error adding liquidity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
