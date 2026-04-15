import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROBLEMS_DIR = process.env.PROBLEMS_DIR || "/data/problems";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svgPath = path.join(PROBLEMS_DIR, "_tiers", `${id}.svg`);

  if (!fs.existsSync(svgPath)) {
    return NextResponse.json({ error: "Tier not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(svgPath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
