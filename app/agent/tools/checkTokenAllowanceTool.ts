import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatUnits, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';

const KNOWN_TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
  EURC: {
    address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    decimals: 6,
  },
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
  },
};

const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export const CheckTokenAllowanceTool = new DynamicStructuredTool({
  name: 'check_token_allowance',
  description:
    "Checks how much of a token (e.g., EURC or USDC) is currently approved for the Aerodrome Router. Use when the user asks things like 'How much is approved?', 'What's my allowance?', or 'Did I approve EURC for Aerodrome?'",
  type: 'function',
  function: {
    name: 'check_token_allowance',
    description:
      'Check how much of a given ERC20 token is approved for the Aerodrome Router.',
    parameters: {
      type: 'object',
      properties: {
        tokenAddress: {
          type: 'string',
          description: 'ERC20 token address or name (e.g. EURC, USDC)',
        },
      },
      required: ['tokenAddress'],
    },
  },
  schema: z.object({
    tokenAddress: z
      .string()
      .describe('ERC20 token address (e.g. EURC or USDC address)'),
  }),
  func: async ({ tokenAddress }) => {
    const key = tokenAddress.toUpperCase();
    const known = KNOWN_TOKENS[key];
    const resolvedAddress = known?.address || (tokenAddress as `0x${string}`);
    let decimals = known?.decimals;

    // Fallback to read decimals if not known
    if (!decimals) {
      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(process.env.ALCHEMY_API_KEY_MAINNET_URL!),
        });

        decimals = await publicClient.readContract({
          address: resolvedAddress,
          abi: [
            {
              inputs: [],
              name: 'decimals',
              outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'decimals',
          args: [],
        });
      } catch (e) {
        console.warn('[CheckTokenAllowanceTool] Failed to fetch decimals, defaulting to 18');
        decimals = 18;
      }
    }

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/agent/check-token-allowance`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress: resolvedAddress }),
    });

    if (!res.ok) {
      console.error(
        '[CheckTokenAllowanceTool] Error:',
        res.status,
        await res.text()
      );
      throw new Error('Failed to fetch allowance');
    }

    const data = await res.json();

    const isUnlimited =
      data.allowance === MAX_UINT256 || data.allowance === BigInt(MAX_UINT256).toString();

    const formatted = isUnlimited
      ? 'unlimited'
      : `${formatUnits(BigInt(data.allowance), decimals)} ${key}`;

    const message = isUnlimited
      ? `You have granted unlimited approval for ${key} to the Aerodrome Router.`
      : `You have approved ${formatted} for the Aerodrome Router.`;

    return {
      allowance: data.allowance,
      message,
    };
  },
});
