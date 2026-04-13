import { getBacktests } from "@lantern/db";
import { ReportsList } from "../../components/reports-list";

export default async function BacktestsPage() {
  const reports = await getBacktests();
  return (
    <div className="dash-page">
      <ReportsList
        initialData={reports.map((report) => ({
          ...report,
          published_at_utc: String(report.published_at_utc)
        }))}
        endpoint="/api/public/backtests"
        title="Backtest and calibration reports"
        kicker="Backtests"
      />
    </div>
  );
}
