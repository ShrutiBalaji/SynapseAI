import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all problems
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('id');

    if (problemsError) {
      console.error("Error fetching problems:", problemsError);
      return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
    }

    if (!problems || problems.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    const problemIds = problems.map(p => p.id);
    const counts: Record<number, { conversations: number; conjectures: number; criticisms: number; artifacts: number }> = {};

    // Initialize counts for all problems
    problemIds.forEach(id => {
      counts[id] = { conversations: 0, conjectures: 0, criticisms: 0, artifacts: 0 };
    });

    // Get conversation counts
    const { data: conversationCounts, error: convError } = await supabase
      .from('chat_conversations')
      .select('problem_id')
      .in('problem_id', problemIds);

    if (!convError && conversationCounts) {
      conversationCounts.forEach(conv => {
        if (conv.problem_id && counts[conv.problem_id]) {
          counts[conv.problem_id].conversations++;
        }
      });
    }

    // Get conjecture counts
    const { data: conjectureCounts, error: conjError } = await supabase
      .from('conjectures')
      .select('problem_id')
      .in('problem_id', problemIds);

    if (!conjError && conjectureCounts) {
      conjectureCounts.forEach(conj => {
        if (counts[conj.problem_id]) {
          counts[conj.problem_id].conjectures++;
        }
      });
    }

    // Get criticism counts
    const { data: criticismCounts, error: critError } = await supabase
      .from('criticisms')
      .select('problem_id')
      .in('problem_id', problemIds);

    if (!critError && criticismCounts) {
      criticismCounts.forEach(crit => {
        if (counts[crit.problem_id]) {
          counts[crit.problem_id].criticisms++;
        }
      });
    }

    // Get artifact counts
    const { data: artifactCounts, error: artError } = await supabase
      .from('artifacts')
      .select('problem_id')
      .in('problem_id', problemIds);

    if (!artError && artifactCounts) {
      artifactCounts.forEach(art => {
        if (counts[art.problem_id]) {
          counts[art.problem_id].artifacts++;
        }
      });
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Error in GET /api/problems/counts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
