import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({
      projectId: "arena-protocol-base",
      metadata: {
        name: "Arena Protocol",
        description: "The most competitive on-chain battle system on Base Mainnet",
        url: typeof window !== "undefined" ? window.location.origin : "https://arenaprotocol.xyz",
        icons: [],
      },
      showQrModal: false,
    }),
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
