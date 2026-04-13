import { PreviewTerminal } from "../../../components/preview-terminal";
import { getPreviewDashboardData } from "../../../lib/preview-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TerminalPreviewPage() {
  const data = await getPreviewDashboardData();
  return <PreviewTerminal data={data} />;
}
