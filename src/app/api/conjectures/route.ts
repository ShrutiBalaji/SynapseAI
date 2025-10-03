import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('problem_id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    let query = supabase
      .from('conjectures')
      .select(`
        *,
        profiles!conjectures_created_by_fkey(full_name, email)
      `);

    if (problemId) {
      query = query.eq('problem_id', problemId);
    }

    const { data: conjectures, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching conjectures:", error);
      return NextResponse.json({ error: "Failed to fetch conjectures" }, { status: 500 });
    }

    return NextResponse.json({ conjectures });
  } catch (error) {
    console.error("Error in GET /api/conjectures:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { problem_id, content } = await req.json();
    
    if (!problem_id || !content) {
      return NextResponse.json({ error: "Problem ID and content are required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";

    const { data: conjecture, error } = await supabase
      .from('conjectures')
      .insert({
        problem_id,
        content,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conjecture:", error);
      return NextResponse.json({ error: "Failed to create conjecture" }, { status: 500 });
    }

    return NextResponse.json({ conjecture });
  } catch (error) {
    console.error("Error in POST /api/conjectures:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
