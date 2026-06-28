import { NextRequest, NextResponse } from "next/server";

const CATEGORY_FALLBACK_VIDEOS: Record<string, string> = {
  pothole: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  water_leak: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  streetlight: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  waste: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  infrastructure: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  other: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
};

const CATEGORY_PROMPTS: Record<string, string> = {
  pothole: "A large pothole on an urban road with water pooling inside, realistic daytime scene",
  water_leak: "Water gushing from a broken pipe flooding a city sidewalk, realistic",
  streetlight: "Dark urban street at night with broken streetlights, safety hazard",
  waste: "Overflowing garbage bins on a city street with litter scattered around",
  infrastructure: "Damaged public infrastructure, broken railing or traffic signal on city road",
  other: "Community infrastructure damage on a city street, realistic urban scene",
};

async function getAccessToken(): Promise<string | null> {
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token || null;
  } catch (e) {
    console.error("Auth error:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { category } = await req.json();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const fallback = CATEGORY_FALLBACK_VIDEOS[category] || CATEGORY_FALLBACK_VIDEOS.other;

  if (!projectId) {
    return NextResponse.json({ fallback });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ fallback });
  }

  try {
    const prompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.other;
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/veo-2.0-generate-001:predictLongRunning`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          aspectRatio: "16:9",
          durationSeconds: 5,
          sampleCount: 1,
        },
      }),
    });

    if (!res.ok) {
      console.error("Veo error:", await res.text());
      return NextResponse.json({ fallback });
    }

    const operation = await res.json();
    const opName = operation.name;
    if (!opName) return NextResponse.json({ fallback });

    // Poll for up to 90 seconds
    const pollUrl = `https://us-central1-aiplatform.googleapis.com/v1/${opName}`;
    for (let i = 0; i < 18; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(pollUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const pollData = await poll.json();
      if (pollData.done) {
        const videoUri = pollData.response?.predictions?.[0]?.bytesBase64Encoded
          ? `data:video/mp4;base64,${pollData.response.predictions[0].bytesBase64Encoded}`
          : pollData.response?.predictions?.[0]?.gcsUri || null;
        if (videoUri) return NextResponse.json({ videoUrl: videoUri });
        break;
      }
    }
    return NextResponse.json({ fallback });
  } catch (e) {
    console.error("Veo route error:", e);
    return NextResponse.json({ fallback });
  }
}
