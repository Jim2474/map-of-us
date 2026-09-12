import { Suspense } from "react";
import { MemoryPageShell } from "@/components/MemoryNav";
import UnifiedCityExploreClient from "@/components/UnifiedCityExploreClient";

export const metadata = {
  title: "城市探索 · 我们的地图",
  description: "探索我们走过的每一座城市与足迹",
};

export default function CityExplorePage() {
  return (
    <MemoryPageShell active="city-explore">
      <Suspense
        fallback={
          <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D8DDD8] bg-[#FAFBF7]">
            <span className="text-4xl animate-pulse">🧭</span>
            <span className="text-sm font-semibold text-[#5A6670]/70">正在载入城市探索中心...</span>
          </div>
        }
      >
        <UnifiedCityExploreClient />
      </Suspense>
    </MemoryPageShell>
  );
}
