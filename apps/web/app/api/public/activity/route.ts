import { getSpectatorActivityData } from "../../../../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json(await getSpectatorActivityData());
}
