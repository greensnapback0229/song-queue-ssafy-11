import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROBLEMS_DIR = process.env.PROBLEMS_DIR || "/data/problems";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  const imgPath = path.join(PROBLEMS_DIR, id, "images", filename);

  if (!fs.existsSync(imgPath)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };

  const buffer = fs.readFileSync(imgPath);
  return new NextResponse(buffer, {
    headers: { "Content-Type": mimeMap[ext] || "application/octet-stream" },
  });
}
