import { NextResponse } from 'next/server';
import { getClient } from '@/app/lib/agentkit';
import { Abi } from 'viem';

const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';

const ROUTER_ABI: Abi = [
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
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tokenInAddress, tokenOutAddress, amountIn, minAmountOut } = body;

    if (!tokenInAddress || !tokenOutAddress || !amountIn) {
      return NextResponse.json({ error: 'Missing required swap parameters' }, { status: 400 });
    }

    const client = await getClient();
    const { address: walletAddress } = await client.getAddress();

    const amountInString = amountIn.toString();
    const minAmountOutString = minAmountOut
      ? minAmountOut.toString()
      : Math.floor(Number(amountInString) * 0.99).toString();
    const deadline = Math.floor(Date.now() / 1000) + 1800;

    const route = {
      from: tokenInAddress,
      to: tokenOutAddress,
      stable: false,
      factory: FACTORY_ADDRESS,
    };

    try {
      const { txHash } = await client.sendOnchainAction({
        contractAddress: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountInString,
          minAmountOutString,
          [route],
          walletAddress,
          deadline,
        ],
      });

      return NextResponse.json({
        success: true,
        txHash,
        message: 'Swap transaction submitted successfully (stable=false)',
        basescanUrl: `https://basescan.org/tx/${txHash}`,
      });
    } catch (error) {
      console.warn('Stable=false route failed, retrying with stable=true...');

      try {
        const fallbackRoute = { ...route, stable: true };
        const { txHash } = await client.sendOnchainAction({
          contractAddress: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [
            amountInString,
            minAmountOutString,
            [fallbackRoute],
            walletAddress,
            deadline,
          ],
        });

        return NextResponse.json({
          success: true,
          txHash,
          message: 'Swap transaction submitted successfully (fallback stable=true)',
          basescanUrl: `https://basescan.org/tx/${txHash}`,
        });
      } catch (fallbackError: any) {
        console.error('Swap Fallback Error:', fallbackError);

        const errorMessage = fallbackError.message || fallbackError.toString();
        const apiMessage = fallbackError.apiMessage || '';
        const errorCode = fallbackError.apiCode || fallbackError.code || 'unknown_error';

        return NextResponse.json(
          {
            error: 'Swap transaction failed (fallback)',
            details: apiMessage || errorMessage || 'Unknown error',
            code: errorCode,
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Swap Error:', error);

    const errorMessage = error.message || error.toString();
    const apiMessage = error.apiMessage || '';
    const errorCode = error.apiCode || error.code || 'unknown_error';

    return NextResponse.json(
      {
        error: 'Swap transaction failed',
        details: apiMessage || errorMessage || 'Unknown error',
        code: errorCode,
      },
      { status: 500 }
    );
  }
}



// import { NextResponse } from 'next/server';
// import { getClient } from '@/app/lib/agentkit';
// import { Abi, encodeFunctionData } from 'viem';

// // Aerodrome Router and Factory addresses
// const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
// const FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';

// // Simplified ABI with just the swap function we need
// const ROUTER_ABI: Abi = [
//   {
//     name: 'swapExactTokensForTokens',
//     type: 'function',
//     stateMutability: 'nonpayable',
//     inputs: [
//       { name: 'amountIn', type: 'uint256' },
//       { name: 'amountOutMin', type: 'uint256' },
//       {
//         name: 'routes',
//         type: 'tuple[]',
//         components: [
//           { name: 'from', type: 'address' },
//           { name: 'to', type: 'address' },
//           { name: 'stable', type: 'bool' },
//           { name: 'factory', type: 'address' },
//         ],
//       },
//       { name: 'to', type: 'address' },
//       { name: 'deadline', type: 'uint256' },
//     ],
//     outputs: [{ name: 'amounts', type: 'uint256[]' }],
//   },
// ];

// // ERC20 token approval ABI
// const ERC20_ABI: Abi = [
//   {
//     name: 'approve',
//     type: 'function',
//     stateMutability: 'nonpayable',
//     inputs: [
//       { name: 'spender', type: 'address' },
//       { name: 'amount', type: 'uint256' },
//     ],
//     outputs: [{ name: 'success', type: 'bool' }],
//   },
// ];

// export async function POST(req: Request) {
//   let parsedBody: any = {};

//   try {
//     // Parse request body
//     const body = await req.json();
//     parsedBody = body;

//     // Initialize the client
//     const client = await getClient();

//     // Extract parameters
//     const { tokenInAddress, tokenOutAddress, amountIn, minAmountOut } = body;

//     // Validate required parameters
//     if (!tokenInAddress || !tokenOutAddress || !amountIn) {
//       return NextResponse.json(
//         { error: 'Missing required swap parameters' },
//         { status: 400 }
//       );
//     }

//     // Get wallet address
//     const { address: walletAddress } = await client.getAddress();

//     // Format amounts as strings
//     const amountInString = amountIn.toString();
//     const minAmountOutString = minAmountOut
//       ? minAmountOut.toString()
//       : Math.floor(Number(amountInString) * 0.99).toString();

//     // Set deadline 30 minutes from now
//     const deadline = Math.floor(Date.now() / 1000) + 1800;

//     console.log(`===== SWAP ATTEMPT =====`);
//     console.log(`From: ${tokenInAddress}`);
//     console.log(`To: ${tokenOutAddress}`);
//     console.log(`Amount In: ${amountInString}`);
//     console.log(`Min Amount Out: ${minAmountOutString}`);
//     console.log(`Wallet: ${walletAddress}`);
//     console.log(`Deadline: ${deadline}`);

//     // Try a variety of different route formats to see if any work

//     // First, try with array of arrays (positional tuples) format
//     console.log(`Attempting swap with positional array format...`);
//     try {
//       // Create routes as a positional array matching the struct order exactly
//       const routesAsArrays = [
//         [
//           tokenInAddress, // from
//           tokenOutAddress, // to
//           false, // stable - try with false first
//           FACTORY_ADDRESS, // factory
//         ],
//       ];

//       console.log(
//         `Routes (as arrays): ${JSON.stringify(routesAsArrays, null, 2)}`
//       );

//       const { txHash } = await client.sendOnchainAction({
//         contractAddress: ROUTER_ADDRESS,
//         abi: ROUTER_ABI,
//         functionName: 'swapExactTokensForTokens',
//         args: [
//           amountInString,
//           minAmountOutString,
//           routesAsArrays,
//           walletAddress,
//           deadline.toString(),
//         ],
//         value: '0x0',
//       });

//       console.log(
//         `✅ Swap transaction submitted successfully with array format!`
//       );
//       console.log(`Transaction hash: ${txHash}`);
//       console.log(`BaseScan URL: https://basescan.org/tx/${txHash}`);

//       return NextResponse.json({
//         success: true,
//         txHash,
//         message: 'Swap transaction submitted successfully',
//         basescanUrl: `https://basescan.org/tx/${txHash}`,
//       });
//     } catch (error: any) {
//       console.error(`❌ Array format swap failed: ${error}`);
//     }

//     // Second, try with object format but with stable=false
//     console.log(`Attempting swap with object format and stable=false...`);
//     try {
//       const routesAsObjects = [
//         {
//           from: tokenInAddress,
//           to: tokenOutAddress,
//           stable: false, // Try with false instead of true
//           factory: FACTORY_ADDRESS,
//         },
//       ];

//       console.log(
//         `Routes (as objects with stable=false): ${JSON.stringify(
//           routesAsObjects,
//           null,
//           2
//         )}`
//       );

//       const { txHash } = await client.sendOnchainAction({
//         contractAddress: ROUTER_ADDRESS,
//         abi: ROUTER_ABI,
//         functionName: 'swapExactTokensForTokens',
//         args: [
//           amountInString,
//           minAmountOutString,
//           routesAsObjects,
//           walletAddress,
//           deadline.toString(),
//         ],
//         value: '0x0',
//       });

//       console.log(
//         `✅ Swap transaction submitted successfully with object format!`
//       );
//       console.log(`Transaction hash: ${txHash}`);
//       console.log(`BaseScan URL: https://basescan.org/tx/${txHash}`);

//       return NextResponse.json({
//         success: true,
//         txHash,
//         message: 'Swap transaction submitted successfully',
//         basescanUrl: `https://basescan.org/tx/${txHash}`,
//       });
//     } catch (error: any) {
//       console.error(`❌ Object format swap failed: ${error}`);
//     }

//     // Third, try with stable=true
//     console.log(`Attempting swap with object format and stable=true...`);
//     try {
//       const routesAsObjectsStable = [
//         {
//           from: tokenInAddress,
//           to: tokenOutAddress,
//           stable: true,
//           factory: FACTORY_ADDRESS,
//         },
//       ];

//       console.log(
//         `Routes (as objects with stable=true): ${JSON.stringify(
//           routesAsObjectsStable,
//           null,
//           2
//         )}`
//       );

//       const { txHash } = await client.sendOnchainAction({
//         contractAddress: ROUTER_ADDRESS,
//         abi: ROUTER_ABI,
//         functionName: 'swapExactTokensForTokens',
//         args: [
//           amountInString,
//           minAmountOutString,
//           routesAsObjectsStable,
//           walletAddress,
//           deadline.toString(),
//         ],
//         value: '0x0',
//       });

//       console.log(`✅ Swap transaction submitted successfully!`);
//       console.log(`Transaction hash: ${txHash}`);
//       console.log(`BaseScan URL: https://basescan.org/tx/${txHash}`);

//       return NextResponse.json({
//         success: true,
//         txHash,
//         message: 'Swap transaction submitted successfully',
//         basescanUrl: `https://basescan.org/tx/${txHash}`,
//       });
//     } catch (error: any) {
//       console.error(`❌ Swap failed: ${error}`);

//       // Detailed error logging
//       console.log(`Full error details: ${JSON.stringify(error, null, 2)}`);

//       // We'll throw the error to be caught by the outer catch block
//       throw error;
//     }
//   } catch (error: any) {
//     console.error('Swap Error:', error);

//     // Extract error details
//     const errorMessage = error.message || error.toString();
//     const apiMessage = error.apiMessage || '';
//     const errorCode = error.apiCode || error.code || 'unknown_error';

//     console.log(`API Message: ${apiMessage}`);
//     console.log(`Error Message: ${errorMessage}`);

//     // Check if it's an approval error
//     if (
//       errorMessage.includes('allowance') ||
//       errorMessage.includes('approve') ||
//       apiMessage.includes('allowance') ||
//       apiMessage.includes('approve')
//     ) {
//       const tokenInAddress = parsedBody?.tokenInAddress || 'unknown_token';

//       return NextResponse.json(
//         {
//           error: 'Token approval required',
//           details: 'You need to approve the token before swapping',
//           code: 'approval_required',
//           approvalRequired: true,
//           tokenAddress: tokenInAddress,
//           spenderAddress: ROUTER_ADDRESS,
//           approvalInstructions: [
//             {
//               action: 'Approve the token first using this command:',
//               command: `curl -X POST ${process.env.NEXT_PUBLIC_SITE_URL}/api/agent/approve-tokens -H 'Content-Type: application/json' -d '{"tokenAddress": "${tokenInAddress}", "spenderAddress": "${ROUTER_ADDRESS}"}'`,
//             },
//           ],
//         },
//         { status: 400 }
//       );
//     }

//     // Return generic error for other cases
//     return NextResponse.json(
//       {
//         error: 'Swap transaction failed',
//         details: apiMessage || errorMessage || 'Unknown error',
//         code: errorCode,
//       },
//       { status: 500 }
//     );
//   }
// }
