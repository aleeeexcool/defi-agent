import { encodeSqrtRatioX96, TickMath } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

export function priceToTick(
  price: number,
  decimalsToken0 = 6,
  decimalsToken1 = 6,
  tickSpacing = 50
): number {
  const precision = 1_000_000; // 1e6 for stablecoins (6 decimals)
  
  const amount0 = JSBI.BigInt(precision); // 1 * 10^6
  const amount1 = JSBI.BigInt(Math.round(price * precision)); // price * 1e6 rounded
  
  const sqrtRatioX96 = encodeSqrtRatioX96(amount1, amount0); // << note order
  let tick = TickMath.getTickAtSqrtRatio(sqrtRatioX96);

  // Round down to nearest valid tick
  return Math.floor(tick / tickSpacing) * tickSpacing;
}
