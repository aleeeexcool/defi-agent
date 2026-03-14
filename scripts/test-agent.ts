import fetch from "node-fetch";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function testNativeBalance() {
  try {
    console.log("Testing native ETH balance fetch...");

    const res = await fetch(`${SITE_URL}/api/agent/check-native-balance`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error("❌ Failed to fetch native balance:", res.status, await res.text());
      return;
    }

    const data = await res.json();
    console.log("✅ Native ETH balance:", data.balance);
  } catch (error) {
    console.error("❌ Error in testNativeBalance:", error);
  }
}

async function testTokenBalance(tokenAddresses: string[], tokenName: string) {
  try {
    console.log(`Testing ERC20 token balance fetch for ${tokenName}...`);

    const res = await fetch(`${SITE_URL}/api/agent/check-token-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenAddresses }),
    });

    if (!res.ok) {
      console.error(`❌ Failed to fetch ${tokenName} balance:`, res.status, await res.text());
      return;
    }

    const data = await res.json();
    console.log(`✅ ${tokenName} balance:`, data.balances[tokenAddresses[0]]);
  } catch (error) {
    console.error(`❌ Error in testTokenBalance for ${tokenName}:`, error);
  }
}

async function testTokenAllowance(tokenAddress: string, tokenName: string) {
  try {
    console.log(`Testing ${tokenName} allowance check...`);

    const res = await fetch(`${SITE_URL}/api/agent/check-token-allowance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenAddress }),
    });

    if (!res.ok) {
      console.error(`❌ Failed to fetch ${tokenName} allowance:`, res.status, await res.text());
      return;
    }

    const data = await res.json();
    console.log(`✅ ${tokenName} allowance:`, data.allowance);
  } catch (error) {
    console.error(`❌ Error in testTokenAllowance for ${tokenName}:`, error);
  }
}

async function testRevokeTokenAllowance(tokenAddress: string, tokenName: string) {
  try {
    console.log(`Testing ${tokenName} allowance revocation...`);

    const res = await fetch(`${SITE_URL}/api/agent/revoke-token-allowance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenAddress }),
    });

    if (!res.ok) {
      console.error(`❌ Failed to revoke ${tokenName} allowance:`, res.status, await res.text());
      return;
    }

    const data = await res.json();

    if (data.alreadyZero) {
      console.log(`ℹ️ ${tokenName} allowance already zero — no transaction needed.`);
    } else if (data.txHash) {
      console.log(`✅ ${tokenName} allowance revoked. Tx: ${data.txHash}`);
    } else {
      console.log(`⚠️ Unexpected response for ${tokenName}:`, data);
    }
  } catch (error) {
    console.error(`❌ Error in testRevokeTokenAllowance for ${tokenName}:`, error);
  }
}

async function main() {
  console.log("\n=== Starting local agent tests ===\n");

  await testNativeBalance();

  await testTokenBalance(["0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42"], "EURC");
  await testTokenBalance(["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"], "USDC");
  await testTokenBalance(["0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"], "USDT");

  await testTokenAllowance("0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", "EURC");
  await testTokenAllowance("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "USDC");
  await testTokenAllowance("0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", "USDT");

  await testRevokeTokenAllowance("0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", "EURC");
  await testRevokeTokenAllowance("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "USDC");

  console.log("\n=== Local agent tests completed ===\n");
}

main();

// npx tsx scripts/test-agent.ts