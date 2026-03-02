import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const KNOWN_TOKENS: Record<string, `0x${string}`> = {
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export const SwapTokensTool = new DynamicStructuredTool({
  name: 'swap_tokens',
  description: 'Swaps tokens using the Aerodrome Router on Base Mainnet.',
  schema: z.object({
    tokenInName: z
      .string()
      .describe('The symbol or address of the token being swapped from.'),
    tokenOutName: z
      .string()
      .describe('The symbol or address of the token being swapped to.'),
    amountInHuman: z
      .string()
      .describe("The amount to swap (in human-readable form, e.g., '5')."),
    maxApprove: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether to approve maximum (unlimited) amount instead of just the swap amount.'),
  }),
  func: async ({ tokenInName, tokenOutName, amountInHuman, maxApprove = false }) => {
    const tokenInAddress = KNOWN_TOKENS[tokenInName.toUpperCase()] || tokenInName;
    const tokenOutAddress = KNOWN_TOKENS[tokenOutName.toUpperCase()] || tokenOutName;
    const baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/agent`;

    try {
      const fetchDecimals = async (token: string) => {
        const res = await fetch(`${baseUrl}/fetch-token-decimals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenAddress: token }),
        });

        if (!res.ok) throw new Error(await res.text());

        const { decimals } = await res.json();
        return decimals;
      };

      const inDecimals = await fetchDecimals(tokenInAddress);
      const amountInBigInt = BigInt(Math.floor(parseFloat(amountInHuman) * 10 ** inDecimals));
      if (amountInBigInt <= BigInt(0)) throw new Error(`Invalid swap amount: ${amountInHuman}`);

      const allowanceRes = await fetch(`${baseUrl}/check-token-allowance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: tokenInAddress }),
      });

      if (!allowanceRes.ok) throw new Error(await allowanceRes.text());

      const { allowance } = await allowanceRes.json();
      const allowanceBigInt = BigInt(allowance);
      let approvalStep = { needed: false } as any;

      if (allowanceBigInt < amountInBigInt) {
        const approveRes = await fetch(`${baseUrl}/approve-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddress: tokenInAddress,
            amount: maxApprove ? undefined : amountInBigInt.toString(),
          }),
        });

        if (!approveRes.ok) throw new Error(await approveRes.text());

        const approveData = await approveRes.json();
        approvalStep = {
          needed: true,
          success: true,
          txHash: approveData.txHash,
          message: `Approved ${maxApprove ? 'unlimited' : amountInHuman} ${tokenInName} for Aerodrome Router.\n\n[View on BaseScan](https://basescan.org/tx/${approveData.txHash})`
        };

        await new Promise((r) => setTimeout(r, 5000));
      } else {
        approvalStep = { needed: false, message: 'Approval not needed, sufficient allowance exists.' };
      }

      const swapRes = await fetch(`${baseUrl}/swap-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenInAddress,
          tokenOutAddress,
          amountIn: amountInBigInt.toString(),
        }),
      });

      if (!swapRes.ok) throw new Error(await swapRes.text());

      const swapData = await swapRes.json();
      let message = approvalStep.message + `\n\nSuccessfully swapped ${amountInHuman} ${tokenInName} to ${tokenOutName}.\n\n[View on BaseScan](https://basescan.org/tx/${swapData.txHash})`;

      return {
        status: 'success',
        message,
        approval: approvalStep,
        swap: {
          status: 'success',
          txHash: swapData.txHash,
          amountIn: amountInHuman,
          tokenIn: tokenInName,
          tokenOut: tokenOutName,
        },
      };
    } catch (error: any) {
      console.error('Swap Error:', error.message || error);
      return {
        status: 'error',
        message: `Swap failed: ${error.message || 'Unknown error occurred'}`,
        error: error.message,
      };
    }
  },
});
