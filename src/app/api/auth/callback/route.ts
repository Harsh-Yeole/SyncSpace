import { createServerSupabaseClient } from "@/lib/supabase/create-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestURL = new URL(req.url);
  const code = requestURL.searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${requestURL.origin}/dashboard`);
}
