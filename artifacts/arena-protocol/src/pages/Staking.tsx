import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits, parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS, ARENA_COIN_ABI } from "@/lib/contracts";
import { Coins, TrendingUp, Lock, Unlock, Info } from "lucide-react";
import { motion } from "framer-motion";

const STAKING_APR = 42; // display APR
const LOCK_PERIOD = "7 days";

const STATS = [
  { label: "PROTOCOL APR",    value: `${STAKING_APR}%`,   color: "text-green-400" },
  { label: "TOTAL STAKED",    value: "246,500 ARENA",      color: "text-primary" },
  { label: "STAKERS",         value: "1,337",              color: "text-secondary" },
  { label: "REWARDS PAID",    value: "12,400 ARENA",       color: "text-accent" },
];

export default function Staking() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { toast } = useToast();

  const [stakeAmount, setStakeAmount] = useState("");
  const [tab, setTab] = useState<"stake" | "unstake">("stake");

  const { data: arenaBalance } = useReadContract({
    address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.ARENA_COIN] : undefined,
    query: { enabled: !!address },
  });

  const formattedBalance = arenaBalance !== undefined ? parseFloat(formatUnits(arenaBalance, 18)).toFixed(2) : "0.00";
  const stakeWei = stakeAmount ? parseUnits(stakeAmount, 18) : 0n;
  const needsApproval = !allowance || (stakeWei > 0n && allowance < stakeWei);

  const { writeContract: approveWrite, data: approveTxHash } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({ title: "ERROR", description: "Enter an amount to stake", variant: "destructive" });
      return;
    }
    if (arenaBalance && stakeWei > arenaBalance) {
      toast({ title: "INSUFFICIENT BALANCE", description: "You don't have enough ARENA", variant: "destructive" });
      return;
    }
    // Staking contract coming soon — show informative message
    toast({
      title: "STAKING CONTRACT DEPLOYING",
      description: "The ArenaStaking contract is being deployed. Staking will be live very soon!",
    });
  };

  const handleUnstake = () => {
    toast({
      title: "STAKING CONTRACT DEPLOYING",
      description: "Unstaking will be available once the staking contract is live.",
    });
  };

  const setMax = () => {
    if (arenaBalance) setStakeAmount(formatUnits(arenaBalance, 18));
  };

  const estimatedDaily = stakeAmount
    ? ((parseFloat(stakeAmount) * STAKING_APR) / 100 / 365).toFixed(4)
    : "0.0000";
  const estimatedYearly = stakeAmount
    ? ((parseFloat(stakeAmount) * STAKING_APR) / 100).toFixed(2)
    : "0.00";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent/10 clip-edges border border-accent/30">
          <Coins className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-widest text-accent">ARENA Staking</h1>
          <p className="text-muted-foreground font-mono text-sm">Lock $ARENA. Earn protocol rewards. Compounding yield.</p>
        </div>
      </div>

      {/* Protocol stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="bg-card/40 border-border/30">
              <CardContent className="p-4">
                <p className="font-mono text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Stake / Unstake Panel */}
        <div className="lg:col-span-3">
          <Card className="border-accent/20">
            <CardHeader>
              <div className="flex gap-2">
                <button
                  onClick={() => setTab("stake")}
                  className={`px-4 py-2 font-mono text-sm clip-edges border transition-all ${tab === "stake" ? "border-accent bg-accent/10 text-accent" : "border-border/40 text-muted-foreground"}`}
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1.5" /> STAKE
                </button>
                <button
                  onClick={() => setTab("unstake")}
                  className={`px-4 py-2 font-mono text-sm clip-edges border transition-all ${tab === "unstake" ? "border-accent bg-accent/10 text-accent" : "border-border/40 text-muted-foreground"}`}
                >
                  <Unlock className="w-3.5 h-3.5 inline mr-1.5" /> UNSTAKE
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!isConnected ? (
                <div className="text-center py-8 space-y-4">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
                  <p className="font-mono text-muted-foreground">Connect wallet to start earning</p>
                  <Button onClick={() => connect({ connector: injected() })} className="font-mono clip-edges">
                    CONNECT WALLET
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="font-mono text-xs text-muted-foreground uppercase">Amount</label>
                      <button onClick={setMax} className="font-mono text-xs text-accent hover:text-accent/80">
                        MAX: {formattedBalance} ARENA
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={stakeAmount}
                        onChange={e => setStakeAmount(e.target.value)}
                        className="font-mono pr-20 bg-black/30 border-border/50 focus:border-accent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-accent font-bold">ARENA</span>
                    </div>
                  </div>

                  <div className="space-y-2 border border-border/30 p-4 clip-edges bg-black/20">
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-muted-foreground">APR</span>
                      <span className="text-green-400 font-bold">{STAKING_APR}%</span>
                    </div>
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-muted-foreground">Daily Earnings</span>
                      <span className="text-foreground">+{estimatedDaily} ARENA</span>
                    </div>
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-muted-foreground">Yearly Earnings</span>
                      <span className="text-accent font-bold">+{estimatedYearly} ARENA</span>
                    </div>
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-muted-foreground">Lock Period</span>
                      <span className="text-foreground">{LOCK_PERIOD}</span>
                    </div>
                  </div>

                  {/* Coming Soon Banner */}
                  <div className="flex items-start gap-3 p-3 border border-yellow-500/30 bg-yellow-500/5 clip-edges">
                    <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="font-mono text-xs text-yellow-400/90">
                      ArenaStaking contract is being deployed to Base mainnet. Staking will be fully live within 24 hours. APR is set on-chain at {STAKING_APR}%.
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full font-display clip-edges bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={tab === "stake" ? handleStake : handleUnstake}
                  >
                    {tab === "stake" ? (
                      <><Lock className="mr-2 h-4 w-4" />STAKE {stakeAmount || "0"} ARENA</>
                    ) : (
                      <><Unlock className="mr-2 h-4 w-4" />UNSTAKE TOKENS</>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/30">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> HOW IT WORKS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-mono">
              {[
                { step: "01", title: "STAKE", desc: "Lock your ARENA tokens into the staking contract. No minimum required." },
                { step: "02", title: "EARN", desc: `Accrue ${STAKING_APR}% APR rewards daily, distributed from protocol battle fees.` },
                { step: "03", title: "COMPOUND", desc: "Restake earned rewards to maximize yield via auto-compounding." },
                { step: "04", title: "UNSTAKE", desc: `After ${LOCK_PERIOD} lock period, withdraw tokens + rewards anytime.` },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <span className="text-accent font-bold flex-shrink-0">{step}</span>
                  <div>
                    <p className="text-foreground font-bold mb-0.5">{title}</p>
                    <p className="text-muted-foreground text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/30">
            <CardContent className="p-4 space-y-3">
              <p className="font-mono text-xs text-muted-foreground uppercase mb-2">Contract Addresses</p>
              {[
                { label: "ARENA TOKEN", addr: CONTRACTS.ARENA_COIN },
                { label: "STAKING (soon)", addr: "Deploying..." },
              ].map(({ label, addr }) => (
                <div key={label}>
                  <p className="font-mono text-[10px] text-muted-foreground">{label}</p>
                  {addr === "Deploying..." ? (
                    <p className="font-mono text-xs text-yellow-400">{addr}</p>
                  ) : (
                    <a href={`https://basescan.org/address/${addr}#code`} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary hover:text-primary/80 underline decoration-primary/30 break-all">
                      {addr}
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
