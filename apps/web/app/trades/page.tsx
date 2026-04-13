import { LiveTrades } from "../../components/live-trades";
import { getPublicTradesData } from "../../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradesPage() {
  const trades = await getPublicTradesData();

  return (
    <div className="dash-page">
      <LiveTrades initialData={trades} />
    </div>
  );
}
