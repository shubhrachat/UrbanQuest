"use client";

interface StreetViewProps {
  lat: number;
  lng: number;
  apiKey?: string;
}

export default function StreetViewPanel({ lat, lng, apiKey }: StreetViewProps) {
  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!key || key === "your_google_maps_api_key") {
    return (
      <div className="mb-4 border-2 border-brass/30 bg-gunmetal-dark p-6 text-center">
        <p className="font-stencil text-lg text-brass tracking-widest mb-2">STREET RECON</p>
        <p className="font-mono text-sm text-parchment/60 mb-3">
          
        </p>
        <a
          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="game-btn inline-block px-6 py-2 font-stencil text-base"
        >
          Open Street View
        </a>
      </div>
    );
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${lat},${lng}&heading=210&pitch=10&fov=80`;

  return (
    <div className="mb-4 border-2 border-brass/30 overflow-hidden">
      <iframe
        title="Street reconnaissance"
        src={embedUrl}
        className="w-full h-52 border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="bg-gunmetal-dark px-3 py-2 flex justify-between items-center">
        <span className="font-mono text-sm text-amber-glow tracking-widest">
          STREET RECON — LIVE FEED
        </span>
        <a
          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-brass hover:text-amber-glow"
        >
          FULL SCREEN
        </a>
      </div>
    </div>
  );
}
