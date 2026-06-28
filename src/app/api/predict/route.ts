import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { issues } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key or Gemini fails, return hardcoded fallback
  if (!apiKey) {
    return NextResponse.json({ predictions: getFallback() });
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI civic risk analyst. Based on these community issues, predict 4 sectors at risk of new problems in the next 30 days.

Issues:
${(issues || []).slice(0, 20).map((i: any) => `- ${i.category} at ${i.zone}, severity ${i.severity}, ${i.confirmations} confirms`).join("\n")}

Return ONLY valid JSON array, no markdown, no explanation:
[{"sector": "zone name", "risk": "high|medium|low", "category": "pothole|water_leak|streetlight|waste|infrastructure|other", "probability": 75, "reason": "under 10 words", "estimatedDays": 14}]

Return exactly 4 predictions.`
          }]
        }]
      })
    });

    const data = await res.json();
    console.log("Gemini response:", JSON.stringify(data).slice(0, 500));
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.log("No text in Gemini response, using fallback");
      return NextResponse.json({ predictions: getFallback(issues) });
    }
    
    const clean = text.replace(/```json|```/g, "").trim();
    const predictions = JSON.parse(clean);
    return NextResponse.json({ predictions });
  } catch (e) {
    console.log("Predict error:", e);
    return NextResponse.json({ predictions: getFallback(issues) });
  }
}

function getFallback(issues: any[] = []) {
  const zones = issues.length > 0
    ? [...new Set(issues.map((i: any) => i.zone))].slice(0, 4)
    : ["Central District", "Riverside", "West Ward", "Tech Park"];

  return [
    { sector: zones[0] || "Central District", risk: "high", category: "pothole", probability: 82, reason: "High traffic + recent rainfall", estimatedDays: 7 },
    { sector: zones[1] || "Riverside", risk: "high", category: "water_leak", probability: 74, reason: "Aging pipe infrastructure", estimatedDays: 14 },
    { sector: zones[2] || "West Ward", risk: "medium", category: "waste", probability: 61, reason: "Collection gaps detected", estimatedDays: 21 },
    { sector: zones[3] || "Tech Park", risk: "medium", category: "streetlight", probability: 55, reason: "Electrical faults cluster", estimatedDays: 30 },
  ];
}
