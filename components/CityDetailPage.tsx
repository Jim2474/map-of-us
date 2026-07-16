"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, MapPin, Plus, X, Check, Pencil, Trash2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { City } from "@/data/cities";
import type { Spot } from "@/data/spots";
import type { Memory } from "@/data/memories";
import { adminModeUpdatedEvent, readAdminMode } from "@/data/adminMode";
import SpotMemoryPanel from "@/components/SpotMemoryPanel";

// Fix Leaflet default icon issue in Next.js
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

// 创建自定义心形 Marker 图标
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

// 新建 Spot 表单组件
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
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(380px, calc(100vw - 32px))",
        background: colors.cream,
        borderRadius: 20,
        boxShadow: "0 12px 50px rgba(0,0,0,0.2)",
        zIndex: 2000,
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.sakura} 0%, ${colors.bloom} 100%)`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, color: "#5A3340", fontSize: "0.95rem" }}>
          📍 在这里新建地点
        </div>
        <button
          onClick={onCancel}
          style={{
            background: "rgba(255,255,255,0.4)", border: "none", borderRadius: "50%",
            width: 28, height: 28, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "#5A3340",
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Coordinates hint */}
        <div style={{ fontSize: "0.72rem", color: colors.dim, marginBottom: 14 }}>
          坐标：{lat.toFixed(4)}°N, {lng.toFixed(4)}°E
        </div>

        {/* Emoji picker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.75rem", color: colors.ink, marginBottom: 8, fontWeight: 600 }}>
            选一个图标
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {emojiOptions.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: emoji === e ? `2px solid ${colors.rose}` : `1px solid ${colors.dim}`,
                  background: emoji === e ? colors.sakura : "#fff",
                  cursor: "pointer", fontSize: 18, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.75rem", color: colors.ink, marginBottom: 5, fontWeight: 600 }}>
            地点名称 *
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="例如：我们常去的咖啡馆"
            maxLength={20}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 9,
              border: `1px solid ${colors.dim}`, fontSize: "0.88rem",
              fontFamily: "system-ui, sans-serif", outline: "none", boxSizing: "border-box",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.75rem", color: colors.ink, marginBottom: 5, fontWeight: 600 }}>
            简述（可选）
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 50))}
            placeholder="例如：初次见面的地方"
            maxLength={50}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 9,
              border: `1px solid ${colors.dim}`, fontSize: "0.88rem",
              fontFamily: "system-ui, sans-serif", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{ color: "#D0706A", fontSize: "0.78rem", marginBottom: 10 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0", background: "#f0f0f0",
              border: "none", borderRadius: 10, color: colors.ink,
              fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 2, padding: "10px 0",
              background: saving
                ? colors.dim
                : `linear-gradient(135deg, ${colors.bloom} 0%, ${colors.rose} 100%)`,
              border: "none", borderRadius: 10, color: "#fff",
              fontWeight: 700, fontSize: "0.85rem",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Check size={14} /> {saving ? "保存中…" : "打下这个地标"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// 监听地图右键点击（管理员模式下新建地点）
interface MapClickHandlerProps {
  isAdmin: boolean;
  onRightClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ isAdmin, onRightClick }: MapClickHandlerProps) {
  useMapEvents({
    contextmenu(e) {
      if (isAdmin) {
        onRightClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface CityDetailPageProps {
  city: City;
}

export default function CityDetailPage({ city }: CityDetailPageProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [memories, setMemories] = useState<Record<string, Memory[]>>({});
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [showNewSpotForm, setShowNewSpotForm] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;
  const selectedSpotMemories = selectedSpotId ? (memories[selectedSpotId] ?? []) : [];

  // Load admin mode
  useEffect(() => {
    setIsAdmin(readAdminMode());
    const handler = () => setIsAdmin(readAdminMode());
    window.addEventListener(adminModeUpdatedEvent, handler);
    return () => window.removeEventListener(adminModeUpdatedEvent, handler);
  }, []);

  // Load spots and memories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load spots
        const spotsRes = await fetch(`/api/spots?cityId=${city.id}`, { credentials: "include" });
        const spotsData = (await spotsRes.json()) as { spots: Spot[] };
        setSpots(spotsData.spots);

        // Load memories
        const memoriesRes = await fetch("/api/memories", { credentials: "include" });
        const memoriesData = (await memoriesRes.json()) as { memories: Record<string, Memory[]> };
        const cityMemories = memoriesData.memories[city.id] ?? [];

        // Group memories by spotId
        const grouped: Record<string, Memory[]> = {};
        for (const memory of cityMemories) {
          if (memory.spotId) {
            grouped[memory.spotId] = [...(grouped[memory.spotId] ?? []), memory];
          }
        }
        setMemories(grouped);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [city.id]);

  const handleRightClick = useCallback((lat: number, lng: number) => {
    if (!isAdmin) return;
    setNewSpotCoords({ lat, lng });
    setShowNewSpotForm(true);
    setSelectedSpotId(null);
  }, [isAdmin]);

  const handleCreateSpot = async (name: string, description: string, emoji: string) => {
    if (!newSpotCoords) return;
    const res = await fetch("/api/spots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId: city.id,
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
    await fetch("/api/spots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId: city.id, spotId: spot.id }),
      credentials: "include",
    });
    setSpots((prev) => prev.filter((s) => s.id !== spot.id));
    if (selectedSpotId === spot.id) setSelectedSpotId(null);
  };

  const handleSpotMemoriesChanged = (spotId: string, updatedMemories: Memory[]) => {
    setMemories((prev) => ({ ...prev, [spotId]: updatedMemories }));
  };

  // Total memory count for this city
  const totalMemories = Object.values(memories).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: colors.cream }}>
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "linear-gradient(to bottom, rgba(250,251,247,0.97) 0%, rgba(250,251,247,0) 100%)",
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            pointerEvents: "all",
            background: colors.cream,
            border: `1px solid ${colors.dim}`,
            borderRadius: "50%",
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            color: colors.ink,
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>

        <div
          style={{
            pointerEvents: "none",
            background: colors.cream,
            borderRadius: 14,
            padding: "8px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.dim}`,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: colors.ink }}>
            {city.name}
            <span style={{ fontSize: "0.72rem", color: colors.dim, marginLeft: 8, fontWeight: 400 }}>
              {city.nameEn}
            </span>
          </div>
          <div style={{ fontSize: "0.72rem", color: colors.rose, marginTop: 2 }}>
            {spots.length} 个地点 · {totalMemories} 段回忆
          </div>
        </div>

        {isAdmin && (
          <div
            style={{
              pointerEvents: "none",
              background: colors.sakura,
              borderRadius: 10,
              padding: "6px 12px",
              fontSize: "0.72rem",
              color: colors.rose,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            管理员 · 右键添加地点
          </div>
        )}
      </div>

      {/* Leaflet Map */}
      <div style={{ flex: 1, position: "relative" }}>
        {loading ? (
          <div
            style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: colors.cream, zIndex: 10,
            }}
          >
            <div style={{ textAlign: "center", color: colors.dim }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
              <div style={{ fontSize: "0.85rem" }}>正在加载地图…</div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[city.lat, city.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler isAdmin={isAdmin} onRightClick={handleRightClick} />

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
                      setSelectedSpotId(isSelected ? null : spot.id);
                      setShowNewSpotForm(false);
                    },
                  }}
                />
              );
            })}
          </MapContainer>
        )}

        {/* Spot memory panel */}
        <AnimatePresence>
          {selectedSpot && (
            <SpotMemoryPanel
              key={selectedSpot.id}
              spot={selectedSpot}
              memories={selectedSpotMemories}
              isAdmin={isAdmin}
              onClose={() => setSelectedSpotId(null)}
              onMemoriesChanged={(updated) => handleSpotMemoriesChanged(selectedSpot.id, updated)}
            />
          )}
        </AnimatePresence>

        {/* Admin: right-click backdrop + form */}
        <AnimatePresence>
          {showNewSpotForm && newSpotCoords && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowNewSpotForm(false); setNewSpotCoords(null); }}
                style={{
                  position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
                  zIndex: 1999, backdropFilter: "blur(2px)",
                }}
              />
              <NewSpotForm
                lat={newSpotCoords.lat}
                lng={newSpotCoords.lng}
                onSave={handleCreateSpot}
                onCancel={() => { setShowNewSpotForm(false); setNewSpotCoords(null); }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Spots legend / sidebar */}
        {!selectedSpot && !showNewSpotForm && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              position: "absolute",
              right: 16,
              top: 80,
              width: 200,
              background: "rgba(250,251,247,0.95)",
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              zIndex: 999,
              overflow: "hidden",
              border: `1px solid ${colors.dim}`,
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: `linear-gradient(135deg, ${colors.sakura} 0%, ${colors.bloom} 100%)`,
                fontWeight: 700,
                fontSize: "0.8rem",
                color: "#5A3340",
              }}
            >
              🗺️ 我们的地标
            </div>
            {spots.length === 0 ? (
              <div style={{ padding: "16px 14px", fontSize: "0.78rem", color: colors.dim }}>
                {isAdmin ? "右键地图添加第一个地点" : "暂无地标"}
              </div>
            ) : (
              spots.map((spot) => {
                const count = (memories[spot.id] ?? []).length;
                return (
                  <button
                    key={spot.id}
                    onClick={() => { setSelectedSpotId(spot.id); setShowNewSpotForm(false); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 14px",
                      border: "none",
                      borderBottom: `1px solid ${colors.dim}44`,
                      background: selectedSpotId === spot.id ? colors.sakura : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{spot.emoji ?? "❤️"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: colors.ink,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {spot.name}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: colors.dim }}>
                        {count > 0 ? `${count} 段回忆` : "暂无回忆"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </div>

      {/* Custom Leaflet CSS overrides */}
      <style>{`
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .leaflet-control-zoom {
          border-radius: 10px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          color: ${colors.rose} !important;
        }
        /* Subtle pink tint on map tiles */
        .leaflet-tile-container {
          filter: saturate(0.85) hue-rotate(10deg) brightness(1.02);
        }
      `}</style>
    </div>
  );
}
