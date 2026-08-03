"use client";

import { useState, useEffect, useRef } from "react";
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
  onUpdateMemoryText?: (spotId: string, memoryId: string | undefined, newText: string) => Promise<void>;
}

const colors = {
  bloom: "#E8B8C2",
  rose: "#C97B8A",
};

function getSpotPhotos(memoryList: Memory[]): string[] {
  const photos: string[] = [];
  for (const mem of memoryList) {
    if (mem.photos && mem.photos.length > 0) photos.push(...mem.photos);
    else if (mem.image) photos.push(mem.image);
  }
  return [...new Set(photos)];
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

// 单张卡片（只展示照片）
function Card({
  spot,
  memoryList,
  photoIdx,
  onPhotoChange,
}: {
  spot: Spot;
  memoryList: Memory[];
  photoIdx: number;
  onPhotoChange: (i: number) => void;
}) {
  const photos = getSpotPhotos(memoryList);
  const [photoDir, setPhotoDir] = useState(0);

  const goPhoto = (dir: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(0, Math.min(photos.length - 1, photoIdx + dir));
    setPhotoDir(dir);
    onPhotoChange(next);
  };

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
      {photos.length > 0 ? (
        <>
          <AnimatePresence initial={false} mode="wait" custom={photoDir}>
            <motion.img
              key={`${spot.id}-p${photoIdx}`}
              src={photos[photoIdx]}
              alt={spot.name}
              custom={photoDir}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? "55%" : "-55%", opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? "-40%" : "40%", opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
              draggable={false}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%", objectFit: "cover",
              }}
            />
          </AnimatePresence>

          {/* 上下渐变遮罩 */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.52) 100%)",
          }} />

          {/* 内部左右箭头（仅多张时） */}
          {photos.length > 1 && (
            <>
              {photoIdx > 0 && (
                <button onClick={(e) => goPhoto(-1, e)} style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(0,0,0,0.35)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff", zIndex: 5,
                }}>
                  <ChevronLeft size={15} />
                </button>
              )}
              {photoIdx < photos.length - 1 && (
                <button onClick={(e) => goPhoto(1, e)} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(0,0,0,0.35)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff", zIndex: 5,
                }}>
                  <ChevronRight size={15} />
                </button>
              )}
              {/* 内部底部点 */}
              <div style={{ position: "absolute", bottom: 14, left: 0, right: 0 }}>
                <Dots total={photos.length} active={photoIdx} />
              </div>
            </>
          )}
        </>
      ) : (
        /* 无照片占位 */
        <div style={{
          width: "100%", height: "100%", display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "linear-gradient(160deg, rgba(232,184,194,0.08), rgba(30,24,32,0.95))",
        }}>
          <span style={{ fontSize: 64, opacity: 0.35 }}>{spot.emoji ?? "📍"}</span>
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
  const initialIdx = Math.max(0, spots.findIndex((s) => s.id === selectedSpotId));
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [photosMap, setPhotosMap] = useState<Record<number, number>>({});

  // 内联编辑地标名称状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // 内联编辑回忆文字状态
  const [isEditingText, setIsEditingText] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [savingText, setSavingText] = useState(false);

  // 拖拽相关
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = spots.findIndex((s) => s.id === selectedSpotId);
    if (idx >= 0 && idx !== currentIdx) setCurrentIdx(idx);
  }, [selectedSpotId]);

  // 当切换卡片时，关闭编辑状态
  useEffect(() => {
    setIsEditingName(false);
    setIsEditingText(false);
  }, [currentIdx]);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= spots.length) return;
    setCurrentIdx(idx);
    onSelectSpot(spots[idx].id);
    animate(dragX, 0, { duration: 0 });
  };

  const spot = spots[currentIdx];
  const memoryList = spot ? (memories[spot.id] ?? []) : [];
  const latestMemory = memoryList[0];
  const totalPhotos = memoryList.reduce((n, m) => n + (m.photos?.length ?? (m.image ? 1 : 0)), 0);

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
    if (!spot) return;
    setSavingText(true);
    try {
      if (onUpdateMemoryText) {
        await onUpdateMemoryText(spot.id, latestMemory?.id, textInput.trim());
      }
      setIsEditingText(false);
    } finally {
      setSavingText(false);
    }
  };

  // 卡片尺寸参数
  const SIDE_OFFSET = 210;
  const SIDE_SCALE = 0.78;
  const SIDE_OPACITY = 0.48;

  // 用 dragX 驱动三张卡的实时位置
  const prevX = useTransform(dragX, v => -SIDE_OFFSET + v * 0.6);
  const currX = useTransform(dragX, v => v);
  const nextX = useTransform(dragX, v => SIDE_OFFSET + v * 0.6);
  const prevOpacity = useTransform(dragX, [-80, 0, 80], [SIDE_OPACITY + 0.25, SIDE_OPACITY, SIDE_OPACITY]);
  const nextOpacity = useTransform(dragX, [-80, 0, 80], [SIDE_OPACITY, SIDE_OPACITY, SIDE_OPACITY + 0.25]);

  const prevSpot = currentIdx > 0 ? spots[currentIdx - 1] : null;
  const nextSpot = currentIdx < spots.length - 1 ? spots[currentIdx + 1] : null;

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -55 && nextSpot) goTo(currentIdx + 1);
    else if (info.offset.x > 55 && prevSpot) goTo(currentIdx - 1);
    else animate(dragX, 0, { type: "spring", stiffness: 400, damping: 35 });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1800,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 暗色磨砂背景 */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          background: "rgba(10,8,12,0.86)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
        }}
        onClick={onClose}
      />

      {/* 粉色光晕 */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 55% at 50% 58%, rgba(232,184,194,0.1) 0%, transparent 70%)",
      }} />

      {/* 关闭按钮 */}
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20, zIndex: 20,
        width: 38, height: 38, borderRadius: "50%",
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)",
      }}>
        <X size={16} />
      </button>

      {/* 顶部：N/Total */}
      <div style={{
        position: "absolute", top: 26, left: 0, right: 0,
        textAlign: "center", zIndex: 10, pointerEvents: "none",
      }}>
        <span style={{
          fontSize: "0.68rem", color: "rgba(255,255,255,0.38)",
          letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600,
        }}>
          {currentIdx + 1} / {spots.length}
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
            top: "9%",
            left: 0, right: 0,
            textAlign: "center",
            zIndex: 20,
            padding: "0 40px",
          }}
        >
          <div style={{ fontSize: 30, marginBottom: 6 }}>{spot?.emoji ?? "📍"}</div>
          
          {isEditingName ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, maxWidth: "80%" }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
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
              <h2 style={{
                fontSize: "clamp(1.25rem, 5vw, 1.55rem)",
                fontWeight: 800, color: "#fff", margin: 0,
                letterSpacing: "0.02em",
                textShadow: "0 2px 16px rgba(0,0,0,0.5)",
              }}>
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
                    transition: "all 0.2s",
                  }}
                >
                  <Pencil size={13} />
                </span>
              )}
            </div>
          )}

          {latestMemory?.date && (
            <p style={{
              fontSize: "0.75rem", color: colors.bloom,
              marginTop: 5, opacity: 0.85,
              fontWeight: 500, letterSpacing: "0.08em",
            }}>
              {latestMemory.date}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── 三卡堆叠区 ── */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: "22%", bottom: "22%",
          left: 0, right: 0,
          zIndex: 5,
        }}
      >
        {/* 旁边卡：上一张 */}
        {prevSpot && (
          <motion.div
            style={{
              position: "absolute",
              width: "min(62vw, 260px)",
              aspectRatio: "3/4",
              top: "50%", left: "50%",
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
            <Card
              spot={prevSpot}
              memoryList={memories[prevSpot.id] ?? []}
              photoIdx={photosMap[currentIdx - 1] ?? 0}
              onPhotoChange={() => {}}
            />
          </motion.div>
        )}

        {/* 旁边卡：下一张 */}
        {nextSpot && (
          <motion.div
            style={{
              position: "absolute",
              width: "min(62vw, 260px)",
              aspectRatio: "3/4",
              top: "50%", left: "50%",
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
            <Card
              spot={nextSpot}
              memoryList={memories[nextSpot.id] ?? []}
              photoIdx={photosMap[currentIdx + 1] ?? 0}
              onPhotoChange={() => {}}
            />
          </motion.div>
        )}

        {/* 主卡：当前 */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
          style={{
            position: "absolute",
            width: "min(62vw, 260px)",
            aspectRatio: "3/4",
            top: "50%", left: "50%",
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
              <Card
                spot={spot}
                memoryList={memoryList}
                photoIdx={photosMap[currentIdx] ?? 0}
                onPhotoChange={(i) => setPhotosMap((m) => ({ ...m, [currentIdx]: i }))}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── 底部文字区（支持直接内联编辑回忆文字） ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`caption-${currentIdx}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            bottom: "8%",
            left: 0, right: 0,
            textAlign: "center",
            zIndex: 20,
            padding: "0 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {isEditingText ? (
            <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                autoFocus
                placeholder="在这里写下你们的幸福回忆故事吧..."
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
                  <Check size={14} /> 保存回忆
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
                  setTextInput(latestMemory?.text ?? "");
                  setIsEditingText(true);
                }
              }}
            >
              {latestMemory?.text ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  <p style={{
                    fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.65,
                    margin: 0,
                    textShadow: "0 1px 10px rgba(0,0,0,0.4)",
                  }}>
                    {latestMemory.text}
                  </p>
                  {isAdmin && (
                    <span style={{ color: colors.bloom, opacity: 0.8 }} title="点击修改回忆文字">
                      <Pencil size={13} />
                    </span>
                  )}
                </div>
              ) : (
                isAdmin && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: colors.bloom,
                    fontSize: "0.85rem",
                    background: "rgba(232,184,194,0.15)",
                    border: "1px stroke rgba(232,184,194,0.3)",
                    padding: "6px 14px",
                    borderRadius: 16,
                  }}>
                    <Pencil size={13} />
                    <span>点击写下属于这里的第 1 段回忆故事...</span>
                  </div>
                )
              )}
            </div>
          )}

          {/* 回忆数徽章（有回忆才显示） */}
          {memoryList.length > 0 && !isEditingText && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(232,184,194,0.16)",
              border: "1px solid rgba(232,184,194,0.25)",
              borderRadius: 20, padding: "4px 13px",
              marginTop: 10,
            }}>
              <Heart size={11} fill={colors.bloom} color={colors.bloom} />
              <span style={{ fontSize: "0.7rem", color: colors.bloom, fontWeight: 600 }}>
                {memoryList.length} 段回忆 · {totalPhotos} 张照片
              </span>
            </div>
          )}

          {/* 外部地点圆点导航 */}
          {spots.length > 1 && !isEditingText && (
            <div style={{ marginTop: 14 }}>
              <Dots total={spots.length} active={currentIdx} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 左右切换箭头 */}
      {currentIdx > 0 && !isEditingName && !isEditingText && (
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => goTo(currentIdx - 1)}
          style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            zIndex: 15, width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={18} />
        </motion.button>
      )}
      {currentIdx < spots.length - 1 && !isEditingName && !isEditingText && (
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => goTo(currentIdx + 1)}
          style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            zIndex: 15, width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)",
          }}
        >
          <ChevronRight size={18} />
        </motion.button>
      )}
    </motion.div>
  );
}
