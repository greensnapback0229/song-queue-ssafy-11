import { NextRequest, NextResponse } from "next/server";
import { getProblem } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PROBLEMS_DIR = process.env.PROBLEMS_DIR || "/data/problems";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const problemId = parseInt(id);

  const problem = getProblem(problemId);
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  let html = "";
  const htmlPath = path.join(PROBLEMS_DIR, String(problemId), "problem.html");
  if (fs.existsSync(htmlPath)) {
    html = fs.readFileSync(htmlPath, "utf-8");
  }

  return NextResponse.json({ ...problem, html });
}
