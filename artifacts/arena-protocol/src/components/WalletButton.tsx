import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import { CONTRACTS, ARENA_COIN_ABI } from "@/lib/contracts";
import { useReadContract } from "wagmi";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { formatUnits } from "viem";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  const { data: ethBalance } = useBalance({ address });
  const { data: arenaBalance } = useReadContract({
    address: CONTRACTS.ARENA_COIN,
    abi: ARENA_COIN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected) {
    return (
      <Button
        size="sm"
        className="font-mono text-xs clip-edges gap-2"
        onClick={() => connect({ connector: injected() })}
      >
        <Wallet className="w-3.5 h-3.5" />
        CONNECT
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="font-mono text-xs clip-edges border-primary/40 text-primary gap-1.5"
        onClick={() => setOpen(o => !o)}
      >
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        {formatAddress(address!)}
        <ChevronDown className="w-3 h-3" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border/60 clip-edges z-50 p-3 space-y-2 shadow-xl">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-2">Wallet</div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">ETH</span>
            <span className="text-foreground">{ethBalance ? parseFloat(ethBalance.formatted).toFixed(5) : "---"}</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">ARENA</span>
            <span className="text-primary font-bold">
              {arenaBalance !== undefined ? parseFloat(formatUnits(arenaBalance, 18)).toFixed(2) : "---"}
            </span>
          </div>
          <div className="pt-2 border-t border-border/40">
            <button
              className="flex items-center gap-2 text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
              onClick={() => { disconnect(); setOpen(false); }}
            >
              <LogOut className="w-3 h-3" /> DISCONNECT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
