"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { X, Heart, ChevronLeft, ChevronRight, Pencil, Check } from "lucide-react";
import type { Spot } from "@/data/spots";
import type { Memory } from "@/data/memories";

interface SpotCardGalleryProps {
  spots: Spot[];
  memories: Record<string, Memory[]>;
  selectedSpotId: string | null;
  isAdmin?: boolean;
  onSelectSpot: (spotId: string) => void;
  onClose: () => void;
  onUpdateSpotName?: (spotId: string, newName: string) => Promise<void>;
  onUpdateMemoryText?: (spotId: string, memoryId: string | undefined, newText: string, photoIndex?: number) => Promise<void>;
}

const colors = {
  bloom: "#E8B8C2",
  rose: "#C97B8A",
};

// 展平为以“单张照片/独立回忆”为核心的平铺卡片结构
interface GalleryItem {
  id: string;
  spot: Spot;
  memory?: Memory;
  photoUrl?: string;
  photoIndex: number;
  totalPhotosInSpot: number;
}

function Dots({ total, active }: { total: number; active: number }) {
  if (total <= 1) return null;
  const show = Math.min(total, 7);
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: show }).map((_, i) => {
        const isActive = i === Math.min(active, show - 1);
        return (
          <motion.div
            key={i}
            animate={{ width: isActive ? 18 : 5, opacity: isActive ? 1 : 0.35 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            style={{ height: 5, borderRadius: 3, background: isActive ? colors.bloom : "rgba(255,255,255,0.5)" }}
          />
        );
      })}
    </div>
  );
}

// 单张卡片组件（完美展示单一照片）
function SinglePhotoCard({ item }: { item: GalleryItem }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.3)",
        background: "rgba(30,24,32,0.9)",
      }}
    >
      {item.photoUrl ? (
        <>
          <img
            src={item.photoUrl}
            alt={item.spot.name}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* 上下渐变遮罩 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 65%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          {/* 照片在当前地标下的张数角标 */}
          {item.totalPhotosInSpot > 1 && (
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(6px)",
                color: "#fff",
                fontSize: "0.68rem",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {item.photoIndex + 1} / {item.totalPhotosInSpot}
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
            background: "linear-gradient(160deg, rgba(232,184,194,0.08), rgba(30,24,32,0.95))",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 64, opacity: 0.35 }}>{item.spot.emoji ?? "📍"}</span>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
            暂无相片记录
          </span>
        </div>
      )}
    </div>
  );
}

export default function SpotCardGallery({
  spots,
  memories,
  selectedSpotId,
  isAdmin = true,
  onSelectSpot,
  onClose,
  onUpdateSpotName,
  onUpdateMemoryText,
}: SpotCardGalleryProps) {
  // 把所有地标与其包含的照片平铺展开为扁平项列表
  const galleryItems = useMemo(() => {
    const items: GalleryItem[] = [];
    for (const spot of spots) {
      const spotMemories = memories[spot.id] ?? [];
      if (spotMemories.length > 0) {
        for (const mem of spotMemories) {
          const photos = mem.photos?.length ? mem.photos : mem.image ? [mem.image] : [];
          if (photos.length > 0) {
            photos.forEach((photoUrl, pIdx) => {
              items.push({
                id: `${spot.id}-${mem.id}-${pIdx}`,
                spot,
                memory: mem,
                photoUrl,
                photoIndex: pIdx,
                totalPhotosInSpot: photos.length,
              });
            });
          } else {
            items.push({
              id: `${spot.id}-${mem.id}-nophoto`,
              spot,
              memory: mem,
              photoIndex: 0,
              totalPhotosInSpot: 0,
            });
          }
        }
      } else {
        items.push({
          id: `${spot.id}-empty`,
          spot,
          photoIndex: 0,
          totalPhotosInSpot: 0,
        });
      }
    }
    return items;
  }, [spots, memories]);

  // 计算初始聚焦的位置
  const initialIdx = useMemo(() => {
    if (!selectedSpotId) return 0;
    const idx = galleryItems.findIndex((it) => it.spot.id === selectedSpotId);
    return idx >= 0 ? idx : 0;
  }, [selectedSpotId, galleryItems]);

  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const activeItemIdRef = useRef<string | null>(null);

  // 内联编辑地标名称状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // 内联编辑回忆文字状态
  const [isEditingText, setIsEditingText] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [savingText, setSavingText] = useState(false);

  // 实时修改的文字缓存
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});

  // 拖拽相关
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 记录当前照片项ID，防止保存时弹回第一张照片
  useEffect(() => {
    const item = galleryItems[currentIdx];
    if (item) {
      activeItemIdRef.current = item.id;
    }
  }, [currentIdx, galleryItems]);

  useEffect(() => {
    if (selectedSpotId) {
      // 优先在 galleryItems 里寻找上一次浏览的照片 ID
      if (activeItemIdRef.current) {
        const sameItemIdx = galleryItems.findIndex((it) => it.id === activeItemIdRef.current);
        if (sameItemIdx >= 0) {
          if (sameItemIdx !== currentIdx) setCurrentIdx(sameItemIdx);
          return;
        }
      }

      // 如果选中的地标变了，才跳转到该地标的第一张
      const currentSpotId = galleryItems[currentIdx]?.spot.id;
      if (currentSpotId !== selectedSpotId) {
        const spotIdx = galleryItems.findIndex((it) => it.spot.id === selectedSpotId);
        if (spotIdx >= 0 && spotIdx !== currentIdx) setCurrentIdx(spotIdx);
      }
    }
  }, [selectedSpotId, galleryItems]);

  // 当切换卡片时，重置编辑状态
  useEffect(() => {
    setIsEditingName(false);
    setIsEditingText(false);
  }, [currentIdx]);

  const currentItem = galleryItems[currentIdx] ?? galleryItems[0];
  const spot = currentItem?.spot;
  const memory = currentItem?.memory;

  const rawPhotoText = memory?.photoTexts?.[currentItem?.photoIndex ?? 0];
  const defaultPhotoText = (currentItem?.photoIndex === 0) ? (memory?.text ?? "") : (rawPhotoText ?? "");
  const displayText = spot
    ? customTexts[currentItem?.id] !== undefined
      ? customTexts[currentItem?.id]
      : defaultPhotoText
    : "";

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= galleryItems.length) return;
    setCurrentIdx(idx);
    const targetItem = galleryItems[idx];
    if (targetItem) {
      onSelectSpot(targetItem.spot.id);
    }
    animate(dragX, 0, { duration: 0 });
  };

  // 保存修改后的地标名称
  const handleSaveName = async () => {
    if (!spot || !nameInput.trim()) return;
    setSavingName(true);
    try {
      if (onUpdateSpotName) {
        await onUpdateSpotName(spot.id, nameInput.trim());
      }
      setIsEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  // 保存修改后的回忆文字
  const handleSaveText = async () => {
    if (!spot || !currentItem) return;
    const newText = textInput.trim();
    setSavingText(true);
    try {
      if (onUpdateMemoryText) {
        await onUpdateMemoryText(spot.id, memory?.id, newText, currentItem.photoIndex);
      }
      setCustomTexts((prev) => ({ ...prev, [currentItem.id]: newText }));
      setIsEditingText(false);
    } finally {
      setSavingText(false);
    }
  };

  // 3卡堆叠位置计算
  const SIDE_OFFSET = 210;
  const SIDE_SCALE = 0.78;
  const SIDE_OPACITY = 0.48;

  const prevX = useTransform(dragX, (v) => -SIDE_OFFSET + v * 0.6);
  const currX = useTransform(dragX, (v) => v);
  const nextX = useTransform(dragX, (v) => SIDE_OFFSET + v * 0.6);
  const prevOpacity = useTransform(dragX, [-80, 0, 80], [SIDE_OPACITY + 0.25, SIDE_OPACITY, SIDE_OPACITY]);
  const nextOpacity = useTransform(dragX, [-80, 0, 80], [SIDE_OPACITY, SIDE_OPACITY, SIDE_OPACITY + 0.25]);

  const prevItem = currentIdx > 0 ? galleryItems[currentIdx - 1] : null;
  const nextItem = currentIdx < galleryItems.length - 1 ? galleryItems[currentIdx + 1] : null;

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -55 && nextItem) goTo(currentIdx + 1);
    else if (info.offset.x > 55 && prevItem) goTo(currentIdx - 1);
    else animate(dragX, 0, { type: "spring", stiffness: 400, damping: 35 });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1800,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 暗色磨砂背景 */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,8,12,0.86)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
        }}
        onClick={onClose}
      />

      {/* 粉色光晕 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 55% at 50% 58%, rgba(232,184,194,0.1) 0%, transparent 70%)",
        }}
      />

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 20,
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.16)",
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

      {/* 顶部：N / 全局总照片数 */}
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
            fontSize: "0.68rem",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          照片 {currentIdx + 1} / {galleryItems.length}
        </span>
      </div>

      {/* ── 标题区（支持直接内联编辑名称） ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`title-${currentIdx}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.28 }}
          style={{
            position: "absolute",
            top: "8.5%",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 20,
            padding: "0 40px",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>{spot?.emoji ?? "📍"}</div>

          {isEditingName ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, maxWidth: "80%" }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                }}
                autoFocus
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: `1.5px solid ${colors.bloom}`,
                  borderRadius: 10,
                  padding: "6px 14px",
                  color: "#fff",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  textAlign: "center",
                  outline: "none",
                  backdropFilter: "blur(8px)",
                  width: "220px",
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                style={{
                  background: colors.rose,
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 10px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: isAdmin ? "pointer" : "default",
              }}
              onClick={() => {
                if (isAdmin && spot) {
                  setNameInput(spot.name);
                  setIsEditingName(true);
                }
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.2rem, 4.8vw, 1.5rem)",
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "0.02em",
                  textShadow: "0 2px 16px rgba(0,0,0,0.5)",
                }}
              >
                {spot?.name}
              </h2>
              {isAdmin && (
                <span
                  title="点击修改地点名称"
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    borderRadius: "50%",
                    padding: 5,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.bloom,
                  }}
                >
                  <Pencil size={13} />
                </span>
              )}
            </div>
          )}

          {memory?.date && (
            <p
              style={{
                fontSize: "0.72rem",
                color: colors.bloom,
                marginTop: 4,
                opacity: 0.85,
                fontWeight: 500,
                letterSpacing: "0.08em",
              }}
            >
              {memory.date}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── 三卡平铺堆叠区 ── */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: "22%",
          bottom: "22%",
          left: 0,
          right: 0,
          zIndex: 5,
        }}
      >
        {/* 旁侧卡：前一张 */}
        {prevItem && (
          <motion.div
            style={{
              position: "absolute",
              width: "min(62vw, 260px)",
              aspectRatio: "3/4",
              top: "50%",
              left: "50%",
              marginLeft: "calc(min(62vw, 260px) / -2)",
              marginTop: "calc(min(62vw, 260px) * 4/3 / -2)",
              x: prevX,
              scale: SIDE_SCALE,
              opacity: prevOpacity,
              cursor: "pointer",
              zIndex: 3,
            }}
            onClick={() => goTo(currentIdx - 1)}
          >
            <SinglePhotoCard item={prevItem} />
          </motion.div>
        )}

        {/* 旁侧卡：后一张 */}
        {nextItem && (
          <motion.div
            style={{
              position: "absolute",
              width: "min(62vw, 260px)",
              aspectRatio: "3/4",
              top: "50%",
              left: "50%",
              marginLeft: "calc(min(62vw, 260px) / -2)",
              marginTop: "calc(min(62vw, 260px) * 4/3 / -2)",
              x: nextX,
              scale: SIDE_SCALE,
              opacity: nextOpacity,
              cursor: "pointer",
              zIndex: 3,
            }}
            onClick={() => goTo(currentIdx + 1)}
          >
            <SinglePhotoCard item={nextItem} />
          </motion.div>
        )}

        {/* 主卡：当前正在查看的独立照片 */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
          style={{
            position: "absolute",
            width: "min(62vw, 260px)",
            aspectRatio: "3/4",
            top: "50%",
            left: "50%",
            marginLeft: "calc(min(62vw, 260px) / -2)",
            marginTop: "calc(min(62vw, 260px) * 4/3 / -2)",
            x: currX,
            scale: 1,
            zIndex: 10,
            cursor: "grab",
            touchAction: "none",
          }}
          whileTap={{ cursor: "grabbing" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${currentIdx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ width: "100%", height: "100%" }}
            >
              <SinglePhotoCard item={currentItem} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── 底部文字区（针对当前照片独立编辑回忆） ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`caption-${currentIdx}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            bottom: "7.5%",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 20,
            padding: "0 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {isEditingText ? (
            <div
              style={{
                width: "100%",
                maxWidth: 380,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                autoFocus
                placeholder="为这张照片写下专属的幸福回忆吧..."
                rows={2}
                maxLength={80}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.15)",
                  border: `1.5px solid ${colors.bloom}`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#fff",
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                  outline: "none",
                  resize: "none",
                  backdropFilter: "blur(8px)",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSaveText}
                  disabled={savingText}
                  style={{
                    background: `linear-gradient(135deg, ${colors.bloom}, ${colors.rose})`,
                    border: "none",
                    borderRadius: 12,
                    padding: "6px 18px",
                    color: "#fff",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Check size={14} /> 保存照片回忆
                </button>
                <button
                  onClick={() => setIsEditingText(false)}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    borderRadius: 12,
                    padding: "6px 14px",
                    color: "#fff",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                cursor: isAdmin ? "pointer" : "default",
                maxWidth: 420,
              }}
              onClick={() => {
                if (isAdmin) {
                  setTextInput(displayText || "");
                  setIsEditingText(true);
                }
              }}
            >
              {displayText ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.65,
                      margin: 0,
                      textShadow: "0 1px 10px rgba(0,0,0,0.4)",
                    }}
                  >
                    {displayText}
                  </p>
                  {isAdmin && (
                    <span style={{ color: colors.bloom, opacity: 0.8 }} title="点击修改这张照片的回忆">
                      <Pencil size={13} />
                    </span>
                  )}
                </div>
              ) : (
                isAdmin && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: colors.bloom,
                      fontSize: "0.82rem",
                      background: "rgba(232,184,194,0.15)",
                      border: "1px solid rgba(232,184,194,0.3)",
                      padding: "6px 14px",
                      borderRadius: 16,
                    }}
                  >
                    <Pencil size={13} />
                    <span>点击为这张照片标注专属回忆...</span>
                  </div>
                )
              )}
            </div>
          )}

          {/* 全局底部的翻页指示点 */}
          {galleryItems.length > 1 && !isEditingText && (
            <div style={{ marginTop: 14 }}>
              <Dots total={galleryItems.length} active={currentIdx} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 左右翻页大箭头 */}
      {currentIdx > 0 && !isEditingName && !isEditingText && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => goTo(currentIdx - 1)}
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 15,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={18} />
        </motion.button>
      )}
      {currentIdx < galleryItems.length - 1 && !isEditingName && !isEditingText && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => goTo(currentIdx + 1)}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 15,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronRight size={18} />
        </motion.button>
      )}
    </motion.div>
  );
}
