import db from "@/lib/supabase/db";
import { fileDeltas } from "@/lib/supabase/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const deltas = await db
      .select()
      .from(fileDeltas)
      .where(eq(fileDeltas.fileId, fileId))
      .orderBy(asc(fileDeltas.createdAt));

    return NextResponse.json({ deltas });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
