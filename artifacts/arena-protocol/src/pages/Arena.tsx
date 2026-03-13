import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FighterCard } from "@/components/FighterCard"
import { Swords, User, Bot, Skull } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRecordBattle } from "@workspace/api-client-react"
import { useMockAccount } from "@/lib/wagmi"
import { motion, AnimatePresence } from "framer-motion"

const myFighters = [
  {
    id: "1042",
    rarity: "Epic",
    stats: { strength: 85, speed: 60, intelligence: 70 },
    wins: 12, losses: 4
  },
  {
    id: "891",
    rarity: "Rare",
    stats: { strength: 40, speed: 90, intelligence: 65 },
    wins: 5, losses: 8
  },
  {
    id: "3301",
    rarity: "Legendary",
    stats: { strength: 95, speed: 80, intelligence: 90 },
    wins: 28, losses: 3
  },
]

export default function Arena() {
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [mode, setMode] = useState<'PVE' | 'PVP'>('PVE')
  const [battleState, setBattleState] = useState<'IDLE' | 'FIGHTING' | 'RESULT'>('IDLE')
  const [result, setResult] = useState<{ win: boolean; reward: string } | null>(null)

  const { address } = useMockAccount()
  const { toast } = useToast()

  const { mutateAsync: recordBattle } = useRecordBattle()

  const handleBattle = async () => {
    if (!selectedFighter) return
    if (!address) {
      toast({ title: "Error", description: "Connect wallet first", variant: "destructive" })
      return
    }

    setBattleState('FIGHTING')

    setTimeout(async () => {
      const isWin = Math.random() > 0.4
      const reward = isWin ? String(Math.floor(Math.random() * 20) + 10) : "0"

      setResult({ win: isWin, reward })
      setBattleState('RESULT')

      try {
        await recordBattle({
          data: {
            player: address,
            fighterId: selectedFighter,
            win: isWin,
            reward,
            mode,
            txHash: "0xmock" + Date.now().toString(16),
          }
        })
      } catch (err) {
        console.error("Failed to record battle", err)
      }
    }, 4000)
  }

  const resetArena = () => {
    setBattleState('IDLE')
    setResult(null)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-destructive/10 clip-edges border border-destructive/30">
          <Swords className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-widest text-destructive">Battle Arena</h1>
          <p className="text-muted-foreground font-mono text-sm">Risk $ARENA. Destroy opponents. Claim rewards.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {battleState === 'IDLE' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Fighter Selection */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="font-mono text-primary uppercase tracking-widest border-b border-border/50 pb-2">Select Combatant</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {myFighters.map(f => (
                    <FighterCard
                      key={f.id}
                      {...f}
                      onClick={() => setSelectedFighter(f.id)}
                      selected={selectedFighter === f.id}
                    />
                  ))}
                  <div className="border border-dashed border-border/50 clip-edges flex flex-col items-center justify-center p-6 opacity-50 cursor-not-allowed min-h-[180px]">
                    <User className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="font-mono text-xs text-muted-foreground text-center">SLOT AVAILABLE</p>
                  </div>
                </div>
              </div>

              {/* Battle Config */}
              <div className="space-y-6">
                <h2 className="font-mono text-primary uppercase tracking-widest border-b border-border/50 pb-2">Battle Settings</h2>
                <Card className="bg-card/40 border-border/30">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground mb-2 uppercase">Mode</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={mode === 'PVE' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMode('PVE')}
                          className="font-mono"
                        >
                          <Bot className="w-4 h-4 mr-1" /> PvE
                        </Button>
                        <Button
                          variant={mode === 'PVP' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMode('PVP')}
                          className="font-mono"
                        >
                          <User className="w-4 h-4 mr-1" /> PvP
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-border/30 pt-4 space-y-2">
                      <div className="flex justify-between font-mono text-sm">
                        <span className="text-muted-foreground">Win Reward</span>
                        <span className="text-green-400">+10-30 ARENA</span>
                      </div>
                      <div className="flex justify-between font-mono text-sm">
                        <span className="text-muted-foreground">Risk</span>
                        <span className="text-muted-foreground">None</span>
                      </div>
                    </div>

                    <Button
                      className="w-full font-display font-bold clip-edges"
                      onClick={handleBattle}
                      disabled={!selectedFighter}
                    >
                      <Swords className="mr-2 h-4 w-4" />
                      INITIATE COMBAT
                    </Button>
                    {!selectedFighter && (
                      <p className="text-xs text-muted-foreground font-mono text-center">Select a fighter to proceed</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {battleState === 'FIGHTING' && (
          <motion.div
            key="fighting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] space-y-8"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 0.9, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block"
              >
                <Swords className="w-24 h-24 text-destructive" />
              </motion.div>
              <h2 className="text-4xl font-display font-bold text-destructive mt-6 animate-pulse">COMBAT IN PROGRESS</h2>
              <p className="text-muted-foreground font-mono mt-2">Fighter #{selectedFighter} is battling...</p>
              <div className="mt-6 flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-destructive rounded-full"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {battleState === 'RESULT' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] space-y-8"
          >
            <div className={`text-center p-12 clip-edges border-2 ${result.win ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'} max-w-md w-full`}>
              {result.win ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-8xl mb-4"
                  >
                    ⚔️
                  </motion.div>
                  <h2 className="text-5xl font-display font-black text-green-400 mb-4">VICTORY</h2>
                  <p className="font-mono text-muted-foreground mb-2">Fighter #{selectedFighter}</p>
                  <p className="text-3xl font-bold text-green-400 font-display">+{result.reward} ARENA</p>
                </>
              ) : (
                <>
                  <Skull className="w-24 h-24 text-destructive mx-auto mb-4" />
                  <h2 className="text-5xl font-display font-black text-destructive mb-4">DEFEATED</h2>
                  <p className="font-mono text-muted-foreground">Fighter #{selectedFighter} was eliminated</p>
                  <p className="text-muted-foreground font-mono mt-2">+0 ARENA</p>
                </>
              )}
              <Button onClick={resetArena} className="mt-8 w-full clip-edges font-display" variant={result.win ? "default" : "outline"}>
                FIGHT AGAIN
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
