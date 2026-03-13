import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "wouter"
import { TerminalSquare, Swords, Users, Activity, Hexagon, Trophy, Store } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden clip-edges border border-primary/30 p-8 md:p-16 lg:p-24 min-h-[500px] flex items-center">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-card to-secondary/10" />
        <div className="absolute inset-0 scanlines z-0" />

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-mono text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              GAMEFI PROTOCOL v2.4.1 — LIVE ON BASE
            </p>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-none">
              <span className="text-white">ARENA</span>
              <br />
              <span className="text-primary neon-text">PROTOCOL</span>
            </h1>
            <p className="text-muted-foreground font-mono text-sm mb-8 max-w-lg leading-relaxed">
              Mint augmented fighters. Challenge opponents. Earn $ARENA. The most competitive on-chain battle system on Base Mainnet.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/arena">
                <Button size="lg" className="font-mono font-bold clip-edges">
                  <Swords className="mr-2 h-5 w-5" /> ENTER ARENA
                </Button>
              </Link>
              <Link href="/mint">
                <Button size="lg" variant="outline" className="font-mono font-bold clip-edges border-primary/50 text-primary hover:bg-primary/10">
                  <Hexagon className="mr-2 h-5 w-5" /> MINT FIGHTER
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ACTIVE FIGHTERS", value: "8,421", icon: Users, color: "text-primary" },
          { label: "BATTLES TODAY", value: "1,337", icon: Swords, color: "text-destructive" },
          { label: "WIN RATE AVG", value: "51.2%", icon: Activity, color: "text-secondary" },
          { label: "$ARENA REWARDS", value: "1.2M+", icon: Hexagon, color: "text-accent" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/40 border-border/30 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 bg-background/80 clip-edges border border-border/50`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{stat.label}</p>
                  <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TerminalSquare className="text-primary" /> SYSTEM_MODULES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/leaderboard" className="group block">
            <div className="relative overflow-hidden clip-edges border border-border/50 bg-card p-8 transition-all hover:border-primary">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="w-32 h-32 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors font-display">LEADERBOARD</h3>
              <p className="text-muted-foreground font-mono text-sm max-w-[80%]">View top ranked players, global win rates, and highest earners in the protocol.</p>
            </div>
          </Link>

          <Link href="/marketplace" className="group block">
            <div className="relative overflow-hidden clip-edges border border-border/50 bg-card p-8 transition-all hover:border-secondary">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Store className="w-32 h-32 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-secondary transition-colors font-display">MARKETPLACE</h3>
              <p className="text-muted-foreground font-mono text-sm max-w-[80%]">Trade augmented fighters with other players. Acquire legendary tier assets.</p>
            </div>
          </Link>

          <Link href="/arena" className="group block">
            <div className="relative overflow-hidden clip-edges border border-border/50 bg-card p-8 transition-all hover:border-destructive">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Swords className="w-32 h-32 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-destructive transition-colors font-display">BATTLE ARENA</h3>
              <p className="text-muted-foreground font-mono text-sm max-w-[80%]">Deploy your fighters in PvE or PvP combat. Win $ARENA token rewards on-chain.</p>
            </div>
          </Link>

          <Link href="/mint" className="group block">
            <div className="relative overflow-hidden clip-edges border border-border/50 bg-card p-8 transition-all hover:border-accent">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Hexagon className="w-32 h-32 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-accent transition-colors font-display">SYNTHESIS LAB</h3>
              <p className="text-muted-foreground font-mono text-sm max-w-[80%]">Generate unique augmented fighters via on-chain synthesis. Rarity is random.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
