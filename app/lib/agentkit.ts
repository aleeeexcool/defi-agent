import { prepareAgentkitAndWalletProvider } from '../api/agent/prepare-agentkit';
import { encodeFunctionData, type Abi } from 'viem';

// Cache the client instances
let cachedAgentKit: any = null;
let cachedWalletProvider: any = null;
let cachedClient: any = null;

/**
 * Get a client instance for interacting with the blockchain
 */
export async function getClient() {
  if (cachedClient) return cachedClient;

  try {
    const { agentkit, walletProvider } =
      await prepareAgentkitAndWalletProvider();
    cachedAgentKit = agentkit;
    cachedWalletProvider = walletProvider;

    const walletAddress = await walletProvider.getAddress();

    const client = {
      sendOnchainAction: async ({
        contractAddress,
        abi,
        functionName,
        args,
        value = '0x0',
      }: {
        contractAddress: string;
        abi: Abi;
        functionName: string;
        args: any[];
        value?: string;
      }) => {
        if (!abi || !functionName || !args) {
          throw new Error('abi, functionName, and args are required');
        }

        const data = encodeFunctionData({
          abi,
          functionName,
          args,
        });

        console.log('Sending contract write:', {
          contractAddress,
          functionName,
          args,
        });

        try {
          const txHash = await (walletProvider as any).sendTransaction({
            to: contractAddress,
            data,
            value,
          });

          console.log('Transaction sent:', txHash);
          return { txHash };
        } catch (error) {
          console.error('Transaction failed:', error);
          throw error;
        }
      },

      readContract: async (params: any) => {
        console.log('Reading contract:', params);
        return await (walletProvider as any).readContract(params);
      },

      getAddress: async () => {
        return { address: walletAddress };
      },

      account: {
        address: walletAddress,
      },
    };

    cachedClient = client;
    return client;
  } catch (error) {
    console.error('Error initializing client:', error);
    throw new Error('Failed to initialize blockchain client');
  }
}
