import { priceToTick } from '@/app/utils/tickMath';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const pairAddress = '0xE846373C1a92B167b4E9cd5d8E4d6B1Db9E90EC7'; // EURC/USDC Aerodrome Pool

    const { data } = await axios.get(
      `https://api.dexscreener.com/latest/dex/pairs/base/${pairAddress}`
    );

    if (!data.pairs || data.pairs.length === 0) {
      throw new Error('No pairs found in API response.');
    }

    const currentPrice = parseFloat(data.pairs[0].priceUsd);
    if (!currentPrice) {
      throw new Error('No price data found.');
    }

    const volatility = 0.005; // Assume 0.5% volatility for stablecoins

    const recommendedRange = {
      lower: currentPrice * (1 - volatility),
      upper: currentPrice * (1 + volatility),
    };

    const tickLower = priceToTick(recommendedRange.lower);
    const tickUpper = priceToTick(recommendedRange.upper);

    return NextResponse.json({
      currentPrice,
      volatility,
      recommendedRange,
      tickRange: { tickLower, tickUpper },
    });
  } catch (error: any) {
    console.error('Error in /api/range:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
