import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('problem_id');
    const conjectureId = searchParams.get('conjecture_id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    let query = supabase
      .from('criticisms')
      .select(`
        *,
        profiles!criticisms_created_by_fkey(full_name, email),
        conjectures(content)
      `);

    if (problemId) {
      query = query.eq('problem_id', problemId);
    }

    if (conjectureId) {
      query = query.eq('conjecture_id', conjectureId);
    }

    const { data: criticisms, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching criticisms:", error);
      return NextResponse.json({ error: "Failed to fetch criticisms" }, { status: 500 });
    }

    return NextResponse.json({ criticisms });
  } catch (error) {
    console.error("Error in GET /api/criticisms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { problem_id, conjecture_id, content } = await req.json();
    
    if (!problem_id || !content) {
      return NextResponse.json({ error: "Problem ID and content are required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";

    const { data: criticism, error } = await supabase
      .from('criticisms')
      .insert({
        problem_id,
        conjecture_id,
        content,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating criticism:", error);
      return NextResponse.json({ error: "Failed to create criticism" }, { status: 500 });
    }

    return NextResponse.json({ criticism });
  } catch (error) {
    console.error("Error in POST /api/criticisms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
