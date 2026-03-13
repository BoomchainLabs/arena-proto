import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Beaker, Cpu, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FighterCard } from "@/components/FighterCard"

export default function Mint() {
  const [isMinting, setIsMinting] = useState(false)
  const [mintedFighter, setMintedFighter] = useState<{
    id: string
    rarity: string
    stats: { strength: number; speed: number; intelligence: number }
  } | null>(null)
  const { toast } = useToast()

  const handleMint = () => {
    setIsMinting(true)
    setTimeout(() => {
      setIsMinting(false)
      const rarityRoll = Math.random()
      const newFighter = {
        id: Math.floor(Math.random() * 10000).toString(),
        rarity: rarityRoll > 0.97 ? 'Legendary' : rarityRoll > 0.85 ? 'Epic' : rarityRoll > 0.55 ? 'Rare' : 'Common',
        stats: {
          strength: Math.floor(Math.random() * 80) + 20,
          speed: Math.floor(Math.random() * 80) + 20,
          intelligence: Math.floor(Math.random() * 80) + 20,
        }
      }
      setMintedFighter(newFighter)
      toast({
        title: "SYNTHESIS COMPLETE",
        description: `Successfully minted ${newFighter.rarity} Fighter #${newFighter.id}`,
      })
    }, 3000)
  }

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
        {/* Mint Console */}
        <Card className="border-primary/20 h-fit">
          <CardContent className="p-6 lg:p-8">
            <div className="bg-black/50 border border-primary/30 p-4 mb-8 font-mono text-sm text-green-400 h-48 overflow-y-auto">
              <p>{">"} CONNECTING TO NEURAL NETWORK...</p>
              <p>{">"} STATUS: OK</p>
              <p>{">"} INITIALIZING DNA SEQUENCE GENERATOR...</p>
              <p className="text-muted-foreground mt-4">Waiting for user input to begin synthesis sequence.</p>
              {isMinting && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-yellow-400 mt-4 space-y-1">
                  <p>{">"} TX SUBMITTED. AWAITING CONFIRMATION...</p>
                  <p className="animate-pulse">{">"} ASSEMBLING CYBERNETICS [====      ]</p>
                </motion.div>
              )}
              {mintedFighter && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 mt-4 space-y-1">
                  <p>{">"} SYNTHESIS COMPLETE ✓</p>
                  <p>{">"} RARITY: {mintedFighter.rarity.toUpperCase()}</p>
                  <p>{">"} TOKEN_ID: #{mintedFighter.id}</p>
                </motion.div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="font-mono text-muted-foreground uppercase text-sm">Synthesis Cost</span>
                <span className="font-bold text-xl text-primary">0 ARENA <span className="text-sm text-muted-foreground">+ GAS</span></span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="font-mono text-muted-foreground uppercase text-sm">Network</span>
                <span className="font-bold flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Base Mainnet
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="font-mono text-muted-foreground uppercase text-sm">Legendary Drop Rate</span>
                <span className="font-bold text-yellow-400 text-sm">3%</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg font-display"
              onClick={handleMint}
              disabled={isMinting}
            >
              {isMinting ? (
                <>
                  <Cpu className="mr-2 h-5 w-5 animate-spin" />
                  SYNTHESIZING...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  SYNTHESIZE FIGHTER
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Display */}
        <div className="space-y-4">
          <h2 className="font-mono text-primary uppercase tracking-widest border-b border-border/50 pb-2">SYNTHESIS OUTPUT</h2>
          <AnimatePresence mode="wait">
            {mintedFighter ? (
              <motion.div
                key={mintedFighter.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-xs mx-auto"
              >
                <FighterCard {...mintedFighter} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-dashed border-border/50 clip-edges flex flex-col items-center justify-center p-16 opacity-50"
              >
                <Beaker className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="font-mono text-muted-foreground text-sm uppercase text-center">
                  No synthesis output.<br />Begin minting to generate a fighter.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
