import { getReports } from "@lantern/db";
import { ReportsList } from "../../components/reports-list";

export default async function ReportsPage() {
  const reports = await getReports();
  return (
    <div className="dash-page">
      <ReportsList
        initialData={reports.map((report) => ({
          ...report,
          published_at_utc: String(report.published_at_utc)
        }))}
        endpoint="/api/public/reports"
        title="Pulse, review, monitor, rebalance and resolution artifacts"
        kicker="Reports"
      />
    </div>
  );
}
