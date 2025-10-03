import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory = [], existingProblems = [] } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Prepare context for classification
    const problemTitles = existingProblems.map((p: any) => p.title).join(", ");
    const recentChats = chatHistory.slice(-5).map((chat: any) => `${chat.role}: ${chat.content}`).join("\n");

    const classificationPrompt = `
Classify this user message into one of these categories:

1. "new_problem" - User is describing a new problem/issue
2. "chat" - Regular conversation about existing problem
3. "conjecture" - User is asking for or suggesting a solution
4. "criticism" - User is providing evidence, refutation, or criticism
5. "artifact" - User is sharing files, code, or documentation

Context:
- Existing problems: ${problemTitles}
- Recent chat: ${recentChats}
- User message: "${message}"

Respond with ONLY the category name (new_problem, chat, conjecture, criticism, or artifact).
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a message classifier. Respond with only the category name."
        },
        {
          role: "user",
          content: classificationPrompt
        }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });

    const messageType = completion.choices[0]?.message?.content?.trim().toLowerCase() || "chat";

    // Additional processing based on classification
    let additionalData = {};
    
    if (messageType === "new_problem") {
      // Generate problem title
      const titleCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Generate a short, clear title for this problem in under 6 words. Return only the title."
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
      });
      
      const title = titleCompletion.choices[0]?.message?.content?.trim() || "New Problem";
      additionalData = { suggestedTitle: title };
    }

    return NextResponse.json({
      messageType,
      ...additionalData
    });

  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Failed to classify message" },
      { status: 500 }
    );
  }
}
