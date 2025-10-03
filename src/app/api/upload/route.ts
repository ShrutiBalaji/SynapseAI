import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const problemId = formData.get("problem_id") as string;

    if (!file || !problemId) {
      return NextResponse.json({ error: "File and problem ID are required" }, { status: 400 });
    }

    // Use a default user ID since authentication is removed
    const userId = "00000000-0000-0000-0000-000000000000";
    const isGuest = false;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    await writeFile(filePath, buffer);

    // Save artifact to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Only save artifact if we have a valid problemId (not 0)
    let artifact = null;
    if (parseInt(problemId) > 0) {
      const { data: artifactData, error } = await supabase
        .from('artifacts')
        .insert({
          problem_id: parseInt(problemId),
          name: file.name,
          url: `/uploads/${fileName}`,
          mime_type: file.type,
          created_by: userId
        })
        .select()
        .single();
      
      artifact = artifactData;
      if (error) {
        console.error("Error saving artifact:", error);
      }
    } else {
      console.log("Skipping artifact save - no valid problemId provided");
    }

    // Note: We don't fail the upload if artifact saving fails, since the file is still uploaded

    return NextResponse.json({ 
      success: true, 
      artifact,
      url: `/uploads/${fileName}`,
      message: "File uploaded successfully" 
    });

  } catch (error) {
    console.error("Error in upload handler:", error);
    return NextResponse.json({ error: "Internal server error", details: (error as Error).message }, { status: 500 });
  }
}