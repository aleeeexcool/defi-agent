import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const KNOWN_STABLECOINS: Record<string, `0x${string}`> = {
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  // Add other stablecoins as needed
};

export const ApproveStablecoinsTool = new DynamicStructuredTool({
  name: 'approve_stablecoins',
  description:
    'Approves stablecoins for use with Aerodrome DEX on Base Mainnet.',
  schema: z.object({
    tokens: z
      .array(z.string())
      .describe(
        "List of token symbols to approve (e.g. ['EURC', 'USDC']) or 'ALL' for all known stablecoins"
      ),
    approveMax: z
      .boolean()
      .describe(
        'Whether to approve maximum (unlimited) amount or not. Set to true for infinite approvals.'
      ),
  }),
  func: async ({ tokens, approveMax }) => {
    const baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/agent`;

    // Determine which tokens to approve
    let tokensToApprove: string[] = [];

    if (tokens.length === 1 && tokens[0].toUpperCase() === 'ALL') {
      tokensToApprove = Object.keys(KNOWN_STABLECOINS);
    } else {
      tokensToApprove = tokens
        .map((t) => t.toUpperCase())
        .filter((t) => KNOWN_STABLECOINS[t]);

      // If user provided tokens we don't know, inform them
      const unknownTokens = tokens.filter(
        (t) => !KNOWN_STABLECOINS[t.toUpperCase()]
      );
      if (unknownTokens.length > 0) {
        console.log(
          `Unknown tokens requested for approval: ${unknownTokens.join(', ')}`
        );
      }

      if (tokensToApprove.length === 0) {
        return {
          status: 'error',
          message: `Could not find any known stablecoins in your request. Known stablecoins are: ${Object.keys(
            KNOWN_STABLECOINS
          ).join(', ')}`,
        };
      }
    }

    // Process approvals for each token
    const results: Record<string, any> = {};
    let hasErrors = false;

    for (const tokenSymbol of tokensToApprove) {
      const tokenAddress = KNOWN_STABLECOINS[tokenSymbol];
      console.log(
        `Approving ${tokenSymbol} (${tokenAddress}) for Aerodrome Router, max=${approveMax}`
      );

      try {
        const approveRes = await fetch(`${baseUrl}/approve-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddress,
            // If approveMax is true, we don't need to specify amount as it defaults to max
            ...(approveMax ? {} : { amount: '1000000000' }), // A reasonably large amount if not max
          }),
        });

        if (!approveRes.ok) {
          const errorText = await approveRes.text();
          throw new Error(`API error: ${errorText}`);
        }

        const data = await approveRes.json();
        results[tokenSymbol] = {
          status: 'success',
          txHash: data.txHash,
          message: `${approveMax ? 'Unlimited' : 'Large'} approval submitted`,
        };
      } catch (error: any) {
        hasErrors = true;
        results[tokenSymbol] = {
          status: 'error',
          error: error.message || 'Unknown error',
          message: `Failed to approve ${tokenSymbol}`,
        };
      }
    }

    // Format the response for the user
    const successTokens = Object.keys(results).filter(
      (t) => results[t].status === 'success'
    );
    const failedTokens = Object.keys(results).filter(
      (t) => results[t].status === 'error'
    );

    let responseMessage = '';
    if (successTokens.length > 0) {
      responseMessage += `Successfully submitted ${
        approveMax ? 'unlimited' : 'large'
      } approvals for: ${successTokens.join(', ')}. `;
      responseMessage += `You can now swap these tokens without additional approval steps.`;
    }

    if (failedTokens.length > 0) {
      responseMessage += ` Failed to approve: ${failedTokens.join(
        ', '
      )}. Please try again later.`;
    }

    return {
      status: hasErrors && successTokens.length === 0 ? 'error' : 'success',
      message: responseMessage,
      details: results,
    };
  },
});
