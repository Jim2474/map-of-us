"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Heart, MapPin, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
};

// 单个地点的所有照片（含每条回忆的每张图）
function getSpotPhotos(memoryList: Memory[]): string[] {
  const photos: string[] = [];
  for (const mem of memoryList) {
    if (mem.photos && mem.photos.length > 0) {
      photos.push(...mem.photos);
    } else if (mem.image) {
      photos.push(mem.image);
    }
  }
  return [...new Set(photos)]; // 去重
}

// 底部小圆点指示器
function Dots({ total, active }: { total: number; active: number }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: Math.min(total, 8) }).map((_, i) => {
        const isActive = i === Math.min(active, 7);
        const isLast = total > 8 && i === 7;
        return (
          <motion.div
            key={i}
            animate={{ width: isActive ? 20 : 6, opacity: isLast ? 0.4 : isActive ? 1 : 0.38 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              height: 6,
              borderRadius: 3,
              background: isActive ? colors.bloom : "rgba(255,255,255,0.55)",
            }}
          />
        );
      })}
    </div>
  );
}

// 主卡片内容（单个地点的沉浸式展示）
function SpotSlide({
  spot,
  memoryList,
  isVisible,
}: {
  spot: Spot;
  memoryList: Memory[];
  isVisible: boolean;
}) {
  const photos = getSpotPhotos(memoryList);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoDir, setPhotoDir] = useState(0);
  const latestMemory = memoryList[0];

  useEffect(() => {
    if (isVisible) setPhotoIdx(0);
  }, [isVisible, spot.id]);

  const goPhoto = (dir: 1 | -1) => {
    setPhotoDir(dir);
    setPhotoIdx((i) => Math.max(0, Math.min(photos.length - 1, i + dir)));
  };

  const hasPhotos = photos.length > 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        userSelect: "none",
      }}
    >
      {/* ── 上方：地点标题区 ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        style={{ textAlign: "center", marginBottom: 24, width: "100%" }}
      >
        <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>
          {spot.emoji ?? "📍"}
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            letterSpacing: "0.02em",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          {spot.name}
        </h2>
        {latestMemory?.date && (
          <p
            style={{
              fontSize: "0.78rem",
              color: colors.bloom,
              marginTop: 6,
              opacity: 0.9,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {latestMemory.date}
          </p>
        )}
      </motion.div>

      {/* ── 中间：大图区 ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.45, type: "spring", stiffness: 220, damping: 22 }}
        style={{
          width: "100%",
          maxWidth: 340,
          aspectRatio: "3/4",
          borderRadius: 24,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)",
          background: "rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {hasPhotos ? (
          <>
            <AnimatePresence initial={false} mode="wait" custom={photoDir}>
              <motion.img
                key={`${spot.id}-photo-${photoIdx}`}
                src={photos[photoIdx]}
                alt={spot.name}
                custom={photoDir}
                variants={{
                  enter: (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0, scale: 0.92 }),
                  center: { x: 0, opacity: 1, scale: 1 },
                  exit: (d: number) => ({ x: d > 0 ? "-40%" : "40%", opacity: 0, scale: 0.95 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                draggable={false}
              />
            </AnimatePresence>

            {/* 图片左右切换 */}
            {photos.length > 1 && (
              <>
                {photoIdx > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goPhoto(-1); }}
                    style={{
                      position: "absolute", left: 10, top: "50%",
                      transform: "translateY(-50%)",
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(0,0,0,0.38)", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#fff", zIndex: 10,
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                {photoIdx < photos.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goPhoto(1); }}
                    style={{
                      position: "absolute", right: 10, top: "50%",
                      transform: "translateY(-50%)",
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(0,0,0,0.38)", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#fff", zIndex: 10,
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            )}

            {/* 底部渐变 + 图片计数 */}
            <div
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
                height: 80, pointerEvents: "none",
              }}
            />
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: 14, left: 0, right: 0 }}>
                <Dots total={photos.length} active={photoIdx} />
              </div>
            )}
          </>
        ) : (
          /* 无照片占位 */
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "linear-gradient(160deg, rgba(232,184,194,0.12) 0%, rgba(90,102,112,0.08) 100%)",
            }}
          >
            <span style={{ fontSize: 56, opacity: 0.5 }}>{spot.emoji ?? "📍"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.45 }}>
              <Plus size={14} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                还没有照片，点击地标添加回忆
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── 下方：文字回忆 ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        style={{ textAlign: "center", marginTop: 24, width: "100%", maxWidth: 340 }}
      >
        {latestMemory?.text ? (
          <p
            style={{
              fontSize: "1.05rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.65,
              margin: 0,
              textShadow: "0 1px 8px rgba(0,0,0,0.3)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {latestMemory.text}
          </p>
        ) : spot.description ? (
          <p
            style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.6,
              margin: 0,
              fontStyle: "italic",
            }}
          >
            {spot.description}
          </p>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.28)", margin: 0 }}>
            这里还没有故事，去留下一段吧～
          </p>
        )}

        {/* 回忆数 */}
        {memoryList.length > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 12,
              background: "rgba(232,184,194,0.18)",
              borderRadius: 20,
              padding: "4px 12px",
            }}
          >
            <Heart size={12} fill={colors.bloom} color={colors.bloom} />
            <span style={{ fontSize: "0.72rem", color: colors.bloom, fontWeight: 600 }}>
              {memoryList.length} 段回忆 · {getSpotPhotos(memoryList).length} 张照片
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SpotCardGallery({
  spots,
  memories,
  selectedSpotId,
  onSelectSpot,
  onClose,
}: SpotCardGalleryProps) {
  const initialIdx = Math.max(0, spots.findIndex((s) => s.id === selectedSpotId));
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [dragDir, setDragDir] = useState(0);

  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-200, 0, 200], [0.6, 0.88, 0.6]);

  // selectedSpotId 从外部改变时同步
  useEffect(() => {
    const idx = spots.findIndex((s) => s.id === selectedSpotId);
    if (idx >= 0 && idx !== currentIdx) setCurrentIdx(idx);
  }, [selectedSpotId]);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= spots.length) return;
    setDragDir(idx > currentIdx ? 1 : -1);
    setCurrentIdx(idx);
    onSelectSpot(spots[idx].id);
  };

  const spot = spots[currentIdx];
  const memoryList = spot ? (memories[spot.id] ?? []) : [];

  return (
    /* 全屏暗色遮罩 */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1800,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 模糊背景 */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(12,10,14,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        onClick={onClose}
      />

      {/* 动态色彩光晕（跟随当前地点颜色） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 60%, rgba(232,184,194,0.12) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          backdropFilter: "blur(8px)",
        }}
      >
        <X size={16} />
      </button>

      {/* 地点总数 + 当前位置 */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {currentIdx + 1} / {spots.length}
        </span>
      </div>

      {/* 可拖拽的内容区域 */}
      <motion.div
        key={`slide-${currentIdx}`}
        custom={dragDir}
        variants={{
          enter: (d: number) => ({ x: d > 0 ? "50%" : "-50%", opacity: 0 }),
          center: { x: 0, opacity: 1 },
          exit: (d: number) => ({ x: d > 0 ? "-30%" : "30%", opacity: 0 }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 && currentIdx < spots.length - 1) goTo(currentIdx + 1);
          else if (info.offset.x > 60 && currentIdx > 0) goTo(currentIdx - 1);
        }}
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          maxWidth: 420,
          height: "calc(100vh - 120px)",
          display: "flex",
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <SpotSlide spot={spot} memoryList={memoryList} isVisible />
      </motion.div>

      {/* 底部：左右箭头 + 地点名列表缩略 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "16px 20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "linear-gradient(to top, rgba(12,10,14,0.7) 0%, transparent 100%)",
        }}
      >
        {/* 上一个 */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => goTo(currentIdx - 1)}
          disabled={currentIdx === 0}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: currentIdx === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            color: currentIdx === 0 ? "rgba(255,255,255,0.22)" : "#fff",
            flexShrink: 0,
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={20} />
        </motion.button>

        {/* 中间：小圆点导航 */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Dots total={spots.length} active={currentIdx} />
        </div>

        {/* 下一个 */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => goTo(currentIdx + 1)}
          disabled={currentIdx === spots.length - 1}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: currentIdx === spots.length - 1 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: currentIdx === spots.length - 1 ? "not-allowed" : "pointer",
            color: currentIdx === spots.length - 1 ? "rgba(255,255,255,0.22)" : "#fff",
            flexShrink: 0,
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* 左右边缘提示（有相邻地点时显示） */}
      {currentIdx > 0 && (
        <div
          style={{
            position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
            width: 40, height: 80, pointerEvents: "none", zIndex: 6,
            background: "linear-gradient(to right, rgba(255,255,255,0.06), transparent)",
            borderRadius: "0 40px 40px 0",
          }}
        />
      )}
      {currentIdx < spots.length - 1 && (
        <div
          style={{
            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
            width: 40, height: 80, pointerEvents: "none", zIndex: 6,
            background: "linear-gradient(to left, rgba(255,255,255,0.06), transparent)",
            borderRadius: "40px 0 0 40px",
          }}
        />
      )}
    </motion.div>
  );
}
