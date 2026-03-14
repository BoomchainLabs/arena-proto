import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
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
