import { useState } from "react";
import { useGetMarketListings } from "@workspace/api-client-react";
import { Store, Filter, Tag, ShoppingCart, X } from "lucide-react";
import { FighterCard } from "@/components/FighterCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, ARENA_COIN_ABI, ARENA_MARKETPLACE_ABI } from "@/lib/contracts";
import { formatAddress } from "@/lib/utils";

type Listing = { tokenId: string; seller: string; price: string; rarity: string; strength: number; speed: number; intelligence: number; wins: number; losses: number };

function BuyModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const { address } = useAccount();
  const { toast } = useToast();
  const priceWei = parseUnits(listing.price, 18);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.ARENA_MARKETPLACE] : undefined,
    query: { enabled: !!address },
  });
  const { data: arenaBalance } = useReadContract({
    address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract: approveWrite, data: approveTxHash } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });

  const { writeContract: buyWrite, data: buyTxHash } = useWriteContract();
  const { isSuccess: buySuccess } = useWaitForTransactionReceipt({ hash: buyTxHash });

  const needsApproval = !allowance || allowance < priceWei;
  const insufficient = arenaBalance !== undefined && arenaBalance < priceWei;

  const handleBuy = () => {
    if (!address) return;
    if (needsApproval) {
      approveWrite({ address: CONTRACTS.ARENA_COIN, abi: ARENA_COIN_ABI, functionName: "approve", args: [CONTRACTS.ARENA_MARKETPLACE, priceWei] });
    } else {
      buyWrite({ address: CONTRACTS.ARENA_MARKETPLACE, abi: ARENA_MARKETPLACE_ABI, functionName: "buy", args: [BigInt(listing.tokenId)] });
    }
  };

  if (approveSuccess && needsApproval) {
    refetchAllowance();
    buyWrite({ address: CONTRACTS.ARENA_MARKETPLACE, abi: ARENA_MARKETPLACE_ABI, functionName: "buy", args: [BigInt(listing.tokenId)] });
  }

  if (buySuccess) {
    toast({ title: "PURCHASE COMPLETE", description: `Fighter #${listing.tokenId} acquired!` });
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-sm w-full border-secondary/40 clip-edges" onClick={e => e.stopPropagation()}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-xl">PURCHASE FIGHTER</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
          </div>
          <FighterCard id={listing.tokenId} rarity={listing.rarity} stats={{ strength: listing.strength, speed: listing.speed, intelligence: listing.intelligence }} wins={listing.wins} losses={listing.losses} />
          <div className="mt-4 space-y-2 text-sm font-mono">
            <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="text-accent font-bold">{listing.price} ARENA</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Seller</span><span>{formatAddress(listing.seller)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Your ARENA</span><span className={insufficient ? "text-destructive" : "text-green-400"}>{arenaBalance ? parseFloat(formatUnits(arenaBalance, 18)).toFixed(2) : "---"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fee (2.5%)</span><span>{(parseFloat(listing.price) * 0.025).toFixed(2)} ARENA</span></div>
          </div>
          {insufficient && <p className="text-destructive font-mono text-xs mt-3">Insufficient ARENA balance</p>}
          <Button className="w-full mt-4 font-display clip-edges" onClick={handleBuy} disabled={insufficient}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {needsApproval ? "APPROVE & BUY" : "CONFIRM PURCHASE"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Marketplace() {
  const { data: listings, isLoading } = useGetMarketListings({ limit: 20 });
  const { isConnected } = useAccount();
  const [buyTarget, setBuyTarget] = useState<Listing | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>("All");

  const filtered = listings?.filter(l => rarityFilter === "All" || l.rarity === rarityFilter) ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/10 clip-edges border border-secondary/30">
            <Store className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display uppercase tracking-widest text-secondary">Black Market</h1>
            <p className="text-muted-foreground font-mono text-sm">P2P Asset Exchange Hub — Powered by Base</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["All", "Common", "Rare", "Epic", "Legendary"].map(r => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 font-mono text-xs clip-edges border transition-all ${rarityFilter === r ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-border"}`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts row */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "ARENA COIN",    addr: CONTRACTS.ARENA_COIN },
          { label: "FIGHTER NFT",   addr: CONTRACTS.ARENA_FIGHTER },
          { label: "ARENA GAME",    addr: CONTRACTS.ARENA_GAME },
          { label: "MARKETPLACE",   addr: CONTRACTS.ARENA_MARKETPLACE },
        ].map(({ label, addr }) => (
          <a key={addr} href={`https://basescan.org/address/${addr}#code`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 p-2 border border-border/30 clip-edges bg-card/30 hover:border-primary/40 transition-colors">
            <Tag className="w-3 h-3 text-primary flex-shrink-0" />
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">{label}</p>
              <p className="font-mono text-xs text-primary truncate">{addr.slice(0, 10)}...</p>
            </div>
          </a>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-[3/4] bg-card/40 animate-pulse clip-edges border border-border/20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(item => (
            <FighterCard
              key={item.tokenId}
              id={item.tokenId} rarity={item.rarity}
              stats={{ strength: item.strength, speed: item.speed, intelligence: item.intelligence }}
              wins={item.wins} losses={item.losses} price={item.price}
              onClick={() => isConnected ? setBuyTarget(item as Listing) : undefined}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-border/50 clip-edges">
              <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="font-mono text-muted-foreground uppercase">NO LISTINGS IN CURRENT SECTOR</p>
            </div>
          )}
        </div>
      )}

      {buyTarget && <BuyModal listing={buyTarget} onClose={() => setBuyTarget(null)} />}
    </div>
  );
}
