import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const envCheck = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    openaiKey: !!process.env.OPENAI_API_KEY,
    supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
    supabaseAnonKeyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
    openaiKeyValue: process.env.OPENAI_API_KEY ? "Set" : "Not set",
  };

  return NextResponse.json({
    environment: envCheck,
    message: "Environment check completed"
  });
}
