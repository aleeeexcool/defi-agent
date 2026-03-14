// scripts/test-swap.ts
import { encodeFunctionData } from 'viem';
import { getClient } from '@/app/lib/agentkit';

const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';

const ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' },
        ],
      },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

export async function testStableSwap() {
  const client = await getClient();

  const tokenIn = '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42'; // EURC
  const tokenOut = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC

  const amountIn = BigInt(5_000_000); // 5 EURC (6 decimals)
  const amountOutMin = BigInt(4_950_000); // Allowing 1% slippage

  const { address: walletAddress } = await client.getAddress();
  const deadline = Math.floor(Date.now() / 1000) + 1800;

  const routes = [
    [tokenIn, tokenOut, true, FACTORY_ADDRESS],
  ];

  // Optional: Log for inspection
  console.log('Sending contract write:', {
    contractAddress: ROUTER_ADDRESS,
    functionName: 'swapExactTokensForTokens',
    args: [amountIn, amountOutMin, routes, walletAddress, deadline],
  });

  const result = await client.sendOnchainAction({
    contractAddress: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: 'swapExactTokensForTokens',
    args: [amountIn, amountOutMin, routes, walletAddress, deadline],
    value: '0x0',
  });
  

  return result;
}
