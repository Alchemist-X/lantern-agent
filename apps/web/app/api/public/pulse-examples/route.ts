import { getPublicPulseRecommendationExamples } from "../../../../lib/public-run-pulse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json(await getPublicPulseRecommendationExamples());
}
