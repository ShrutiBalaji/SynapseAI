import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('problem_id');
    const unlinked = searchParams.get('unlinked'); // New parameter for unlinked chats
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    let query = supabase.from('chats').select('*');
    
    if (unlinked === 'true') {
      // Fetch unlinked chats (problem_id is null)
      query = query.is('problem_id', null);
    } else if (problemId) {
      // Fetch chats for a specific problem
      query = query.eq('problem_id', problemId);
    } else {
      return NextResponse.json({ error: "Either problem_id or unlinked=true is required" }, { status: 400 });
    }
    
    const { data: chats, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching chats:", error);
      return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
    }

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error in GET /api/chats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('id');
    
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";
    const isGuest = false;

    // Check if chat exists and get associated problem if any
    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select(`
        *,
        problems(owner_id, created_by)
      `)
      .eq('id', chatId)
      .single();

    if (fetchError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // For unlinked chats (problem_id is null), allow deletion by any authenticated user
    // For linked chats, check if user owns the associated problem
    if (chat.problem_id && chat.problems) {
      const problem = chat.problems;
      if (problem.owner_id !== userId && problem.created_by !== userId) {
        return NextResponse.json({ error: "Not authorized to delete this chat" }, { status: 403 });
      }
    }
    // If problem_id is null, allow deletion (unlinked chats can be deleted by any authenticated user)

    // Delete the chat
    const { error: deleteError } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (deleteError) {
      console.error("Error deleting chat:", deleteError);
      return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/chats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}