"use client";

import dynamic from "next/dynamic";
import type { City } from "@/data/cities";

// Loading placeholder shown while Leaflet is being loaded on the client
function MapLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#FAFBF7",
        color: "#9AAFBA",
        fontSize: "1rem",
        fontFamily: "system-ui, sans-serif",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 40 }}>🗺️</span>
      <span>正在加载地图…</span>
    </div>
  );
}

// Dynamically import CityDetailPage with ssr:false to avoid Leaflet SSR issues
// This MUST live in a "use client" component (not a Server Component)
const CityDetailPageDynamic = dynamic(
  () => import("@/components/CityDetailPage"),
  {
    ssr: false,
    loading: MapLoading,
  }
);

interface Props {
  city: City;
}

export default function CityDetailPageClient({ city }: Props) {
  return <CityDetailPageDynamic city={city} />;
}
