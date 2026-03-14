import { useGetPlayerStats, useGetBattleHistory } from "@workspace/api-client-react";
import { useAccount, useReadContract } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { User, Activity, Swords, Hexagon, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTRACTS, ARENA_FIGHTER_ABI, ARENA_COIN_ABI, RARITY_NAMES } from "@/lib/contracts";
import { formatUnits } from "viem";
import { injected } from "wagmi/connectors";
import { useConnect } from "wagmi";
import { Button } from "@/components/ui/button";

function useFighterCount(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

function useFighterToken(address?: `0x${string}`, index?: number) {
  return useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "tokenOfOwnerByIndex",
    args: address && index !== undefined ? [address, BigInt(index)] : undefined,
    query: { enabled: !!address && index !== undefined },
  });
}

function useFighterStats(tokenId?: bigint) {
  return useReadContract({
    address: CONTRACTS.ARENA_FIGHTER, abi: ARENA_FIGHTER_ABI,
    functionName: "stats", args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

function FighterMini({ tokenId }: { tokenId: bigint }) {
  const { data: s } = useFighterStats(tokenId);
  if (!s) return <div className="w-20 h-24 bg-card/40 animate-pulse clip-edges border border-border/20" />;
  const rarity = RARITY_NAMES[s[3]];
  const rarityColor = rarity === "Legendary" ? "text-accent border-accent/40" : rarity === "Epic" ? "text-secondary border-secondary/40" : rarity === "Rare" ? "text-blue-400 border-blue-400/40" : "text-muted-foreground border-border/40";
  return (
    <div className={`p-2 border clip-edges bg-card/40 ${rarityColor} text-center w-20`}>
      <div className="text-xs font-mono mb-1 truncate">#{String(tokenId)}</div>
      <div className="text-[10px] font-mono font-bold mb-1">{rarity.toUpperCase()}</div>
      <div className="text-[10px] font-mono text-muted-foreground">W:{s[4]} L:{s[5]}</div>
    </div>
  );
}

export default function Profile() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  const { data: stats, isLoading: statsLoading } = useGetPlayerStats(address || "");
  const { data: history, isLoading: historyLoading } = useGetBattleHistory({ address: address || undefined, limit: 10 });

  const { data: fighterCount } = useFighterCount(address);
  const { data: arenaBalance } = useReadContract({
    address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: t0 } = useFighterToken(address, 0);
  const { data: t1 } = useFighterToken(address, 1);
  const { data: t2 } = useFighterToken(address, fighterCount && fighterCount > 2 ? 2 : undefined);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <User className="w-16 h-16 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold font-display uppercase">ACCESS DENIED</h2>
        <p className="text-muted-foreground font-mono text-sm">Connect wallet to authenticate identity.</p>
        <Button onClick={() => connect({ connector: injected() })} className="font-mono clip-edges">
          CONNECT WALLET
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border/50 pb-8">
        <div className="w-20 h-20 bg-card border-2 border-primary clip-edges flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 scanlines" />
          <User className="w-10 h-10 text-primary relative z-10" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-widest text-white neon-text">
            {formatAddress(address!)}
          </h1>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noreferrer" className="text-primary font-mono text-sm flex items-center gap-2 hover:text-primary/80 transition-colors">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            VERIFIED ON BASE
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* On-chain Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="ARENA TOKENS" value={arenaBalance !== undefined ? `${parseFloat(formatUnits(arenaBalance, 18)).toFixed(2)}` : "---"} loading={false} color="text-primary" />
        <StatBox label="FIGHTERS OWNED" value={fighterCount !== undefined ? String(fighterCount) : "0"} loading={false} color="text-secondary" />
        <StatBox label="GLOBAL RANK" value={stats?.rank ? `#${stats.rank}` : "---"} loading={statsLoading} color="text-accent" />
        <StatBox label="WIN RATE" value={stats ? `${Math.round((stats.totalWins / Math.max(stats.totalBattles, 1)) * 100)}%` : "---"} loading={statsLoading} color="text-green-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="TOTAL BATTLES" value={stats?.totalBattles?.toString() ?? "0"} loading={statsLoading} color="text-white" />
        <StatBox label="TOTAL WINS" value={stats?.totalWins?.toString() ?? "0"} loading={statsLoading} color="text-green-400" />
        <StatBox label="TOTAL REWARDS" value={stats ? `${stats.totalRewards} ARENA` : "---"} loading={statsLoading} color="text-accent" />
        <StatBox label="LOSSES" value={stats ? String(stats.totalBattles - stats.totalWins) : "0"} loading={statsLoading} color="text-destructive" />
      </div>

      {/* Fighter Collection */}
      {fighterCount !== undefined && fighterCount > 0 && (
        <Card className="border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Hexagon className="w-5 h-5 text-secondary" /> FIGHTER COLLECTION ({String(fighterCount)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {[t0, t1, t2].filter(Boolean).map(id => <FighterMini key={String(id)} tokenId={id!} />)}
              {fighterCount > 3n && (
                <div className="w-20 h-24 border border-dashed border-border/40 clip-edges flex items-center justify-center">
                  <span className="font-mono text-xs text-muted-foreground">+{String(fighterCount - 3n)} more</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Combat Log */}
      <Card className="border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Activity className="w-5 h-5 text-primary" /> COMBAT LOG
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="py-8 text-center text-primary font-mono animate-pulse">FETCHING LOGS...</div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map(record => (
                <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 border border-border/20 clip-edges font-mono text-sm hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <span className={record.win ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{record.win ? "VICTORY" : "DEFEAT"}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>FIGHTER #{record.fighterId}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground text-xs">{record.mode}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className={record.win ? "text-green-400 font-bold" : "text-muted-foreground"}>
                      {record.win ? `+${record.reward} ARENA` : "0 ARENA"}
                    </span>
                    {record.txHash && (
                      <a href={`https://basescan.org/tx/${record.txHash}`} target="_blank" rel="noreferrer" className="text-primary/60 hover:text-primary underline text-xs">
                        VIEW TX
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-border/30 clip-edges">
              <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="font-mono text-muted-foreground uppercase">NO COMBAT RECORDS FOUND</p>
              <p className="text-xs text-muted-foreground/70 mt-1 font-mono">Head to the Arena to start fighting</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, loading, color }: { label: string; value: string; loading: boolean; color: string }) {
  return (
    <div className="bg-card/40 border border-border/50 p-4 clip-edges">
      <p className="font-mono text-xs text-muted-foreground mb-1">{label}</p>
      {loading ? <div className="h-8 w-16 bg-white/5 animate-pulse rounded" /> : <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>}
    </div>
  );
}
