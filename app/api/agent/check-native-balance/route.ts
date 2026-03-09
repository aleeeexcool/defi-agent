import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { formatUnits } from 'viem';

export async function POST() {
  try {
    console.log('[check-native-balance] Fetching ETH balance...');

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.ALCHEMY_API_KEY_MAINNET_URL!),
    });

    const walletAddress = '0xdF1C7676c27a35cf460c350BDF7Fe90123109b1D';

    const ethBalance = await publicClient.getBalance({
      address: walletAddress,
    });
    const formatted = formatUnits(ethBalance, 18);

    return NextResponse.json({ balance: formatted });
  } catch (error: any) {
    console.error('[check-native-balance] Error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
