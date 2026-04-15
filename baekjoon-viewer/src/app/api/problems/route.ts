import { NextRequest, NextResponse } from "next/server";
import { getProblems, getAllTags, getTierStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");

  if (type === "tags") {
    return NextResponse.json(getAllTags());
  }

  if (type === "tiers") {
    return NextResponse.json(getTierStats());
  }

  const page = parseInt(params.get("page") || "1");
  const limit = parseInt(params.get("limit") || "50");
  const tier = params.has("tier") ? parseInt(params.get("tier")!) : undefined;
  const tag = params.get("tag") || undefined;
  const search = params.get("search") || undefined;

  const result = getProblems({ page, limit, tier, tag, search });
  return NextResponse.json(result);
}
