import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const CheckNativeBalanceTool = new DynamicStructuredTool({
  name: 'check_native_balance',
  description: "Checks the agent's ETH balance on Base Mainnet.",
  schema: z.object({}),
  func: async () => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/agent/check-native-balance`;

    const res = await fetch(url, { method: 'POST' });

    if (!res.ok) {
      console.error(
        '[CheckNativeBalanceTool] Failed:',
        res.status,
        await res.text()
      );
      throw new Error('Failed to fetch ETH balance.');
    }

    const data = await res.json();
    console.log('[CheckNativeBalanceTool] Fetched balance:', data);

    return { ETH: data.balance }; // MUST return object
  },
});
