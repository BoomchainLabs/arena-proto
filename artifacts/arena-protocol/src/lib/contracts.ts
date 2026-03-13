export const CONTRACTS = {
  ARENA_COIN:       "0x217342a0e02e4a4018dd42f5e466ea465541f953" as const,
  ARENA_FIGHTER:    "0x1379A9F4Cec7fbE321c8F87A9D6c88DEF0110602" as const,
  ARENA_GAME:       "0x983c30CBAD30042043319DB682620Be7B06d3b67" as const,
  ARENA_MARKETPLACE:"0x2Cf22D1A8D37b37Dc93dA5e1B94096C6a142a7e9" as const,
} as const;

// ── ArenaCoin (ERC-20) ─────────────────────────────────────────────────────
export const ARENA_COIN_ABI = [
  { name: "name",        type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "string" }] },
  { name: "symbol",      type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "string" }] },
  { name: "decimals",    type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint8"  }] },
  { name: "totalSupply", type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf",   type: "function", stateMutability: "view",       inputs: [{ name: "account", type: "address" }],                          outputs: [{ name: "", type: "uint256" }] },
  { name: "allowance",   type: "function", stateMutability: "view",       inputs: [{ name: "owner",   type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "approve",     type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount",  type: "uint256" }], outputs: [{ name: "", type: "bool"    }] },
  { name: "transfer",    type: "function", stateMutability: "nonpayable", inputs: [{ name: "to",      type: "address" }, { name: "amount",  type: "uint256" }], outputs: [{ name: "", type: "bool"    }] },
  { name: "transferFrom",type: "function", stateMutability: "nonpayable", inputs: [{ name: "from",    type: "address" }, { name: "to",      type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "mint",        type: "function", stateMutability: "nonpayable", inputs: [{ name: "to",      type: "address" }, { name: "amount",  type: "uint256" }], outputs: [] },
  { name: "burn",        type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount",  type: "uint256" }],                          outputs: [] },
  { name: "owner",       type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "address" }] },
  { name: "Transfer",    type: "event",    inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { name: "Approval",    type: "event",    inputs: [{ name: "owner", type: "address", indexed: true }, { name: "spender", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
] as const;

// ── ArenaFighter (ERC-721 NFT) ─────────────────────────────────────────────
export const ARENA_FIGHTER_ABI = [
  { name: "mint",          type: "function", stateMutability: "nonpayable", inputs: [{ name: "rarity", type: "uint8" }],                            outputs: [{ name: "tokenId", type: "uint256" }] },
  { name: "ownerOf",       type: "function", stateMutability: "view",       inputs: [{ name: "tokenId", type: "uint256" }],                         outputs: [{ name: "", type: "address" }] },
  { name: "balanceOf",     type: "function", stateMutability: "view",       inputs: [{ name: "owner",   type: "address" }],                         outputs: [{ name: "", type: "uint256" }] },
  { name: "tokenByIndex",  type: "function", stateMutability: "view",       inputs: [{ name: "index",   type: "uint256" }],                         outputs: [{ name: "", type: "uint256" }] },
  { name: "tokenOfOwnerByIndex", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "totalSupply",   type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint256" }] },
  { name: "approve",       type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [] },
  { name: "setApprovalForAll", type: "function", stateMutability: "nonpayable", inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [] },
  { name: "isApprovedForAll", type: "function", stateMutability: "view",    inputs: [{ name: "owner", type: "address" }, { name: "operator", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "stats",         type: "function", stateMutability: "view",       inputs: [{ name: "tokenId", type: "uint256" }],                         outputs: [
    { name: "strength",     type: "uint8"   },
    { name: "speed",        type: "uint8"   },
    { name: "intelligence", type: "uint8"   },
    { name: "rarity",       type: "uint8"   },
    { name: "wins",         type: "uint32"  },
    { name: "losses",       type: "uint32"  },
    { name: "mintedAt",     type: "uint256" },
  ]},
  { name: "mintCost",      type: "function", stateMutability: "view",       inputs: [{ name: "rarity", type: "uint8" }],                            outputs: [{ name: "", type: "uint256" }] },
  { name: "nextTokenId",   type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint256" }] },
  { name: "FighterMinted", type: "event",    inputs: [{ name: "owner", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }, { name: "rarity", type: "uint8", indexed: false }] },
] as const;

// ── ArenaGame ─────────────────────────────────────────────────────────────
export const ARENA_GAME_ABI = [
  { name: "battlePvE",     type: "function", stateMutability: "nonpayable", inputs: [{ name: "attackerTokenId", type: "uint256" }],                  outputs: [{ name: "battleId", type: "uint256" }] },
  { name: "battlePvP",     type: "function", stateMutability: "nonpayable", inputs: [{ name: "attackerTokenId", type: "uint256" }, { name: "defenderTokenId", type: "uint256" }], outputs: [{ name: "battleId", type: "uint256" }] },
  { name: "pveWinReward",  type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint256" }] },
  { name: "pvpWinReward",  type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint256" }] },
  { name: "battleCooldown",type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint256" }] },
  { name: "lastBattleTime",type: "function", stateMutability: "view",       inputs: [{ name: "tokenId", type: "uint256" }],                          outputs: [{ name: "", type: "uint256" }] },
  { name: "battleCount",   type: "function", stateMutability: "view",       inputs: [],                                                              outputs: [{ name: "", type: "uint256" }] },
  { name: "BattleResolved",type: "event",    inputs: [
    { name: "battleId",         type: "uint256", indexed: true  },
    { name: "attackerTokenId",  type: "uint256", indexed: true  },
    { name: "defenderTokenId",  type: "uint256", indexed: true  },
    { name: "outcome",          type: "uint8",   indexed: false },
    { name: "reward",           type: "uint256", indexed: false },
  ]},
] as const;

// ── ArenaMarketplace ──────────────────────────────────────────────────────
export const ARENA_MARKETPLACE_ABI = [
  { name: "list",      type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], outputs: [] },
  { name: "delist",    type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }],                               outputs: [] },
  { name: "buy",       type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }],                               outputs: [] },
  { name: "listings",  type: "function", stateMutability: "view",       inputs: [{ name: "tokenId", type: "uint256" }],                               outputs: [
    { name: "seller", type: "address" },
    { name: "price",  type: "uint256" },
    { name: "active", type: "bool"    },
  ]},
  { name: "feeBps",    type: "function", stateMutability: "view",       inputs: [],                                                                    outputs: [{ name: "", type: "uint16" }] },
  { name: "Listed",    type: "event",    inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "seller", type: "address", indexed: true }, { name: "price", type: "uint256", indexed: false }] },
  { name: "Sold",      type: "event",    inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "buyer",  type: "address", indexed: true }, { name: "price", type: "uint256", indexed: false }] },
] as const;

// ── Rarity helpers ─────────────────────────────────────────────────────────
export const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary"] as const;
export type RarityName = typeof RARITY_NAMES[number];

export const RARITY_INDEX: Record<RarityName, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3,
};

export const MINT_COSTS: Record<RarityName, bigint> = {
  Common:    50n  * 10n ** 18n,
  Rare:      150n * 10n ** 18n,
  Epic:      400n * 10n ** 18n,
  Legendary: 1000n * 10n ** 18n,
};
