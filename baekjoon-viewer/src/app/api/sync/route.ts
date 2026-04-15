import { NextResponse } from "next/server";
import { syncProblems } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = syncProblems();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
