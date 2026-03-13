import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string) {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getRarityColor(rarity: string) {
  switch (rarity.toLowerCase()) {
    case 'legendary': return 'text-yellow-400 border-yellow-400 shadow-[0_0_15px_rgba(255,191,0,0.3)]'
    case 'epic': return 'text-purple-400 border-purple-400 shadow-[0_0_15px_rgba(191,64,255,0.3)]'
    case 'rare': return 'text-blue-400 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
    default: return 'text-muted-foreground border-muted-foreground'
  }
}
