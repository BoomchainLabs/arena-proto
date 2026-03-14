import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { config } from "@/lib/wagmi";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Mint from "@/pages/Mint";
import Arena from "@/pages/Arena";
import Leaderboard from "@/pages/Leaderboard";
import Marketplace from "@/pages/Marketplace";
import Staking from "@/pages/Staking";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/mint" component={Mint} />
        <Route path="/arena" component={Arena} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/staking" component={Staking} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
