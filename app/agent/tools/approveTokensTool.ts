import { AgentTool } from '@coinbase/agentkit';

export const ApproveTokensTool: AgentTool = {
  name: 'approve_tokens_for_router',
  description:
    'Approves the Aerodrome Router to pull unlimited EURC and USDC from the wallet.',
  type: 'function',
  function: {
    name: 'approve_tokens_for_router',
    description:
      'Sets unlimited approvals for EURC and USDC tokens for the Aerodrome Router.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  run: async () => {
    const res = await fetch('/api/agent/approve-tokens', { method: 'POST' });

    if (!res.ok) {
      throw new Error('Failed to approve tokens');
    }

    return `Tokens approved successfully for Aerodrome Router!`;
  },
};
