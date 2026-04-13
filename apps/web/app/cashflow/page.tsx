import { CashflowLedger } from "../../components/cashflow-ledger";
import { getSpectatorActivityData } from "../../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CashflowPage() {
  const activity = await getSpectatorActivityData();

  return (
    <div className="dash-page">
      <CashflowLedger initialData={activity} />
    </div>
  );
}
