
A Web3 battle arena prototype demonstrating how competitive games can be built on blockchain infrastructure.
This project combines smart contracts, a backend API server, and a frontend interface to allow players to own fighters, enter arena battles, and earn token rewards.

The repository is organized as a monorepo using pnpm workspaces so multiple services can be developed and deployed together.

⸻

Overview

Arena Protocol provides a framework for building on-chain competitive games where players can:
	•	Connect their wallet
	•	Own fighters as digital assets
	•	Enter arena battles
	•	Compete against other players
	•	Earn token rewards
	•	Trade fighters in a marketplace

The system integrates smart contracts, backend services, and a frontend UI into a single development workspace.

⸻

Project Structure
arena-proto/
│
├─ artifacts/
│   ├─ contracts/          # Solidity smart contracts
│   ├─ api-server/         # Backend API service
│   ├─ arena-protocol/     # Frontend arena interface
│   └─ mockup-sandbox/     # UI and feature experimentation
│
├─ scripts/                # Utility scripts
├─ lib/                    # Shared libraries
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.json

Smart Contracts
Located in:
artifacts/contracts/contracts/
ArenaCoin.sol

ERC-20 token used as the reward currency within the arena ecosystem.

Responsibilities:
	•	mint rewards
	•	transfer tokens
	•	track balances
	•	distribute battle prizes

⸻

ArenaFighter.sol

NFT contract representing fighters owned by players.

Features:
	•	mint fighters
	•	store fighter attributes
	•	track ownership
	•	transfer fighters between players

⸻

ArenaGame.sol

Core contract managing arena battles.

Responsibilities:
	•	register fighters for battles
	•	match players
	•	determine winners
	•	distribute rewards

⸻

ArenaMarketplace.sol

Marketplace contract allowing players to:
	•	buy fighters
	•	sell fighters
	•	trade digital assets


Backend API Server
Location
artifacts/api-server

The API server handles off-chain game logic.

Responsibilities include:
	•	player matchmaking
	•	battle execution
	•	leaderboard tracking
	•	blockchain interactions
	•	providing data to the frontend

  Example API endpoints
  POST /arena/join
POST /arena/battle
GET  /arena/results
GET  /health

Frontend Arena Interface
artifacts/arena-protocol

The frontend provides the player interface.

Features may include:
	•	wallet connection
	•	fighter selection
	•	arena battle interface
	•	reward display
	•	marketplace UI

Built with TypeScript and modern web tooling.

Mockup Sandbox
artifacts/mockup-sandbox
Used for:
	•	testing UI components
	•	experimenting with gameplay features
	•	prototyping arena mechanics

⸻

Requirements

Before running the project you need:
	•	Node.js 18+
	•	pnpm package manager
	•	a Web3 wallet (for blockchain interaction)


  Install pnpm if needed:
  npm install -g pnpm

  Installation

Clone the repository:
git clone https://github.com/BoomchainLabs/arena-proto.git
cd arena-proto

Install dependencies:
pnpm install

Development

Run type checking:
pnpm run typecheck

Build all packages:
pnpm run build
Because this project uses a workspace setup, commands run across all modules.

⸻

Deployment Workflow

Typical deployment process:
	1.	Deploy smart contracts
	2.	Configure API server with deployed contract addresses
	3.	Launch frontend interface
	4.	Connect wallet and start arena battles


Example Game Flow
Player connects wallet
        ↓
Player mints or buys fighter
        ↓
Player joins arena
        ↓
Battle occurs
        ↓
Winner receives ArenaCoin


Possible Extensions

This prototype can be expanded into a full Web3 game by adding:
	•	NFT fighter upgrades
	•	staking mechanics
	•	PvP wagering battles
	•	tournament leaderboards
	•	Telegram or mobile game integration
	•	cross-chain rewards

⸻

License

MIT License
:::
