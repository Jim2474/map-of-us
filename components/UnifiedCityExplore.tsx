"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Compass,
  MapPin,
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  LayoutGrid,
  Search,
  ChevronRight,
  Heart,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { cities, type City } from "@/data/cities";
import { getProvince } from "@/data/provinces";
import type { Spot } from "@/data/spots";
import type { Memory } from "@/data/memories";
import { adminModeUpdatedEvent, readAdminMode } from "@/data/adminMode";
import { useLocalMemories, setCachedMemories } from "@/data/memoryClient";
import SpotMemoryPanel from "@/components/SpotMemoryPanel";
import SpotCardGallery from "@/components/SpotCardGallery";

// Leaflet default icon fix
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const colors = {
  cream: "#FAFBF7",
  ink: "#5A6670",
  sakura: "#F5DCE0",
  bloom: "#E8B8C2",
  rose: "#C97B8A",
  dim: "#D8DDD8",
  deepRose: "#9A3D52",
};

// Smooth map flyTo controller
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Custom heart spot icon
function createSpotIcon(hasMemory: boolean, emoji: string, isSelected: boolean) {
  const size = isSelected ? 44 : 36;
  const bg = hasMemory
    ? isSelected
      ? colors.deepRose
      : colors.rose
    : isSelected
      ? "#7A8D96"
      : "#AAB8BF";
  const shadow = isSelected ? "0 4px 16px rgba(201,123,138,0.6)" : "0 2px 8px rgba(0,0,0,0.2)";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bg};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.8);
        transition: all 0.2s ease;
        cursor: pointer;
      ">
        <span style="transform: rotate(45deg); font-size: ${isSelected ? 18 : 15}px; line-height: 1;">
          ${emoji || "❤️"}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// New Spot Form
interface NewSpotFormProps {
  lat: number;
  lng: number;
  onSave: (name: string, description: string, emoji: string) => Promise<void>;
  onCancel: () => void;
}

function NewSpotForm({ lat, lng, onSave, onCancel }: NewSpotFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("❤️");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emojiOptions = ["❤️", "🎓", "🍜", "☕", "🎵", "📚", "🌸", "🏞️", "🎭", "⭐", "🌊", "🏰"];

  const handleSubmit = async () => {
    if (!name.trim()) { setError("请输入地点名称"); return; }
    setSaving(true);
    try {
      await onSave(name, description, emoji);
    } catch {
      setError("保存失败，请重试");
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      className="fixed inset-x-4 top-20 z-[1000] mx-auto max-w-sm rounded-[12px] border border-[#D8DDD8] bg-[#FAFBF7]/96 p-5 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#D8DDD8]/60">
        <h3 className="font-semibold text-[#5A6670] flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#C97B8A]" />
          添加新打卡点
        </h3>
        <button type="button" onClick={onCancel} className="text-[#5A6670]/60 hover:text-[#5A6670]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-3 text-sm">
        <div>
          <label className="block text-xs font-semibold text-[#5A6670]/70 mb-1">地点名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：第一次约会的奶茶店"
            className="w-full rounded-md border border-[#D8DDD8] bg-white px-3 py-1.5 text-[#5A6670] outline-none focus:border-[#C97B8A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A6670]/70 mb-1">一句话描述（选填）</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="我们最喜欢坐靠窗的那个位置"
            className="w-full rounded-md border border-[#D8DDD8] bg-white px-3 py-1.5 text-[#5A6670] outline-none focus:border-[#C97B8A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A6670]/70 mb-1">选择图标</label>
          <div className="flex flex-wrap gap-1.5">
            {emojiOptions.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                className={`h-8 w-8 rounded-md text-base transition flex items-center justify-center ${
                  emoji === em ? "bg-[#F5DCE0] ring-2 ring-[#C97B8A]" : "bg-white hover:bg-gray-50 border border-[#D8DDD8]"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-[#5A6670]/50 pt-1">
          坐标：{lat.toFixed(4)}, {lng.toFixed(4)}
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#D8DDD8] px-3 py-1.5 text-xs font-semibold text-[#5A6670]/70 hover:bg-gray-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-[#C97B8A] px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#B86B7A] disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存地点"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Map Click Listener
function MapClickHandler({
  onMapClick,
  onRightClick,
  activeAdding,
}: {
  onMapClick: (lat: number, lng: number) => void;
  onRightClick: (lat: number, lng: number) => void;
  activeAdding: boolean;
}) {
  useMapEvents({
    click(e) {
      if (activeAdding) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
    contextmenu(e) {
      onRightClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function UnifiedCityExplore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCityId = searchParams.get("city");
  const requestedMode = searchParams.get("mode");

  const { localMemories } = useLocalMemories();
  const [isAdmin, setIsAdmin] = useState(false);

  // Active state: null means "overview mode", otherwise a City object
  const [activeCityId, setActiveCityId] = useState<string | null>(() => {
    if (requestedMode === "overview") return null;
    if (requestedCityId) return requestedCityId;
    return "guilin"; // Default city
  });

  const [spots, setSpots] = useState<Spot[]>([]);
  const [memories, setMemories] = useState<Record<string, Memory[]>>({});
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showNewSpotForm, setShowNewSpotForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Read admin mode
  useEffect(() => {
    setIsAdmin(readAdminMode());
    const handler = (e: Event) => setIsAdmin(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(adminModeUpdatedEvent, handler);
    return () => window.removeEventListener(adminModeUpdatedEvent, handler);
  }, []);

  // Compute explored cities based on memories & default list
  const exploredCities = useMemo(() => {
    const memoryCityIds = Object.keys(localMemories).filter(
      (id) => (localMemories[id]?.length ?? 0) > 0
    );
    const set = new Set([...memoryCityIds, "guilin", "nanning", "city-450200", "city-450900"]);
    return cities
      .filter((c) => set.has(c.id))
      .map((c) => {
        const mems = localMemories[c.id] ?? [];
        return {
          city: c,
          memoryCount: mems.length,
          latestDate: mems[0]?.date ?? "",
          coverImage: mems[0]?.image || c.sprite,
          province: getProvince(c.provinceId),
        };
      })
      .sort((a, b) => b.memoryCount - a.memoryCount);
  }, [localMemories]);

  // Active City object
  const currentCity = useMemo(() => {
    if (!activeCityId) return null;
    return cities.find((c) => c.id === activeCityId) ?? cities.find((c) => c.id === "guilin") ?? cities[0];
  }, [activeCityId]);

  // Handle URL sync
  useEffect(() => {
    if (requestedCityId && requestedCityId !== activeCityId) {
      setActiveCityId(requestedCityId);
    } else if (requestedMode === "overview" && activeCityId !== null) {
      setActiveCityId(null);
    }
  }, [requestedCityId, requestedMode]);

  const selectCity = (cityId: string | null) => {
    setActiveCityId(cityId);
    setSelectedSpotId(null);
    setIsAddingSpot(false);
    setShowNewSpotForm(false);
    setNewSpotCoords(null);
    setIsSearching(false);
    setSearchQuery("");

    if (cityId) {
      router.replace(`/city-explore?city=${cityId}`, { scroll: false });
    } else {
      router.replace(`/city-explore?mode=overview`, { scroll: false });
    }
  };

  // Load spots & memories when activeCityId changes
  useEffect(() => {
    if (!currentCity) return;

    let isMounted = true;
    const loadCityData = async () => {
      setLoading(true);
      try {
        const spotsRes = await fetch(`/api/spots?cityId=${currentCity.id}`, { credentials: "include" });
        if (spotsRes.ok && isMounted) {
          const data = await spotsRes.json().catch(() => null);
          setSpots(data?.spots ?? []);
        }

        const cityMemories = localMemories[currentCity.id] ?? [];
        const grouped: Record<string, Memory[]> = {};
        for (const m of cityMemories) {
          if (m.spotId) {
            grouped[m.spotId] = [...(grouped[m.spotId] ?? []), m];
          }
        }
        if (isMounted) setMemories(grouped);
      } catch (e) {
        console.error("Failed to load city spots:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCityData();
    return () => {
      isMounted = false;
    };
  }, [currentCity, localMemories]);

  // Add Spot logic
  const handleMapClick = (lat: number, lng: number) => {
    setNewSpotCoords({ lat, lng });
    setShowNewSpotForm(true);
    setIsAddingSpot(false);
    setSelectedSpotId(null);
  };

  const handleCreateSpot = async (name: string, description: string, emoji: string) => {
    if (!newSpotCoords || !currentCity) return;
    const res = await fetch("/api/spots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId: currentCity.id,
        name,
        description,
        emoji,
        lat: newSpotCoords.lat,
        lng: newSpotCoords.lng,
      }),
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to create spot");

    const data = (await res.json()) as { spot: Spot; spots: Spot[] };
    setSpots(data.spots);
    setShowNewSpotForm(false);
    setNewSpotCoords(null);
    setSelectedSpotId(data.spot.id);
  };

  const handleDeleteSpot = async (spot: Spot) => {
    if (!currentCity) return;
    await fetch("/api/spots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId: currentCity.id, spotId: spot.id }),
      credentials: "include",
    });
    setSpots((prev) => prev.filter((s) => s.id !== spot.id));
    if (selectedSpotId === spot.id) setSelectedSpotId(null);
  };

  const handleSpotMemoriesChanged = (spotId: string, updatedMemories: Memory[]) => {
    setMemories((prev) => ({ ...prev, [spotId]: updatedMemories }));
  };

  // Filter cities for search dialog
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return cities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [searchQuery]);

  const selectedSpot = useMemo(
    () => spots.find((s) => s.id === selectedSpotId) ?? null,
    [spots, selectedSpotId]
  );

  return (
    <div className="relative flex flex-col h-full min-h-[calc(100vh-6rem)]">
      {/* ── 顶部城市快捷切换栏 ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 -mt-2 mb-4 rounded-xl border border-[#D8DDD8]/80 bg-[#FAFBF7]/90 px-3 py-2.5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick city switcher pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <button
              type="button"
              onClick={() => selectCity(null)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                activeCityId === null
                  ? "bg-[#C97B8A] text-white shadow-sm"
                  : "bg-white/80 text-[#5A6670] border border-[#D8DDD8]/70 hover:bg-[#F5DCE0]/40"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>全部城市概览</span>
            </button>

            {exploredCities.map(({ city, memoryCount }) => {
              const isSelected = activeCityId === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => selectCity(city.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    isSelected
                      ? "bg-[#C97B8A] text-white shadow-sm"
                      : "bg-white/80 text-[#5A6670] border border-[#D8DDD8]/70 hover:bg-[#F5DCE0]/40"
                  }`}
                >
                  <MapPin className={`h-3 w-3 ${isSelected ? "text-white" : "text-[#C97B8A]"}`} />
                  <span>{city.name}</span>
                  {memoryCount > 0 && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected ? "bg-white/25 text-white" : "bg-[#F5DCE0] text-[#9A3D52]"
                      }`}
                    >
                      {memoryCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Button */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setIsSearching((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full border border-[#D8DDD8] bg-white px-3 py-1.5 text-xs font-semibold text-[#5A6670]/80 shadow-sm transition hover:border-[#C97B8A] active:scale-95"
            >
              <Search className="h-3.5 w-3.5 text-[#C97B8A]" />
              <span className="hidden sm:inline">探索全国城市</span>
            </button>

            {/* Search Dropdown */}
            {isSearching && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-[#D8DDD8] bg-[#FAFBF7] p-3 shadow-xl">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#5A6670]/40" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入城市名，如：成都、三亚..."
                    className="w-full rounded-lg border border-[#D8DDD8] bg-white pl-8 pr-3 py-1.5 text-xs text-[#5A6670] outline-none focus:border-[#C97B8A]"
                  />
                </div>
                <div className="mt-2 max-h-52 overflow-y-auto space-y-1">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCity(c.id)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left text-[#5A6670] hover:bg-[#F5DCE0]/40 transition"
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-[10px] text-[#5A6670]/50">{c.nameEn}</span>
                    </button>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <p className="py-3 text-center text-xs text-[#5A6670]/50">未找到该城市</p>
                  )}
                  {!searchQuery && (
                    <p className="py-2 text-center text-[11px] text-[#5A6670]/50">
                      支持全国 391 座城市，随时打卡
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 视图模式切换 ────────────────────────────────────────────── */}
      {activeCityId === null || !currentCity ? (
        /* 全部城市总览卡片视图 */
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#D8DDD8]/80 bg-gradient-to-r from-[#FAFBF7] via-[#FDF3F5] to-[#FAFBF7] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#F5DCE0] text-[#C97B8A]">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#5A6670]">城市探索总览</h2>
                <p className="text-xs text-[#5A6670]/65 mt-0.5">
                  已探索 {exploredCities.length} 座城市 · 记录属于两个人的专属足迹与打卡地点
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {exploredCities.map(({ city, memoryCount, latestDate, coverImage, province }) => (
              <div
                key={city.id}
                className="group relative overflow-hidden rounded-xl border border-[#D8DDD8]/80 bg-[#FAFBF7]/85 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#E8B8C2] hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#D8DDD8] bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={city.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-lg font-bold text-[#5A6670]">{city.name}</h3>
                      <span className="text-xs font-semibold text-[#A8C8DC]">{province?.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#5A6670]/60">
                      {memoryCount > 0 ? `已留下 ${memoryCount} 条回忆` : "已解锁城市，待探索打卡"}
                    </p>
                    {latestDate && (
                      <p className="mt-0.5 text-[11px] text-[#5A6670]/40">最近记录：{latestDate}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#D8DDD8]/40 pt-3">
                  <Link
                    href={`/memories`}
                    className="flex items-center gap-1 text-xs font-medium text-[#5A6670]/60 hover:text-[#C97B8A]"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>回忆相册</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => selectCity(city.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#C97B8A] px-3.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-[#B86B7A] active:scale-95"
                  >
                    <span>进入地图探索</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 单城市深度探索模式：地图 + 标点 + 打卡操作台 */
        <div className="relative flex flex-col flex-1 overflow-hidden rounded-2xl border border-[#D8DDD8] shadow-sm">
          {/* 城市状态条与操作按钮 */}
          <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#D8DDD8]/80 bg-[#FAFBF7]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold text-[#5A6670]">{currentCity.name}</h2>
                <span className="text-xs text-[#5A6670]/50">{currentCity.nameEn}</span>
              </div>
              <span className="rounded-full bg-[#F5DCE0]/80 px-2.5 py-0.5 text-xs font-semibold text-[#C97B8A]">
                {spots.length} 个打卡点
              </span>
              {(localMemories[currentCity.id]?.length ?? 0) > 0 && (
                <span className="rounded-full bg-[#D6E8F0]/70 px-2.5 py-0.5 text-xs font-semibold text-[#5A6670]">
                  {localMemories[currentCity.id].length} 条回忆
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingSpot((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 ${
                  isAddingSpot
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-[#C97B8A] text-white hover:bg-[#B86B7A]"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isAddingSpot ? "点地图任意位置放置" : "＋ 添加地点"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGallery(true)}
                className="flex items-center gap-1.5 rounded-full border border-[#D8DDD8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5A6670] shadow-sm transition hover:bg-gray-50 active:scale-95"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-[#C97B8A]" />
                <span>照片画廊</span>
              </button>

              <Link
                href="/memories"
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#D8DDD8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5A6670] shadow-sm transition hover:bg-gray-50"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#A8C8DC]" />
                <span>相册</span>
              </Link>
            </div>
          </div>

          {/* Leaflet 地图容器 */}
          <div className="relative flex-1 min-h-[500px] w-full overflow-hidden">
            <MapContainer
              center={[currentCity.lat, currentCity.lng]}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full"
              style={{ minHeight: "520px" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController center={[currentCity.lat, currentCity.lng]} zoom={13} />

              <MapClickHandler
                onMapClick={handleMapClick}
                onRightClick={(lat, lng) => {
                  if (isAdmin) handleMapClick(lat, lng);
                }}
                activeAdding={isAddingSpot}
              />

              {/* 渲染所有打卡地点 Markers */}
              {spots.map((spot) => {
                const spotMemories = memories[spot.id] ?? [];
                const hasMemory = spotMemories.length > 0;
                const isSelected = selectedSpotId === spot.id;

                return (
                  <Marker
                    key={spot.id}
                    position={[spot.lat, spot.lng]}
                    icon={createSpotIcon(hasMemory, spot.emoji ?? "❤️", isSelected)}
                    eventHandlers={{
                      click: () => {
                        setSelectedSpotId(spot.id);
                      },
                    }}
                  />
                );
              })}
            </MapContainer>

            {/* 新增地点浮窗 */}
            <AnimatePresence>
              {showNewSpotForm && newSpotCoords && (
                <NewSpotForm
                  lat={newSpotCoords.lat}
                  lng={newSpotCoords.lng}
                  onSave={handleCreateSpot}
                  onCancel={() => {
                    setShowNewSpotForm(false);
                    setNewSpotCoords(null);
                  }}
                />
              )}
            </AnimatePresence>

            {/* 选中地点回忆浮窗卡片 */}
            <AnimatePresence>
              {selectedSpot && (
                <SpotMemoryPanel
                  key={selectedSpot.id}
                  spot={selectedSpot}
                  memories={memories[selectedSpot.id] ?? []}
                  isAdmin={isAdmin}
                  onClose={() => setSelectedSpotId(null)}
                  onMemoriesChanged={(updated) => handleSpotMemoriesChanged(selectedSpot.id, updated)}
                  onDeleteSpot={() => handleDeleteSpot(selectedSpot)}
                />
              )}
            </AnimatePresence>

            {/* 地图底部悬浮提示 */}
            {isAddingSpot && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-lg flex items-center gap-2 animate-bounce">
                <Sparkles className="h-4 w-4" />
                <span>轻点地图任意位置，放置新地点</span>
                <button
                  type="button"
                  onClick={() => setIsAddingSpot(false)}
                  className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px]"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 照片画廊全屏弹窗 */}
      {showGallery && currentCity && (
        <SpotCardGallery
          spots={spots}
          memories={memories}
          selectedSpotId={selectedSpotId}
          isAdmin={isAdmin}
          onSelectSpot={(id) => setSelectedSpotId(id)}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}
