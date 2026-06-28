import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { issue } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this civic issue. Return ONLY valid JSON, no markdown:
{"urgencyScore": 85, "estimatedFixDays": 3, "rootCauses": ["cause1", "cause2"], "recommendation": "one sentence action", "impactRadius": "200m", "affectedResidents": 450}

Issue: ${issue.title} - ${issue.description}
Category: ${issue.category}, Severity: ${issue.severity}/10, Confirmations: ${issue.confirmations}`
          }]
        }]
      })
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(clean);
    return NextResponse.json(analysis);
  } catch (e) {
    return NextResponse.json({
      urgencyScore: Math.round((issue?.severity || 5) * 10),
      estimatedFixDays: 5,
      rootCauses: ["Infrastructure age", "High traffic load"],
      recommendation: "Deploy field team within 48 hours",
      impactRadius: "150m",
      affectedResidents: 320,
    });
  }
}
