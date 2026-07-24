"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, X, MapPin, Heart, Image as ImageIcon, ChevronUp, ChevronDown } from "lucide-react";
import type { Spot } from "@/data/spots";
import type { Memory } from "@/data/memories";

interface SpotCardGalleryProps {
  spots: Spot[];
  memories: Record<string, Memory[]>;
  selectedSpotId: string | null;
  onSelectSpot: (spotId: string) => void;
  onClose: () => void;
}

const colors = {
  cream: "#FAFBF7",
  ink: "#5A6670",
  sakura: "#F5DCE0",
  bloom: "#E8B8C2",
  rose: "#C97B8A",
  deepRose: "#9A3D52",
  dim: "#D8DDD8",
  mist: "#D6E8F0",
};

// 单张地标卡片
function SpotCard({
  spot,
  memoryList,
  isActive,
  onClick,
}: {
  spot: Spot;
  memoryList: Memory[];
  isActive: boolean;
  onClick: () => void;
}) {
  const hasMemory = memoryList.length > 0;
  const coverPhoto = memoryList[0]?.image ?? null;
  const totalPhotos = memoryList.reduce((n, m) => n + (m.photos?.length ?? 1), 0);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      animate={{
        scale: isActive ? 1.05 : 1,
        y: isActive ? -6 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        flexShrink: 0,
        width: 180,
        borderRadius: 18,
        overflow: "hidden",
        background: isActive
          ? `linear-gradient(160deg, ${colors.sakura} 0%, ${colors.bloom} 100%)`
          : colors.cream,
        border: isActive ? `2px solid ${colors.rose}` : `1.5px solid ${colors.dim}`,
        boxShadow: isActive
          ? `0 8px 32px rgba(201,123,138,0.35), 0 2px 8px rgba(0,0,0,0.08)`
          : "0 2px 12px rgba(0,0,0,0.08)",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        outline: "none",
      }}
    >
      {/* 照片区 */}
      <div
        style={{
          width: "100%",
          height: 110,
          background: hasMemory
            ? "transparent"
            : `linear-gradient(135deg, ${colors.mist} 0%, ${colors.dim} 100%)`,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={spot.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 36 }}>{spot.emoji ?? "📍"}</span>
            <span style={{ fontSize: "0.65rem", color: colors.ink, opacity: 0.5 }}>
              暂无照片
            </span>
          </div>
        )}

        {/* 记忆数徽章 */}
        {hasMemory && (
          <div
            style={{
              position: "absolute",
              bottom: 7,
              right: 8,
              background: "rgba(0,0,0,0.52)",
              backdropFilter: "blur(6px)",
              borderRadius: 8,
              padding: "2px 7px",
              display: "flex",
              alignItems: "center",
              gap: 3,
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 600,
            }}
          >
            <ImageIcon size={10} />
            {totalPhotos}
          </div>
        )}

        {/* 活跃光晕 */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, transparent 40%, rgba(232,184,194,0.4) 100%)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* 信息区 */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 16 }}>{spot.emoji ?? "📍"}</span>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.82rem",
              color: isActive ? colors.deepRose : colors.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {spot.name}
          </div>
        </div>

        {spot.description && (
          <div
            style={{
              fontSize: "0.68rem",
              color: isActive ? colors.rose : colors.dim,
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              marginBottom: 6,
            }}
          >
            {spot.description}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 2,
          }}
        >
          {hasMemory ? (
            <>
              <Heart
                size={11}
                fill={isActive ? colors.rose : colors.bloom}
                color={isActive ? colors.rose : colors.bloom}
              />
              <span
                style={{
                  fontSize: "0.68rem",
                  color: isActive ? colors.rose : colors.dim,
                  fontWeight: 600,
                }}
              >
                {memoryList.length} 段回忆
              </span>
            </>
          ) : (
            <>
              <MapPin size={11} color={colors.dim} />
              <span style={{ fontSize: "0.68rem", color: colors.dim }}>
                还没有记录
              </span>
            </>
          )}
        </div>
      </div>

      {/* 激活指示条 */}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${colors.bloom}, ${colors.rose})`,
            borderRadius: "0 0 18px 18px",
          }}
        />
      )}
    </motion.button>
  );
}

export default function SpotCardGallery({
  spots,
  memories,
  selectedSpotId,
  onSelectSpot,
  onClose,
}: SpotCardGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeIdx = spots.findIndex((s) => s.id === selectedSpotId);
  const spotsWithMemory = spots.filter((s) => (memories[s.id] ?? []).length > 0);
  const totalMemories = Object.values(memories).reduce((n, arr) => n + arr.length, 0);

  // 更新左右滚动状态
  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [spots]);

  // 选中地点时自动滚动到对应卡片
  useEffect(() => {
    if (activeIdx < 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 180 + 12; // card width + gap
    const targetScroll = activeIdx * cardWidth - el.clientWidth / 2 + cardWidth / 2;
    el.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
  }, [activeIdx]);

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -210 : 210, behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: isCollapsed ? 68 : 0, opacity: 1 }}
      exit={{ y: 160, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        background: "rgba(250,251,247,0.96)",
        backdropFilter: "blur(16px)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
        border: `1px solid ${colors.dim}`,
        borderBottom: "none",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 拖拽把手 + 头部 */}
      <div
        style={{
          padding: "10px 16px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setIsCollapsed((c) => !c)}
      >
        {/* 左：统计信息 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.sakura}, ${colors.bloom})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🗺️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: colors.ink }}>
              地标总览
            </div>
            <div style={{ fontSize: "0.7rem", color: colors.rose }}>
              {spots.length} 个地标 · {spotsWithMemory.length} 个有回忆 · {totalMemories} 段故事
            </div>
          </div>
        </div>

        {/* 右：收起/展开 + 关闭 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: colors.sakura,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: colors.rose,
            }}
          >
            <ChevronUp size={15} />
          </motion.div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: colors.dim + "66", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: colors.ink,
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 卡片滚动轨道 */}
      <div style={{ position: "relative", paddingBottom: 16 }}>
        {/* 左箭头 */}
        <AnimatePresence>
          {canScrollLeft && !isCollapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scrollBy("left")}
              style={{
                position: "absolute", left: 6, top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10, width: 30, height: 30,
                borderRadius: "50%", border: "none",
                background: "rgba(250,251,247,0.92)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: colors.ink,
              }}
            >
              <ChevronLeft size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* 右箭头 */}
        <AnimatePresence>
          {canScrollRight && !isCollapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scrollBy("right")}
              style={{
                position: "absolute", right: 6, top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10, width: 30, height: 30,
                borderRadius: "50%", border: "none",
                background: "rgba(250,251,247,0.92)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: colors.ink,
              }}
            >
              <ChevronRight size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* 卡片列表 */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            padding: "8px 20px 4px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {spots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              memoryList={memories[spot.id] ?? []}
              isActive={spot.id === selectedSpotId}
              onClick={() => onSelectSpot(spot.id)}
            />
          ))}
        </div>
      </div>

      {/* 滚动条隐藏样式 */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </motion.div>
  );
}
