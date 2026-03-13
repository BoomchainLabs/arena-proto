import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FighterCard } from "@/components/FighterCard";
import { Swords, User, Bot, Skull, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRecordBattle } from "@workspace/api-client-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { formatUnits } from "viem";
import { CONTRACTS, ARENA_FIGHTER_ABI, ARENA_GAME_ABI, RARITY_NAMES } from "@/lib/contracts";

type Fighter = {
  id: string; rarity: string;
  stats: { strength: number; speed: number; intelligence: number };
  wins: number; losses: number;
};

function useFighterTokens(address?: `0x${string}`) {
  const { data: balance } = useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  return { count: balance ? Number(balance) : 0 };
}

function useFighterStats(tokenId?: bigint) {
  return useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "stats", args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

function useCooldown(tokenId?: bigint) {
  return useReadContract({
    address: CONTRACTS.ARENA_GAME, abi: ARENA_GAME_ABI,
    functionName: "lastBattleTime", args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

export default function Arena() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { mutateAsync: recordBattle } = useRecordBattle();

  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [mode, setMode] = useState<"PVE" | "PVP">("PVE");
  const [battleState, setBattleState] = useState<"IDLE" | "FIGHTING" | "RESULT">("IDLE");
  const [result, setResult] = useState<{ win: boolean; reward: string; txHash?: string } | null>(null);

  const { count: fighterCount } = useFighterTokens(address);

  // Load first 3 fighter token IDs
  const { data: tokenId0 } = useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "tokenOfOwnerByIndex",
    args: address ? [address, 0n] : undefined,
    query: { enabled: !!address && fighterCount > 0 },
  });
  const { data: tokenId1 } = useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "tokenOfOwnerByIndex",
    args: address ? [address, 1n] : undefined,
    query: { enabled: !!address && fighterCount > 1 },
  });
  const { data: tokenId2 } = useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "tokenOfOwnerByIndex",
    args: address ? [address, 2n] : undefined,
    query: { enabled: !!address && fighterCount > 2 },
  });
  const tokenIds = [tokenId0, tokenId1, tokenId2].filter(Boolean) as bigint[];

  const { data: stats0 } = useFighterStats(tokenIds[0]);
  const { data: stats1 } = useFighterStats(tokenIds[1]);
  const { data: stats2 } = useFighterStats(tokenIds[2]);
  const allStats = [stats0, stats1, stats2];

  const { data: cooldown } = useCooldown(selectedTokenId ?? undefined);
  const cooldownSeconds = cooldown ? Number(cooldown) + 3600 - Math.floor(Date.now() / 1000) : 0;
  const onCooldown = cooldownSeconds > 0 && !!selectedTokenId;

  const { data: pveReward } = useReadContract({ address: CONTRACTS.ARENA_GAME, abi: ARENA_GAME_ABI, functionName: "pveWinReward" });
  const { data: pvpReward } = useReadContract({ address: CONTRACTS.ARENA_GAME, abi: ARENA_GAME_ABI, functionName: "pvpWinReward" });

  const { writeContract, data: battleTxHash } = useWriteContract();
  const { isSuccess: battleConfirmed, data: battleReceipt } = useWaitForTransactionReceipt({ hash: battleTxHash });

  useEffect(() => {
    if (battleConfirmed && battleReceipt) {
      // Parse BattleResolved event
      const isWin = Math.random() > 0.4; // will be replaced by event parsing
      const reward = isWin ? (mode === "PVE" ? formatUnits(pveReward ?? 10n ** 19n, 18) : formatUnits(pvpReward ?? 25n * 10n ** 18n, 18)) : "0";
      setResult({ win: isWin, reward, txHash: battleTxHash });
      setBattleState("RESULT");
      recordBattle({
        data: {
          player: address!,
          fighterId: String(selectedTokenId),
          win: isWin,
          reward,
          mode,
          txHash: battleTxHash ?? "0xunknown",
        }
      }).catch(console.error);
    }
  }, [battleConfirmed]);

  const handleBattle = () => {
    if (!isConnected || !selectedTokenId) return;
    if (onCooldown) {
      toast({ title: "COOLDOWN ACTIVE", description: `Fighter cooling down. ${Math.ceil(cooldownSeconds / 60)}m remaining.`, variant: "destructive" });
      return;
    }
    setBattleState("FIGHTING");
    writeContract({
      address: CONTRACTS.ARENA_GAME, abi: ARENA_GAME_ABI,
      functionName: mode === "PVE" ? "battlePvE" : "battlePvP",
      args: mode === "PVE" ? [selectedTokenId] : [selectedTokenId, selectedTokenId],
    });
  };

  const myFighters: Fighter[] = tokenIds.map((id, i) => {
    const s = allStats[i];
    return {
      id: String(id),
      rarity: s ? RARITY_NAMES[s[3]] : "Common",
      stats: s ? { strength: s[0], speed: s[1], intelligence: s[2] } : { strength: 0, speed: 0, intelligence: 0 },
      wins: s ? s[4] : 0,
      losses: s ? s[5] : 0,
    };
  });

  // Fallback demo fighters if wallet not connected or no fighters
  const displayFighters = myFighters.length > 0 ? myFighters : [
    { id: "1042", rarity: "Epic",      stats: { strength: 85, speed: 60, intelligence: 70 }, wins: 12, losses: 4 },
    { id: "891",  rarity: "Rare",      stats: { strength: 40, speed: 90, intelligence: 65 }, wins: 5,  losses: 8 },
    { id: "3301", rarity: "Legendary", stats: { strength: 95, speed: 80, intelligence: 90 }, wins: 28, losses: 3 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-destructive/10 clip-edges border border-destructive/30">
          <Swords className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-widest text-destructive">Battle Arena</h1>
          <p className="text-muted-foreground font-mono text-sm">Risk it all. Destroy opponents. Claim $ARENA.</p>
        </div>
      </div>

      {!isConnected && (
        <div className="mb-6 border border-yellow-500/30 bg-yellow-500/5 clip-edges p-4">
          <p className="font-mono text-yellow-400 text-sm text-center">Connect wallet to use your on-chain fighters. Demo fighters shown below.</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {battleState === "IDLE" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="font-mono text-primary uppercase tracking-widest border-b border-border/50 pb-2">
                  Select Combatant {isConnected && fighterCount > 0 ? `(${fighterCount} fighters)` : ""}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {displayFighters.map(f => (
                    <FighterCard
                      key={f.id} {...f}
                      onClick={() => setSelectedTokenId(BigInt(f.id))}
                      selected={selectedTokenId === BigInt(f.id)}
                    />
                  ))}
                  {isConnected && fighterCount === 0 && (
                    <div className="border border-dashed border-border/50 clip-edges flex flex-col items-center justify-center p-6 opacity-50 min-h-[180px]">
                      <User className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="font-mono text-xs text-muted-foreground text-center">MINT A FIGHTER FIRST</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="font-mono text-primary uppercase tracking-widest border-b border-border/50 pb-2">Battle Settings</h2>
                <Card className="bg-card/40 border-border/30">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground mb-2 uppercase">Mode</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={mode === "PVE" ? "default" : "outline"} size="sm" onClick={() => setMode("PVE")} className="font-mono">
                          <Bot className="w-4 h-4 mr-1" /> PvE
                        </Button>
                        <Button variant={mode === "PVP" ? "default" : "outline"} size="sm" onClick={() => setMode("PVP")} className="font-mono">
                          <User className="w-4 h-4 mr-1" /> PvP
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-border/30 pt-4 space-y-2">
                      <div className="flex justify-between font-mono text-sm">
                        <span className="text-muted-foreground">Win Reward</span>
                        <span className="text-green-400">+{mode === "PVE" ? formatUnits(pveReward ?? 10n ** 19n, 18) : formatUnits(pvpReward ?? 25n * 10n ** 18n, 18)} ARENA</span>
                      </div>
                      <div className="flex justify-between font-mono text-sm">
                        <span className="text-muted-foreground">Cooldown</span>
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />1 hour</span>
                      </div>
                      {onCooldown && (
                        <div className="text-yellow-400 text-xs font-mono flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3" /> COOLING DOWN: {Math.ceil(cooldownSeconds / 60)}m left
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full font-display font-bold clip-edges"
                      onClick={handleBattle}
                      disabled={!selectedTokenId || onCooldown || !isConnected}
                    >
                      <Swords className="mr-2 h-4 w-4" /> INITIATE COMBAT
                    </Button>
                    {!selectedTokenId && <p className="text-xs text-muted-foreground font-mono text-center">Select a fighter to proceed</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {battleState === "FIGHTING" && (
          <motion.div key="fighting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
            <div className="text-center">
              <motion.div animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 0.9, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block">
                <Swords className="w-24 h-24 text-destructive" />
              </motion.div>
              <h2 className="text-4xl font-display font-bold text-destructive mt-6 animate-pulse">COMBAT IN PROGRESS</h2>
              <p className="text-muted-foreground font-mono mt-2">Awaiting blockchain confirmation...</p>
              <div className="mt-6 flex justify-center gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-3 h-3 bg-destructive rounded-full" animate={{ opacity: [0.2,1,0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i*0.3 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {battleState === "RESULT" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[400px]">
            <div className={`text-center p-12 clip-edges border-2 ${result.win ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10"} max-w-md w-full`}>
              {result.win ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-8xl mb-4">⚔️</motion.div>
                  <h2 className="text-5xl font-display font-black text-green-400 mb-4">VICTORY</h2>
                  <p className="font-mono text-muted-foreground mb-2">Fighter #{String(selectedTokenId)}</p>
                  <p className="text-3xl font-bold text-green-400 font-display">+{result.reward} ARENA</p>
                </>
              ) : (
                <>
                  <Skull className="w-24 h-24 text-destructive mx-auto mb-4" />
                  <h2 className="text-5xl font-display font-black text-destructive mb-4">DEFEATED</h2>
                  <p className="font-mono text-muted-foreground">Fighter #{String(selectedTokenId)} was eliminated</p>
                  <p className="text-muted-foreground font-mono mt-2">+0 ARENA</p>
                </>
              )}
              {result.txHash && (
                <a href={`https://basescan.org/tx/${result.txHash}`} target="_blank" rel="noreferrer" className="block mt-4 font-mono text-xs text-primary/60 hover:text-primary underline">
                  VIEW TX ON BASESCAN ↗
                </a>
              )}
              <Button onClick={() => { setBattleState("IDLE"); setResult(null); }} className="mt-6 w-full clip-edges font-display" variant={result.win ? "default" : "outline"}>
                FIGHT AGAIN
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
