import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: problems, error } = await supabase
      .from('problems')
      .select(`
        *,
        profiles!problems_created_by_fkey(full_name, email),
        problem_collaborators(
          user_id,
          role,
          profiles(full_name, email)
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching problems:", error);
      return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
    }

    return NextResponse.json({ problems });
  } catch (error) {
    console.error("Error in GET /api/problems:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, status = 'open', priority = 'medium' } = await req.json();
    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";
    const isGuest = false;

    const { data: problem, error } = await supabase
      .from('problems')
      .insert({
        title,
        description,
        status,
        priority,
        owner_id: userId,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating problem:", error);
      return NextResponse.json({ error: "Failed to create problem" }, { status: 500 });
    }

    // Add creator as collaborator
    await supabase
      .from('problem_collaborators')
      .insert({
        problem_id: problem.id,
        user_id: userId,
        role: 'owner'
      });

    return NextResponse.json({ problem });
  } catch (error) {
    console.error("Error in POST /api/problems:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('id');
    
    if (!problemId) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    const updates = await req.json();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: problem, error } = await supabase
      .from('problems')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', problemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating problem:", error);
      return NextResponse.json({ error: "Failed to update problem" }, { status: 500 });
    }

    return NextResponse.json({ problem });
  } catch (error) {
    console.error("Error in PUT /api/problems:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('id');
    
    if (!problemId) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";
    const isGuest = false;

    // Check if user owns the problem
    const { data: problem, error: fetchError } = await supabase
      .from('problems')
      .select('owner_id, created_by')
      .eq('id', problemId)
      .single();

    if (fetchError || !problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Authorization check removed - anyone can delete problems

    // Delete related data first (due to foreign key constraints)
    await supabase.from('problem_collaborators').delete().eq('problem_id', problemId);
    
    // Unlink chats from the problem instead of deleting them (chats are separate entities)
    await supabase.from('chats').update({ problem_id: null }).eq('problem_id', problemId);
    
    // Delete problem-specific data
    await supabase.from('conjectures').delete().eq('problem_id', problemId);
    await supabase.from('criticisms').delete().eq('problem_id', problemId);
    await supabase.from('artifacts').delete().eq('problem_id', problemId);

    // Delete the problem
    const { error: deleteError } = await supabase
      .from('problems')
      .delete()
      .eq('id', problemId);

    if (deleteError) {
      console.error("Error deleting problem:", deleteError);
      return NextResponse.json({ error: "Failed to delete problem" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/problems:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}