import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // Create a summary of the conversation
    const conversationText = messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a concise, descriptive title (max 6 words) for this conversation that captures the main problem or topic being discussed. Return only the title, no quotes or extra text."
        },
        {
          role: "user",
          content: `Conversation:\n${conversationText}`
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const title = completion.choices[0]?.message?.content?.trim() || "Untitled Problem";

    return NextResponse.json({ title });

  } catch (error) {
    console.error("OpenAI summarization error:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}
