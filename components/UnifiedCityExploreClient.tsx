"use client";

import dynamic from "next/dynamic";

function ExploreLoading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D8DDD8] bg-[#FAFBF7]">
      <span className="text-4xl animate-pulse">🧭</span>
      <span className="text-sm font-semibold text-[#5A6670]/70">正在载入城市探索中心...</span>
    </div>
  );
}

const UnifiedCityExploreDynamic = dynamic(
  () => import("@/components/UnifiedCityExplore"),
  {
    ssr: false,
    loading: ExploreLoading,
  }
);

export default function UnifiedCityExploreClient() {
  return <UnifiedCityExploreDynamic />;
}
