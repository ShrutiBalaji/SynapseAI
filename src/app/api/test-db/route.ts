import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Test database connection
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        authError: authError?.message 
      }, { status: 401 });
    }

    // Test problems table
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('*')
      .limit(5);

    // Test chats table
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      problems: {
        data: problems,
        error: problemsError?.message
      },
      chats: {
        data: chats,
        error: chatsError?.message
      }
    });

  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      error: "Database test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
