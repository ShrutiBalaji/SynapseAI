import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { join } from "path";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Synapse",
  },
});

export async function POST(req: NextRequest) {
  try {
    console.log("Chat handler called");
    const { message, problemId, conversationId, autoLink = true, attachedFiles } = await req.json();
    
    console.log("Request data:", { message, problemId, conversationId, attachedFiles });
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";
    const isGuest = false;
    const user = { id: userId, email: "user@example.com" };
    
    console.log("Using default user:", userId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let currentConversationId = conversationId;
    let problemLinked = false;
    let linkedProblemTitle = null;

    // Step 1: Create or get conversation
    if (!currentConversationId) {
      // Create new conversation
      const conversationTitle = message.length > 50 ? message.substring(0, 50) + '...' : message;
      
      const { data: newConversation, error: conversationError } = await supabase
        .from('chat_conversations')
        .insert({
          problem_id: problemId || null,
          title: conversationTitle,
          created_by: userId
        })
        .select()
        .single();

      if (conversationError) {
        console.error("Error creating conversation:", conversationError);
        return NextResponse.json({ error: "Failed to create conversation", details: conversationError.message }, { status: 500 });
      }

      currentConversationId = newConversation.id;
      console.log("Created new conversation:", currentConversationId);
    }

    // Step 2: Process attached files and enhance message
    let enhancedMessage = message;
    if (attachedFiles && attachedFiles.length > 0) {
      console.log("Processing attached files for AI:", attachedFiles);
      for (const file of attachedFiles) {
        try {
          // Read file content from the uploaded file
          const filePath = join(process.cwd(), "public", file.url);
          console.log(`Reading file: ${file.name} from path: ${filePath}`);
          
          // Check if file exists
          const fs = require('fs');
          const fileExists = fs.existsSync(filePath);
          console.log(`File exists: ${fileExists}`);
          
          if (!fileExists) {
            console.error(`File does not exist at path: ${filePath}`);
            enhancedMessage += `\n\n[Note: File ${file.name} was not found at the expected location. Please try uploading again.]`;
            continue;
          }
          
          // Check file type and handle accordingly
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          let fileContent = '';
          
          if (fileExtension === 'pdf') {
            // For PDF files, we can't read them as text directly
            // For now, we'll indicate that the file was attached but can't be read
            fileContent = `[PDF file attached: ${file.name} - Content cannot be extracted automatically. Please describe the content or paste relevant text.]`;
            console.log(`PDF file detected: ${file.name}`);
          } else if (['txt', 'md', 'json', 'csv', 'log', 'js', 'ts', 'html', 'css', 'xml', 'yaml', 'yml'].includes(fileExtension || '')) {
            // Read text files as UTF-8
            fileContent = await fs.promises.readFile(filePath, 'utf-8');
            console.log(`File content length: ${fileContent.length} characters`);
          } else {
            // For other file types, indicate they were attached but can't be read
            fileContent = `[File attached: ${file.name} (${file.mime_type}) - Content cannot be extracted automatically. Please describe the content or paste relevant text.]`;
          }
          
          // Add file content to the message
          enhancedMessage += `\n\n--- Attached File: ${file.name} ---\n${fileContent}\n--- End of File ---`;
          console.log(`Added content from file: ${file.name}`);
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          enhancedMessage += `\n\n[Note: Could not read attached file: ${file.name} - ${error instanceof Error ? error.message : 'Unknown error'}]`;
        }
      }
    }

    // Step 3: Save user message (with enhanced content if files were attached)
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: enhancedMessage,
        message_type: 'chat'
      });

    if (userMessageError) {
      console.error("Error saving user message:", userMessageError);
      return NextResponse.json({ error: "Failed to save user message", details: userMessageError.message }, { status: 500 });
    }

    // Step 4: Get conversation history for context
    const { data: conversationHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error("Error fetching conversation history:", historyError);
    }

    // Step 5: Check if we should create a problem or link to existing one
    if (!problemId && autoLink) {
      // Check if this conversation should be linked to an existing problem
      const { data: existingProblems, error: problemsError } = await supabase
        .from('problems')
        .select('id, title, description')
        .eq('created_by', userId);

      if (!problemsError && existingProblems && existingProblems.length > 0) {
        // Simple keyword matching to find related problems
        const messageWords = message.toLowerCase().split(' ');
        for (const problem of existingProblems) {
          const problemWords = (problem.title + ' ' + (problem.description || '')).toLowerCase().split(' ');
          const commonWords = messageWords.filter((word: string) => problemWords.includes(word) && word.length > 3);
          
          if (commonWords.length >= 2) {
            // Link conversation to existing problem
            await supabase
              .from('chat_conversations')
              .update({ problem_id: problem.id })
              .eq('id', currentConversationId);
            
            problemLinked = true;
            linkedProblemTitle = problem.title;
            console.log("Linked conversation to existing problem:", problem.title);
            break;
          }
        }
      }
    }

    // Step 6: Generate AI response
    const systemPrompt = `You are Synapse, an AI assistant that helps users solve problems and think through complex issues. 
    
    ${problemId ? `The user is currently working on a problem. ` : ''}
    
    Be helpful, concise, and encourage critical thinking. If the user seems to be describing a new problem, 
    you can help them think through it systematically.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    console.log("Sending to AI with messages:", messages.length);

    const completion = await openai.chat.completions.create({
      model: "x-ai/grok-4-fast:free",
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Step 7: Save AI response
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'ai',
        content: aiResponse,
        message_type: 'chat'
      });

    if (aiMessageError) {
      console.error("Error saving AI message:", aiMessageError);
      return NextResponse.json({ error: "Failed to save AI response", details: aiMessageError.message }, { status: 500 });
    }

    // Step 7: Check if we should create a new problem
    let newProblemId = null;
    if (!problemId && !problemLinked && autoLink) {
      // Create a problem for ALL new conversations (more aggressive approach)
      const problemKeywords = [
        'problem', 'issue', 'bug', 'error', 'fix', 'solve', 'help', 'trouble',
        'difficulty', 'challenge', 'question', 'how ', 'why', 'what ',
        'broken', 'not working', 'failed', 'stuck', 'confused', 'need help',
        'chat', 'discuss', 'talk', 'conversation', 'ask', 'tell', 'explain'
      ];
      
      const messageLower = message.toLowerCase();
      const hasProblemKeywords = problemKeywords.some(keyword => messageLower.includes(keyword));
      const isLongMessage = message.length > 20; // Even lower threshold
      const hasQuestionMark = message.includes('?');
      const isFirstMessage = conversationHistory && conversationHistory.length === 0;
      
      // Create problem for almost all conversations (very aggressive)
      const shouldCreateProblem = hasProblemKeywords || isLongMessage || hasQuestionMark || isFirstMessage || true;

      if (shouldCreateProblem) {
        // Create a better problem title
        let problemTitle = message;
        if (message.length > 80) {
          problemTitle = message.substring(0, 80) + '...';
        }
        
        // Extract key words for better title
        const words = message.split(' ').filter((word: string) => word.length > 3);
        if (words.length > 0) {
          problemTitle = words.slice(0, 6).join(' ');
          if (words.length > 6) problemTitle += '...';
        }
        
        const { data: newProblem, error: problemError } = await supabase
          .from('problems')
          .insert({
            title: problemTitle,
            description: message,
            status: 'open',
            priority: 'medium',
            created_by: userId
          })
          .select()
          .single();

        if (!problemError && newProblem) {
          // Link conversation to the new problem
          await supabase
            .from('chat_conversations')
            .update({ problem_id: newProblem.id })
            .eq('id', currentConversationId);

          newProblemId = newProblem.id;
          console.log("Created new problem:", newProblem.id, "Title:", problemTitle);
        } else {
          console.error("Error creating problem:", problemError);
        }
      }
    }

    // Save attached files as artifacts if we have a problem
    const finalProblemId = problemId || newProblemId;
    if (attachedFiles && attachedFiles.length > 0 && finalProblemId) {
      console.log("Saving attached files as artifacts for problem:", finalProblemId);
      for (const file of attachedFiles) {
        const { error: artifactError } = await supabase
          .from('artifacts')
          .insert({
            problem_id: finalProblemId,
            name: file.name,
            url: file.url,
            mime_type: file.mime_type,
            created_by: userId
          });

        if (artifactError) {
          console.error("Error saving artifact:", artifactError);
        } else {
          console.log("Saved artifact:", file.name);
        }
      }
    }

    console.log("Chat handler completed successfully");

    return NextResponse.json({
      success: true,
      conversationId: currentConversationId,
      problemId: problemId || newProblemId,
      problemLinked,
      linkedProblemTitle,
      aiResponse
    });

  } catch (error) {
    console.error("Error in chat handler:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}