import { DashboardPositions } from "../../components/dashboard-positions";
import { getPublicOverviewData, getPublicPositionsData } from "../../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PositionsPage() {
  const [overview, positions] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData()
  ]);

  return (
    <div className="dash-page">
      <DashboardPositions initialData={positions} totalEquityUsd={overview.total_equity_usd} />
    </div>
  );
}
