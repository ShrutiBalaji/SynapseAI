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
      .from('artifacts')
      .select(`
        *,
        profiles!artifacts_created_by_fkey(full_name, email)
      `);

    if (problemId) {
      query = query.eq('problem_id', problemId);
    }

    const { data: artifacts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching artifacts:", error);
      return NextResponse.json({ error: "Failed to fetch artifacts" }, { status: 500 });
    }

    return NextResponse.json({ artifacts });
  } catch (error) {
    console.error("Error in GET /api/artifacts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { problem_id, name, url, mime_type } = await req.json();
    
    if (!problem_id || !name || !url) {
      return NextResponse.json({ error: "Problem ID, name, and URL are required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";

    const { data: artifact, error } = await supabase
      .from('artifacts')
      .insert({
        problem_id,
        name,
        url,
        mime_type,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating artifact:", error);
      return NextResponse.json({ error: "Failed to create artifact" }, { status: 500 });
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error("Error in POST /api/artifacts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artifactId = searchParams.get('id');
    
    if (!artifactId) {
      return NextResponse.json({ error: "Artifact ID is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', artifactId);

    if (error) {
      console.error("Error deleting artifact:", error);
      return NextResponse.json({ error: "Failed to delete artifact" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/artifacts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
