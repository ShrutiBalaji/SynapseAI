import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('problem_id');
    const unlinked = searchParams.get('unlinked');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    let query = supabase.from('chat_conversations').select(`
      *,
      profiles(full_name, email)
    `);
    
    if (unlinked === 'true') {
      // Fetch unlinked conversations (problem_id is null)
      query = query.is('problem_id', null);
    } else if (problemId) {
      // Fetch conversations for a specific problem
      query = query.eq('problem_id', problemId);
    } else {
      return NextResponse.json({ error: "Either problem_id or unlinked=true is required" }, { status: 400 });
    }
    
    const { data: conversations, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error in GET /api/conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');
    
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Check if conversation exists and get associated problem if any
    const { data: conversation, error: fetchError } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        problems(owner_id, created_by)
      `)
      .eq('id', conversationId)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Authorization check removed - anyone can delete conversations
    
    // Delete the conversation (messages will be deleted automatically due to CASCADE)
    const { error: deleteError } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      console.error("Error deleting conversation:", deleteError);
      return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
