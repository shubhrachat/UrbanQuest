import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { newIssue, existingIssues } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const nearby = (existingIssues || []).filter(
      (i: { lat: number; lng: number }) => {
        const dlat = Math.abs(i.lat - newIssue.lat);
        const dlng = Math.abs(i.lng - newIssue.lng);
        return dlat < 0.005 && dlng < 0.005;
      }
    );

    if (nearby.length === 0) {
      return NextResponse.json({ cluster: null, nearbyCount: 0 });
    }

    if (!apiKey || apiKey === "your_gemini_api_key") {
      return NextResponse.json({
        cluster: {
          message: `${nearby.length + 1} reports within 500m — likely the same underlying issue.`,
          mergeSuggested: nearby.length >= 2,
          relatedIds: nearby.map((i: { id: string }) => i.id),
        },
        nearbyCount: nearby.length,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze if these nearby civic reports describe the same underlying infrastructure problem.

New report: ${JSON.stringify({ title: newIssue.title, category: newIssue.category, description: newIssue.description })}
Nearby reports: ${JSON.stringify(nearby.map((i: { title: string; category: string }) => ({ title: i.title, category: i.category })))}

Respond ONLY with JSON:
{"mergeSuggested": boolean, "message": "brief explanation for citizens", "rootCause": "likely shared cause"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        cluster: { ...parsed, relatedIds: nearby.map((i: { id: string }) => i.id) },
        nearbyCount: nearby.length,
      });
    }

    return NextResponse.json({
      cluster: {
        message: `${nearby.length} similar reports nearby.`,
        mergeSuggested: nearby.length >= 2,
        relatedIds: nearby.map((i: { id: string }) => i.id),
      },
      nearbyCount: nearby.length,
    });
  } catch {
    return NextResponse.json({ cluster: null, nearbyCount: 0 });
  }
}
