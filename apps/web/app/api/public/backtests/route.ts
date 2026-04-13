import { getBacktests } from "@lantern/db";

export async function GET() {
  return Response.json(await getBacktests());
}

