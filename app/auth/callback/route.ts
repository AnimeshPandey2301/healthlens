import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } catch {
      // fall through to redirect to login on any error
    }
  }

  // No code or exchange failed — send to login
  return NextResponse.redirect(`${origin}/auth/login`);
}
