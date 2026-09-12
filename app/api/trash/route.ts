import { NextResponse, type NextRequest } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { getPrivateDataFilePath } from "@/lib/server/dataDir";
import { requireAdminSession, requireSiteSession } from "@/lib/server/auth";
import {
  readTrashStore,
  removeFromTrash,
  clearTrash,
  type DeletedRecord,
} from "@/lib/server/trash";
import type { Memory } from "@/data/memories";
import type { Spot } from "@/data/spots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const memoryStorePath = getPrivateDataFilePath("localMemories.private.json");
const spotStorePath = getPrivateDataFilePath("localSpots.private.json");

// GET /api/trash — 获取所有回收站记录
export async function GET(request: NextRequest) {
  const authResponse = requireSiteSession(request);
  if (authResponse) return authResponse;

  const records = await readTrashStore();
  return NextResponse.json({ records });
}

// POST /api/trash — 恢复指定记录
export async function POST(request: NextRequest) {
  const authResponse = requireAdminSession(request);
  if (authResponse) return authResponse;

  const body = (await request.json().catch(() => null)) as { id?: string; type?: string } | null;
  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid payload: id required" }, { status: 400 });
  }

  const record = await removeFromTrash(body.id);
  if (!record) {
    return NextResponse.json({ error: "Record not found in trash" }, { status: 404 });
  }

  try {
    if (record.type === "memory") {
      const mem = record.data as Memory;
      let memoriesStore: Record<string, Memory[]> = {};
      try {
        const raw = await readFile(memoryStorePath, "utf8");
        memoriesStore = JSON.parse(raw);
      } catch {}

      const cityMemories = memoriesStore[record.cityId] ?? [];
      // If already exists, do not duplicate
      if (!cityMemories.some((m) => m.id === mem.id)) {
        memoriesStore[record.cityId] = [mem, ...cityMemories];
      }

      await mkdir(path.dirname(memoryStorePath), { recursive: true });
      await writeFile(memoryStorePath, `${JSON.stringify(memoriesStore, null, 2)}\n`, "utf8");

      return NextResponse.json({ success: true, restored: record, memories: memoriesStore });
    } else if (record.type === "spot") {
      const spot = record.data as Spot;
      let spotsStore: Record<string, Spot[]> = {};
      try {
        const raw = await readFile(spotStorePath, "utf8");
        spotsStore = JSON.parse(raw);
      } catch {}

      const citySpots = spotsStore[record.cityId] ?? [];
      if (!citySpots.some((s) => s.id === spot.id)) {
        spotsStore[record.cityId] = [spot, ...citySpots];
      }

      await mkdir(path.dirname(spotStorePath), { recursive: true });
      await writeFile(spotStorePath, `${JSON.stringify(spotsStore, null, 2)}\n`, "utf8");

      return NextResponse.json({ success: true, restored: record, spots: spotsStore });
    }

    return NextResponse.json({ error: "Unknown record type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to restore record:", error);
    return NextResponse.json({ error: "Internal restore error" }, { status: 500 });
  }
}

// DELETE /api/trash — 清空回收站或彻底删除单条
export async function DELETE(request: NextRequest) {
  const authResponse = requireAdminSession(request);
  if (authResponse) return authResponse;

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (body?.id) {
    await removeFromTrash(body.id);
  } else {
    await clearTrash();
  }

  const records = await readTrashStore();
  return NextResponse.json({ success: true, records });
}
