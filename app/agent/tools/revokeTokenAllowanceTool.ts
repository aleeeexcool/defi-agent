import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { isAddress } from 'viem/utils';

const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';

const KNOWN_TOKENS: Record<string, `0x${string}`> = {
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export const RevokeTokenAllowanceTool = new DynamicStructuredTool({
  name: 'revoke_token_allowance',
  description:
    'Removes approval for a token (EURC or USDC) from the Aerodrome Router. Use when the user wants to revoke or remove token allowance.',
  schema: z.object({
    tokenAddress: z
      .string()
      .describe('Token address or symbol (e.g., EURC, USDC)'),
  }),
  func: async ({ tokenAddress }) => {
    const resolvedAddress = isAddress(tokenAddress)
      ? tokenAddress
      : KNOWN_TOKENS[tokenAddress.toUpperCase()];

    if (!resolvedAddress || !isAddress(resolvedAddress)) {
      throw new Error(
        `Unknown token symbol or invalid address: ${tokenAddress}`
      );
    }

    const tokenLabel =
      Object.entries(KNOWN_TOKENS).find(
        ([, addr]) => addr.toLowerCase() === resolvedAddress.toLowerCase()
      )?.[0] ?? resolvedAddress;

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/agent/revoke-token-allowance`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress: resolvedAddress }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('[RevokeTokenAllowanceTool] Error:', res.status, text);

      if (text.includes('already zero')) {
        return {
          message: `${tokenLabel} allowance for Aerodrome Router is already zero — nothing to revoke.`,
        };
      }

      throw new Error('Failed to revoke allowance. Please try again later.');
    }

    const data = JSON.parse(text);

    if (data.alreadyZero) {
      return {
        message: `${tokenLabel} allowance for Aerodrome Router is already zero — nothing to revoke.`,
      };
    }

    return {
      txHash: data.txHash,
      message: `Successfully revoked ${tokenLabel} allowance for Aerodrome Router.\n\n[View on BaseScan](https://basescan.org/tx/${data.txHash})`,
    };
  },
});
