import { Link, useLocation } from "wouter";
import { Home, Swords, Trophy, ShoppingBag, User, Hexagon, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletButton } from "@/components/WalletButton";

const navItems = [
  { href: "/",            label: "Home",        icon: Home },
  { href: "/mint",        label: "Mint",        icon: Hexagon },
  { href: "/arena",       label: "Arena",       icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/marketplace", label: "Market",      icon: ShoppingBag },
  { href: "/staking",     label: "Stake",       icon: Coins },
  { href: "/profile",     label: "Profile",     icon: User },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-primary clip-edges flex items-center justify-center">
              <Swords className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-widest font-mono text-primary hidden sm:block">ARENA PROTOCOL</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono clip-edges transition-colors",
                  location === href
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0">
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24 lg:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border/50 z-50">
        <div className="grid grid-cols-7 h-16">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-xs font-mono transition-colors h-full",
                location === href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
