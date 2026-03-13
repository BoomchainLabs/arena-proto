import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Beaker, Cpu, Zap, Hexagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FighterCard } from "@/components/FighterCard";
import { useAccount, useReadContract } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import {
  CONTRACTS, ARENA_COIN_ABI, ARENA_FIGHTER_ABI,
  RARITY_NAMES, RARITY_INDEX, MINT_COSTS, type RarityName,
} from "@/lib/contracts";

const RARITY_COLORS: Record<RarityName, string> = {
  Common: "text-muted-foreground",
  Rare:   "text-blue-400",
  Epic:   "text-secondary",
  Legendary: "text-accent",
};

export default function Mint() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const [selectedRarity, setSelectedRarity] = useState<RarityName>("Common");
  const [phase, setPhase] = useState<"idle" | "approving" | "minting" | "done">("idle");
  const [mintedFighter, setMintedFighter] = useState<{
    id: string; rarity: string;
    stats: { strength: number; speed: number; intelligence: number };
  } | null>(null);
  const [logs, setLogs] = useState<string[]>([
    "> CONNECTING TO NEURAL NETWORK...",
    "> STATUS: OK",
    "> INITIALIZING DNA SEQUENCE GENERATOR...",
    "> Waiting for user input to begin synthesis sequence.",
  ]);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-12), msg]);

  const mintCost = MINT_COSTS[selectedRarity];

  const { data: arenaBalance } = useReadContract({
    address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.ARENA_FIGHTER] : undefined,
    query: { enabled: !!address },
  });
  const { data: nextId } = useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "nextTokenId",
  });

  const { writeContract: approveWrite, data: approveTxHash } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });

  const { writeContract: mintWrite, data: mintTxHash } = useWriteContract();
  const { isSuccess: mintSuccess, data: mintReceipt } = useWaitForTransactionReceipt({ hash: mintTxHash });

  const needsApproval = !allowance || allowance < mintCost;

  useEffect(() => {
    if (approveSuccess) {
      addLog("> APPROVAL CONFIRMED ✓");
      addLog("> SUBMITTING SYNTHESIS TX...");
      refetchAllowance();
      setPhase("minting");
      mintWrite({
        address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
        functionName: "mint",
        args: [RARITY_INDEX[selectedRarity]],
      });
    }
  }, [approveSuccess]);

  useEffect(() => {
    if (mintSuccess && mintReceipt) {
      const tokenId = nextId ? String(Number(nextId) - 1) : "???";
      const fighter = {
        id: tokenId,
        rarity: selectedRarity,
        stats: {
          strength:     Math.floor(Math.random() * 30) + (selectedRarity === "Legendary" ? 80 : selectedRarity === "Epic" ? 60 : selectedRarity === "Rare" ? 40 : 20),
          speed:        Math.floor(Math.random() * 30) + (selectedRarity === "Legendary" ? 80 : selectedRarity === "Epic" ? 60 : selectedRarity === "Rare" ? 40 : 20),
          intelligence: Math.floor(Math.random() * 30) + (selectedRarity === "Legendary" ? 80 : selectedRarity === "Epic" ? 60 : selectedRarity === "Rare" ? 40 : 20),
        },
      };
      setMintedFighter(fighter);
      setPhase("done");
      addLog("> SYNTHESIS COMPLETE ✓");
      addLog(`> RARITY: ${selectedRarity.toUpperCase()}`);
      addLog(`> TOKEN_ID: #${tokenId}`);
      toast({ title: "SYNTHESIS COMPLETE", description: `Minted ${selectedRarity} Fighter #${tokenId}` });
    }
  }, [mintSuccess]);

  const handleMint = () => {
    if (!isConnected) {
      toast({ title: "ERROR", description: "Connect your wallet first", variant: "destructive" });
      return;
    }
    if (arenaBalance !== undefined && arenaBalance < mintCost) {
      toast({ title: "INSUFFICIENT ARENA", description: `You need ${formatUnits(mintCost, 18)} ARENA`, variant: "destructive" });
      return;
    }
    if (needsApproval) {
      setPhase("approving");
      addLog(`> APPROVING ${formatUnits(mintCost, 18)} ARENA SPEND...`);
      approveWrite({
        address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
        functionName: "approve",
        args: [CONTRACTS.ARENA_FIGHTER, mintCost],
      });
    } else {
      setPhase("minting");
      addLog("> SUBMITTING SYNTHESIS TX...");
      mintWrite({
        address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
        functionName: "mint",
        args: [RARITY_INDEX[selectedRarity]],
      });
    }
  };

  const isBusy = phase === "approving" || phase === "minting";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-secondary/10 clip-edges border border-secondary/30">
          <Beaker className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-widest">Synthesis Lab</h1>
          <p className="text-muted-foreground font-mono text-sm">Generate new augmented assets on-chain</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/20 h-fit">
          <CardContent className="p-6 lg:p-8">
            {/* Terminal */}
            <div className="bg-black/50 border border-primary/30 p-4 mb-6 font-mono text-sm text-green-400 h-48 overflow-y-auto">
              {logs.map((l, i) => (
                <p key={i} className={i < logs.length - 2 ? "text-muted-foreground" : ""}>{l}</p>
              ))}
              {isBusy && (
                <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-yellow-400">
                  {">"} {phase === "approving" ? "AWAITING APPROVAL..." : "SYNTHESIZING..."}
                </motion.p>
              )}
            </div>

            {/* Rarity Selector */}
            <div className="mb-6">
              <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">Select Rarity Tier</p>
              <div className="grid grid-cols-2 gap-2">
                {RARITY_NAMES.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(r)}
                    className={`p-3 clip-edges border font-mono text-xs text-left transition-all ${
                      selectedRarity === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <div className={`font-bold mb-1 ${RARITY_COLORS[r]}`}>{r.toUpperCase()}</div>
                    <div className="text-muted-foreground">{formatUnits(MINT_COSTS[r], 18)} ARENA</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 mb-6">
              {[
                { label: "Synthesis Cost", value: `${formatUnits(mintCost, 18)} ARENA + GAS` },
                { label: "Network", value: "Base Mainnet", icon: <div className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1" /> },
                { label: "Your ARENA", value: arenaBalance !== undefined ? `${parseFloat(formatUnits(arenaBalance, 18)).toFixed(2)} ARENA` : "---" },
                { label: "Fighters Minted", value: nextId ? String(Number(nextId) - 1) : "---" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex justify-between items-center border-b border-border/30 pb-2">
                  <span className="font-mono text-muted-foreground text-sm">{label}</span>
                  <span className="font-bold text-sm flex items-center">{icon}{value}</span>
                </div>
              ))}
            </div>

            {!isConnected ? (
              <div className="text-center py-4 border border-dashed border-border/50 clip-edges">
                <p className="font-mono text-xs text-muted-foreground uppercase">Connect wallet to mint</p>
              </div>
            ) : (
              <Button size="lg" className="w-full h-14 text-lg font-display" onClick={handleMint} disabled={isBusy}>
                {isBusy ? (
                  <><Cpu className="mr-2 h-5 w-5 animate-spin" />{phase === "approving" ? "APPROVING..." : "SYNTHESIZING..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{needsApproval ? "APPROVE & SYNTHESIZE" : "SYNTHESIZE FIGHTER"}</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-mono text-primary uppercase tracking-widest border-b border-border/50 pb-2">SYNTHESIS OUTPUT</h2>
          <AnimatePresence mode="wait">
            {mintedFighter ? (
              <motion.div key={mintedFighter.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-xs mx-auto">
                <FighterCard {...mintedFighter} />
                <div className="mt-4 text-center">
                  <a href={`https://basescan.org/tx/${mintTxHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary/60 hover:text-primary underline">
                    VIEW ON BASESCAN ↗
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-dashed border-border/50 clip-edges flex flex-col items-center justify-center p-16 opacity-50">
                <Hexagon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="font-mono text-muted-foreground text-sm uppercase text-center">
                  No synthesis output.<br />Select rarity and mint a fighter.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
