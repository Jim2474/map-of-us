import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import type { Spot, SpotStore } from "@/data/spots";
import { guilinDefaultSpots } from "@/data/spots";
import { requireAdminSession, requireSiteSession } from "@/lib/server/auth";
import { getPrivateDataFilePath } from "@/lib/server/dataDir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const spotStorePath = getPrivateDataFilePath("localSpots.private.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function readSpotStore(): Promise<SpotStore> {
  try {
    const file = await readFile(spotStorePath, "utf8");
    const parsed = JSON.parse(file) as unknown;
    if (isRecord(parsed)) return parsed as SpotStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  // 第一次读取时，返回桂林默认地点
  return { guilin: guilinDefaultSpots };
}

async function writeSpotStore(store: SpotStore) {
  await mkdir(path.dirname(spotStorePath), { recursive: true });
  await writeFile(spotStorePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function parseSpotPayload(payload: unknown): Omit<Spot, "id" | "createdAt"> | null {
  if (!isRecord(payload)) return null;

  const { cityId, name, lat, lng, description, emoji } = payload;

  if (
    typeof cityId !== "string" ||
    typeof name !== "string" ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    name.trim().length === 0 ||
    name.trim().length > 50
  ) {
    return null;
  }

  return {
    cityId: cityId.trim(),
    name: name.trim(),
    lat,
    lng,
    description: typeof description === "string" ? description.trim().slice(0, 100) : undefined,
    emoji: typeof emoji === "string" ? emoji.trim().slice(0, 4) : undefined,
  };
}

// GET /api/spots?cityId=guilin — 读取某城市的所有地点
export async function GET(request: NextRequest) {
  const authResponse = requireSiteSession(request);
  if (authResponse) return authResponse;

  const cityId = request.nextUrl.searchParams.get("cityId");
  const store = await readSpotStore();

  if (cityId) {
    // 如果是桂林且本地文件没有数据，返回默认数据
    const spots = store[cityId] ?? (cityId === "guilin" ? guilinDefaultSpots : []);
    return NextResponse.json({ spots });
  }

  return NextResponse.json({ spots: store });
}

// POST /api/spots — 管理员新增地点
export async function POST(request: NextRequest) {
  const authResponse = requireAdminSession(request);
  if (authResponse) return authResponse;

  const payload = parseSpotPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Invalid spot payload" }, { status: 400 });
  }

  const store = await readSpotStore();
  const citySpots = store[payload.cityId] ?? (payload.cityId === "guilin" ? [...guilinDefaultSpots] : []);

  const newSpot: Spot = {
    id: `spot-${payload.cityId}-${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };

  const nextStore = {
    ...store,
    [payload.cityId]: [newSpot, ...citySpots],
  };

  await writeSpotStore(nextStore);

  return NextResponse.json({ spot: newSpot, spots: nextStore[payload.cityId] });
}

// PATCH /api/spots — 管理员编辑地点名称/描述
export async function PATCH(request: NextRequest) {
  const authResponse = requireAdminSession(request);
  if (authResponse) return authResponse;

  const rawPayload = await request.json().catch(() => null);

  if (!isRecord(rawPayload)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { cityId, spotId, name, description, emoji } = rawPayload;

  if (typeof cityId !== "string" || typeof spotId !== "string") {
    return NextResponse.json({ error: "Missing cityId or spotId" }, { status: 400 });
  }

  const store = await readSpotStore();
  const citySpots = store[cityId] ?? (cityId === "guilin" ? [...guilinDefaultSpots] : []);
  const spotIndex = citySpots.findIndex((s) => s.id === spotId);

  if (spotIndex === -1) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  const updatedSpot: Spot = {
    ...citySpots[spotIndex],
    ...(typeof name === "string" && name.trim().length > 0 ? { name: name.trim() } : {}),
    ...(typeof description === "string" ? { description: description.trim() } : {}),
    ...(typeof emoji === "string" ? { emoji: emoji.trim().slice(0, 4) } : {}),
  };

  const nextCitySpots = citySpots.map((s, i) => (i === spotIndex ? updatedSpot : s));
  const nextStore = { ...store, [cityId]: nextCitySpots };

  await writeSpotStore(nextStore);

  return NextResponse.json({ spot: updatedSpot, spots: nextCitySpots });
}

// DELETE /api/spots — 管理员删除地点
export async function DELETE(request: NextRequest) {
  const authResponse = requireAdminSession(request);
  if (authResponse) return authResponse;

  const rawPayload = await request.json().catch(() => null);

  if (!isRecord(rawPayload)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { cityId, spotId } = rawPayload;

  if (typeof cityId !== "string" || typeof spotId !== "string") {
    return NextResponse.json({ error: "Missing cityId or spotId" }, { status: 400 });
  }

  const store = await readSpotStore();
  const citySpots = store[cityId] ?? [];
  const filtered = citySpots.filter((s) => s.id !== spotId);

  if (filtered.length === citySpots.length) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  const nextStore = { ...store, [cityId]: filtered };
  if (filtered.length === 0) delete nextStore[cityId];

  await writeSpotStore(nextStore);

  return NextResponse.json({ spots: filtered });
}
