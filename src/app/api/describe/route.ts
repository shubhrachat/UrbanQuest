import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title, address } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Write exactly 2 vivid sentences describing an AI-generated civic documentation video of: "${title}" at ${address}. Sound like a professional field report. Be specific and visual. No preamble.`
          }]
        }]
      })
    });

    const data = await res.json();
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ description });
  } catch (e) {
    return NextResponse.json({
      description: `AI-generated footage documenting ${title} at ${address}, rendered by Google Veo 2.`
    });
  }
}
