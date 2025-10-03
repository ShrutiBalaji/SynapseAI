import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory = [], problemId } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system" as const,
        content: "You are Synapse, an AI assistant for collaborative problem solving. Help users explore problems, generate conjectures, and provide insights. Be concise but helpful."
      },
      ...chatHistory.map((chat: any) => ({
        role: chat.role as "user" | "assistant",
        content: chat.content
      })),
      {
        role: "user" as const,
        content: message
      }
    ];

    // Get response from OpenRouter
    const completion = await openai.chat.completions.create({
      model: "x-ai/grok-4-fast:free",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({
      response,
      usage: completion.usage
    });

  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}