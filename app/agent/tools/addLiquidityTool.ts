import { AgentTool } from "@coinbase/agentkit";

export const AddLiquidityTool: AgentTool = {
  name: "add_liquidity_to_aerodrome",
  description: "Adds liquidity to the EURC/USDC pool on Aerodrome Finance using recommended tick range and amounts.",
  type: "function",
  function: {
    name: "add_liquidity_to_aerodrome",
    description: "Adds liquidity to the EURC/USDC pool on Aerodrome Finance.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  run: async () => {
    const res = await fetch("/api/agent/add-liquidity", {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to add liquidity");
    }

    const data = await res.json();
    return `Liquidity added successfully! Tx Hash: ${data.txHash}`;
  },
};
