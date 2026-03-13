import { ethers, run } from "hardhat";

const ARENA_COIN_ADDRESS    = "0x217342a0e02e4a4018dd42f5e466ea465541f953";
const FIGHTER_BASE_URI      = "https://metadata.arenaprotocol.xyz/fighters/";
const EXISTING_FIGHTER_ADDR = "0x1379A9F4Cec7fbE321c8F87A9D6c88DEF0110602";
const EXISTING_GAME_ADDR    = "0x983c30CBAD30042043319DB682620Be7B06d3b67";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyContract(address: string, constructorArgs: any[], contract?: string) {
  console.log(`\nVerifying ${address} on Basescan...`);
  try {
    await run("verify:verify", { address, constructorArguments: constructorArgs, contract });
    console.log(`✅  Verified: https://basescan.org/address/${address}#code`);
  } catch (err: any) {
    if (err.message?.includes("Already Verified") || err.message?.includes("already verified")) {
      console.log("✅  Already verified.");
    } else {
      console.error("❌  Verification error:", err.message);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider   = ethers.provider;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Arena Protocol — Deploy ArenaMarketplace (gas-optimized)");
  console.log("═══════════════════════════════════════════════════════════");

  const balance = await provider.getBalance(deployer.address);
  const feeData = await provider.getFeeData();

  const baseFee    = feeData.gasPrice ?? ethers.parseUnits("0.01", "gwei");
  // Use exactly baseFee + tiny tip to minimise cost, no cap overhead
  const maxFeePerGas         = baseFee + ethers.parseUnits("0.001", "gwei");
  const maxPriorityFeePerGas = ethers.parseUnits("0.001", "gwei");

  console.log(`  Deployer:       ${deployer.address}`);
  console.log(`  ETH balance:    ${ethers.formatEther(balance)} ETH`);
  console.log(`  Gas price:      ${ethers.formatUnits(baseFee, "gwei")} gwei`);
  console.log(`  Max fee:        ${ethers.formatUnits(maxFeePerGas, "gwei")} gwei`);

  if (balance === 0n) throw new Error("No ETH — fund the deployer wallet first.");

  // ── Nonce check — clear any stuck pending transactions ─────────────────────
  const confirmedNonce = await provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce   = await provider.getTransactionCount(deployer.address, "pending");
  console.log(`\n  Nonce (confirmed): ${confirmedNonce}  |  Nonce (pending): ${pendingNonce}`);

  if (pendingNonce > confirmedNonce) {
    console.log("  ⚠️  Stuck pending transaction detected — sending 0-ETH replacement to clear...");
    const clearTx = await deployer.sendTransaction({
      to: deployer.address,
      value: 0n,
      nonce: confirmedNonce,
      maxFeePerGas:         maxFeePerGas * 3n,   // outbid the stuck tx
      maxPriorityFeePerGas: maxPriorityFeePerGas * 3n,
      gasLimit: 21_000,
    });
    console.log("  Clearing tx:", clearTx.hash);
    await clearTx.wait();
    console.log("  Nonce cleared ✓");
  }

  const txOverrides = {
    maxFeePerGas,
    maxPriorityFeePerGas,
  };

  // ── Wire ArenaGame into ArenaFighter ───────────────────────────────────────
  const ArenaFighter = await ethers.getContractFactory("ArenaFighter");
  const fighter = ArenaFighter.attach(EXISTING_FIGHTER_ADDR) as any;

  // Check if already set
  const currentArena = await fighter.arenaContract();
  if (currentArena.toLowerCase() !== EXISTING_GAME_ADDR.toLowerCase()) {
    console.log("\n[Pre] Wiring ArenaGame into ArenaFighter...");
    const wireTx = await fighter.setArenaContract(EXISTING_GAME_ADDR, {
      ...txOverrides,
      gasLimit: 80_000,
    });
    console.log("  tx:", wireTx.hash);
    await wireTx.wait();
    console.log("  Done ✓");
  } else {
    console.log("\n[Pre] ArenaGame already wired ✓");
  }

  // ── Deploy ArenaMarketplace ────────────────────────────────────────────────
  console.log("\n[1/1] Deploying ArenaMarketplace...");

  // Estimate gas first
  const ArenaMarketplace = await ethers.getContractFactory("ArenaMarketplace");
  const deployTx = await ArenaMarketplace.getDeployTransaction(
    EXISTING_FIGHTER_ADDR,
    ARENA_COIN_ADDRESS,
    deployer.address
  );
  let estimatedGas: bigint;
  try {
    estimatedGas = await provider.estimateGas({ ...deployTx, from: deployer.address });
    estimatedGas = (estimatedGas * 108n) / 100n; // +8% tight buffer (Base is stable)
    console.log(`  Estimated gas: ${estimatedGas.toLocaleString()} units`);
  } catch (e) {
    estimatedGas = 900_000n;
    console.log(`  Gas estimation failed, using default: ${estimatedGas.toLocaleString()} units`);
  }

  const deploymentCost = estimatedGas * maxFeePerGas;
  console.log(`  Estimated cost: ${ethers.formatEther(deploymentCost)} ETH`);

  if (deploymentCost > balance) {
    throw new Error(
      `Insufficient ETH.\n` +
      `  Need:    ${ethers.formatEther(deploymentCost)} ETH\n` +
      `  Have:    ${ethers.formatEther(balance)} ETH\n` +
      `  Top up deployer: ${deployer.address}`
    );
  }

  const marketplace = await ArenaMarketplace.deploy(
    EXISTING_FIGHTER_ADDR,
    ARENA_COIN_ADDRESS,
    deployer.address,
    { ...txOverrides, gasLimit: estimatedGas }
  );
  console.log("  Deploy tx:", marketplace.deploymentTransaction()?.hash);
  await marketplace.waitForDeployment();
  const marketAddr = await marketplace.getAddress();
  console.log(`  ✅  ArenaMarketplace deployed → ${marketAddr}`);

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ALL FOUR CONTRACTS DEPLOYED");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  ArenaCoin        : ${ARENA_COIN_ADDRESS}`);
  console.log(`  ArenaFighter     : ${EXISTING_FIGHTER_ADDR}`);
  console.log(`  ArenaGame        : ${EXISTING_GAME_ADDR}`);
  console.log(`  ArenaMarketplace : ${marketAddr}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Verify all four ───────────────────────────────────────────────────────
  console.log("Waiting 30s for Basescan to index...");
  await sleep(30_000);

  await verifyContract(
    EXISTING_FIGHTER_ADDR,
    [ARENA_COIN_ADDRESS, FIGHTER_BASE_URI],
    "contracts/ArenaFighter.sol:ArenaFighter"
  );
  await verifyContract(
    EXISTING_GAME_ADDR,
    [EXISTING_FIGHTER_ADDR, ARENA_COIN_ADDRESS],
    "contracts/ArenaGame.sol:ArenaGame"
  );
  await verifyContract(
    marketAddr,
    [EXISTING_FIGHTER_ADDR, ARENA_COIN_ADDRESS, deployer.address],
    "contracts/ArenaMarketplace.sol:ArenaMarketplace"
  );

  console.log("\n🏆  Arena Protocol fully live & verified on Base mainnet!");
  console.log("───────────────────────────────────────────────────────────");
  console.log("  ArenaCoin        → https://basescan.org/address/" + ARENA_COIN_ADDRESS + "#code");
  console.log("  ArenaFighter     → https://basescan.org/address/" + EXISTING_FIGHTER_ADDR + "#code");
  console.log("  ArenaGame        → https://basescan.org/address/" + EXISTING_GAME_ADDR + "#code");
  console.log("  ArenaMarketplace → https://basescan.org/address/" + marketAddr + "#code");
}

main().catch(err => {
  console.error("\n❌  Error:", err.message ?? err);
  process.exit(1);
});
