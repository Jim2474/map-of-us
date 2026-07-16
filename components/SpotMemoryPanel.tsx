"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Pencil, Plus, Trash2, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Spot } from "@/data/spots";
import type { Memory } from "@/data/memories";

interface SpotMemoryPanelProps {
  spot: Spot;
  memories: Memory[];
  isAdmin: boolean;
  onClose: () => void;
  onMemoriesChanged: (memories: Memory[]) => void;
}

const colors = {
  cream: "#FAFBF7",
  ink: "#5A6670",
  sakura: "#F5DCE0",
  bloom: "#E8B8C2",
  mist: "#D6E8F0",
  rose: "#C97B8A",
  dim: "#D8DDD8",
};

const memoryTextMaxLength = 80;

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

const resizeImage = (file: File, maxDim: number, quality: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });

export default function SpotMemoryPanel({
  spot,
  memories,
  isAdmin,
  onClose,
  onMemoriesChanged,
}: SpotMemoryPanelProps) {
  const [tab, setTab] = useState<"view" | "add">(memories.length === 0 && isAdmin ? "add" : "view");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [draftText, setDraftText] = useState("");
  const [draftDate, setDraftDate] = useState(today());
  const [draftPhotos, setDraftPhotos] = useState<{ previewUrl: string; dataUrl: string }[]>([]);
  const [photoGalleryIdx, setPhotoGalleryIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMemory = memories[currentIdx] ?? null;
  const currentPhotos = currentMemory?.photos?.length ? currentMemory.photos : currentMemory ? [currentMemory.image] : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPhotos = await Promise.all(
      files.slice(0, 24 - draftPhotos.length).map(async (f) => ({
        previewUrl: URL.createObjectURL(f),
        dataUrl: await resizeImage(f, 900, 0.52),
      }))
    );
    setDraftPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!draftText.trim() || draftPhotos.length === 0) {
      setError("请添加照片和回忆文字");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        memory: {
          cityId: spot.cityId,
          spotId: spot.id,
          date: draftDate,
          text: draftText.trim(),
          image: draftPhotos[0].dataUrl,
          photos: draftPhotos.map((p) => p.dataUrl),
        },
      };

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("保存失败");

      const data = (await res.json()) as { memory: Memory; memories: Record<string, Memory[]> };
      const updatedMemories = [data.memory, ...memories];
      onMemoriesChanged(updatedMemories);
      setTab("view");
      setCurrentIdx(0);
      setDraftText("");
      setDraftDate(today());
      setDraftPhotos([]);
    } catch {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentMemory) return;
    setDeleting(true);

    try {
      await fetch("/api/memories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId: spot.cityId, memoryId: currentMemory.id }),
        credentials: "include",
      });

      const next = memories.filter((m) => m.id !== currentMemory.id);
      onMemoriesChanged(next);
      setCurrentIdx(Math.max(0, currentIdx - 1));
    } catch {
      setError("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      draftPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [draftPhotos]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(420px, calc(100vw - 32px))",
        background: colors.cream,
        borderRadius: 20,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
        zIndex: 1000,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.sakura} 0%, ${colors.bloom} 100%)`,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{spot.emoji ?? "❤️"}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#5A3340" }}>{spot.name}</div>
            {spot.description && (
              <div style={{ fontSize: "0.72rem", color: "#9A6070", marginTop: 2 }}>{spot.description}</div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "none",
            borderRadius: "50%",
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#5A3340",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab bar */}
      {isAdmin && (
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${colors.dim}`,
            background: "#fff",
          }}
        >
          <button
            onClick={() => setTab("view")}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === "view" ? 700 : 400,
              color: tab === "view" ? colors.rose : colors.ink,
              borderBottom: tab === "view" ? `2px solid ${colors.rose}` : "2px solid transparent",
              fontSize: "0.8rem",
            }}
          >
            💌 回忆 ({memories.length})
          </button>
          <button
            onClick={() => setTab("add")}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === "add" ? 700 : 400,
              color: tab === "add" ? colors.rose : colors.ink,
              borderBottom: tab === "add" ? `2px solid ${colors.rose}` : "2px solid transparent",
              fontSize: "0.8rem",
            }}
          >
            <Plus size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />
            新增回忆
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          {tab === "view" ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: "16px 20px" }}
            >
              {memories.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: colors.dim,
                    fontSize: "0.85rem",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                  <div>这里还没有回忆</div>
                  {isAdmin && (
                    <div style={{ marginTop: 8, fontSize: "0.75rem" }}>
                      点击「新增回忆」开始记录
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Photo Gallery */}
                  {currentPhotos.length > 0 && (
                    <div
                      style={{
                        position: "relative",
                        borderRadius: 12,
                        overflow: "hidden",
                        aspectRatio: "4/3",
                        marginBottom: 14,
                        background: colors.dim,
                      }}
                    >
                      <img
                        src={currentPhotos[photoGalleryIdx]}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {currentPhotos.length > 1 && (
                        <>
                          <button
                            onClick={() => setPhotoGalleryIdx((i) => Math.max(0, i - 1))}
                            disabled={photoGalleryIdx === 0}
                            style={{
                              position: "absolute",
                              left: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "rgba(255,255,255,0.7)",
                              border: "none",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              opacity: photoGalleryIdx === 0 ? 0.3 : 1,
                            }}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            onClick={() => setPhotoGalleryIdx((i) => Math.min(currentPhotos.length - 1, i + 1))}
                            disabled={photoGalleryIdx === currentPhotos.length - 1}
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "rgba(255,255,255,0.7)",
                              border: "none",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              opacity: photoGalleryIdx === currentPhotos.length - 1 ? 0.3 : 1,
                            }}
                          >
                            <ChevronRight size={14} />
                          </button>
                          <div
                            style={{
                              position: "absolute",
                              bottom: 8,
                              right: 10,
                              background: "rgba(0,0,0,0.4)",
                              color: "#fff",
                              fontSize: "0.7rem",
                              padding: "2px 7px",
                              borderRadius: 10,
                            }}
                          >
                            {photoGalleryIdx + 1}/{currentPhotos.length}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Memory text */}
                  <div
                    style={{
                      fontSize: "0.88rem",
                      color: colors.ink,
                      lineHeight: 1.6,
                      marginBottom: 10,
                      fontStyle: "italic",
                    }}
                  >
                    「{currentMemory?.text}」
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "0.72rem", color: colors.dim }}>
                      📅 {currentMemory?.date}
                    </span>

                    {/* Memory navigation */}
                    {memories.length > 1 && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setPhotoGalleryIdx(0); }}
                          disabled={currentIdx === 0}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: currentIdx === 0 ? colors.dim : colors.ink, padding: 2,
                          }}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span style={{ fontSize: "0.72rem", color: colors.dim }}>
                          {currentIdx + 1}/{memories.length}
                        </span>
                        <button
                          onClick={() => { setCurrentIdx((i) => Math.min(memories.length - 1, i + 1)); setPhotoGalleryIdx(0); }}
                          disabled={currentIdx === memories.length - 1}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: currentIdx === memories.length - 1 ? colors.dim : colors.ink, padding: 2,
                          }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}

                    {isAdmin && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#D0706A", padding: 4,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: "16px 20px" }}
            >
              {/* Photos */}
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {draftPhotos.map((p, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden" }}>
                      <img src={p.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => setDraftPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{
                          position: "absolute", top: 3, right: 3,
                          background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                          width: 18, height: 18, color: "#fff", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {draftPhotos.length < 24 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 8,
                        border: `2px dashed ${colors.bloom}`,
                        background: colors.sakura + "44",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        color: colors.rose,
                      }}
                    >
                      <ImagePlus size={18} />
                      <span style={{ fontSize: "0.65rem" }}>添加照片</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Date */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "0.72rem", color: colors.dim, marginBottom: 4 }}>日期</div>
                <input
                  type="text"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  placeholder="YYYY.MM.DD"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${colors.dim}`,
                    fontSize: "0.85rem",
                    fontFamily: "system-ui, sans-serif",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Text */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "0.72rem", color: colors.dim, marginBottom: 4 }}>
                  回忆文字 ({draftText.length}/{memoryTextMaxLength})
                </div>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value.slice(0, memoryTextMaxLength))}
                  placeholder="在这里写下这个地方的故事…"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${colors.dim}`,
                    fontSize: "0.85rem",
                    fontFamily: "system-ui, sans-serif",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {error && (
                <div style={{ color: "#D0706A", fontSize: "0.78rem", marginBottom: 10 }}>{error}</div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: saving
                    ? colors.dim
                    : `linear-gradient(135deg, ${colors.bloom} 0%, ${colors.rose} 100%)`,
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {saving ? "保存中…" : <><Check size={15} /> 保存回忆</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
