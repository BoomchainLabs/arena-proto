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
    await run("verify:verify", {
      address,
      constructorArguments: constructorArgs,
      contract,
    });
    console.log(`✅  Verified: https://basescan.org/address/${address}#code`);
  } catch (err: any) {
    if (err.message?.includes("Already Verified") || err.message?.includes("already verified")) {
      console.log("✅  Already verified.");
    } else {
      console.error("❌  Verification failed:", err.message);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Arena Protocol — Resume Deployment & Verification");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Deployer:      ${deployer.address}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  ETH balance:   ${ethers.formatEther(balance)} ETH`);
  if (balance === 0n) {
    throw new Error("Deployer wallet has no ETH on Base mainnet — top it up first.");
  }

  const fighterAddr = EXISTING_FIGHTER_ADDR;
  const gameAddr    = EXISTING_GAME_ADDR;

  const ArenaFighter = await ethers.getContractFactory("ArenaFighter");
  const fighter = ArenaFighter.attach(fighterAddr) as any;

  // ── Wire ArenaGame into ArenaFighter (missed last run) ─────────────────────
  console.log("\n[Pre] Setting ArenaGame on ArenaFighter...");
  try {
    const setTx = await fighter.setArenaContract(gameAddr, { gasLimit: 100_000 });
    await setTx.wait();
    console.log("       Done.");
  } catch (e: any) {
    console.log("       (already set or failed):", e.message.slice(0, 80));
  }

  // ── ArenaMarketplace ───────────────────────────────────────────────────────
  console.log("\n[1/1] Deploying ArenaMarketplace...");
  const ArenaMarketplace = await ethers.getContractFactory("ArenaMarketplace");
  const marketplace = await ArenaMarketplace.deploy(
    fighterAddr,
    ARENA_COIN_ADDRESS,
    deployer.address,
    { gasLimit: 2_000_000 }
  );
  await marketplace.waitForDeployment();
  const marketAddr = await marketplace.getAddress();
  console.log(`       ArenaMarketplace deployed → ${marketAddr}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ALL CONTRACTS DEPLOYED");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  ArenaCoin        (pre-existing): ${ARENA_COIN_ADDRESS}`);
  console.log(`  ArenaFighter     (pre-deployed): ${fighterAddr}`);
  console.log(`  ArenaGame        (pre-deployed): ${gameAddr}`);
  console.log(`  ArenaMarketplace (new):          ${marketAddr}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Verification ─────────────────────────────────────────────────────────
  console.log("Waiting 30s for Basescan to index...");
  await sleep(30_000);

  await verifyContract(
    fighterAddr,
    [ARENA_COIN_ADDRESS, FIGHTER_BASE_URI],
    "contracts/ArenaFighter.sol:ArenaFighter"
  );
  await verifyContract(
    gameAddr,
    [fighterAddr, ARENA_COIN_ADDRESS],
    "contracts/ArenaGame.sol:ArenaGame"
  );
  await verifyContract(
    marketAddr,
    [fighterAddr, ARENA_COIN_ADDRESS, deployer.address],
    "contracts/ArenaMarketplace.sol:ArenaMarketplace"
  );

  console.log("\n🏆  All done!  Arena Protocol is fully live on Base mainnet.");
  console.log("   ArenaCoin:        https://basescan.org/address/" + ARENA_COIN_ADDRESS + "#code");
  console.log("   ArenaFighter:     https://basescan.org/address/" + fighterAddr + "#code");
  console.log("   ArenaGame:        https://basescan.org/address/" + gameAddr + "#code");
  console.log("   ArenaMarketplace: https://basescan.org/address/" + marketAddr + "#code");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
