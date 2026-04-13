import { DashboardPnlSummary } from "../../components/dashboard-pnl-summary";
import { PnlPortfolio } from "../../components/pnl-portfolio";
import {
  getPublicOverviewData,
  getPublicPositionsData,
  getPublicTradesData,
  getSpectatorClosedPositionsData,
  isSpectatorWalletMode
} from "../../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PnlPage() {
  const spectatorMode = isSpectatorWalletMode();
  const [overview, positions, trades, closedPositions] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorClosedPositionsData()
  ]);

  return (
    <div className="dash-page">
      <DashboardPnlSummary
        initialPositions={positions}
        initialClosedPositions={closedPositions}
      />
      <PnlPortfolio
        initialOverview={overview}
        initialPositions={positions}
        initialTrades={trades}
        initialClosedPositions={closedPositions}
        spectatorMode={spectatorMode}
        detailed
      />
    </div>
  );
}
