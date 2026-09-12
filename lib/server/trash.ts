import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getPrivateDataFilePath } from "@/lib/server/dataDir";
import type { Memory } from "@/data/memories";
import type { Spot } from "@/data/spots";

export interface DeletedRecord {
  id: string;
  type: "memory" | "spot";
  cityId: string;
  cityName?: string;
  deletedAt: string;
  data: Memory | Spot;
}

const trashFilePath = getPrivateDataFilePath("deletedRecords.private.json");

export async function readTrashStore(): Promise<DeletedRecord[]> {
  try {
    const file = await readFile(trashFilePath, "utf8");
    const parsed = JSON.parse(file);
    if (Array.isArray(parsed)) return parsed as DeletedRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Failed to read trash store:", error);
    }
  }
  return [];
}

export async function writeTrashStore(records: DeletedRecord[]): Promise<void> {
  await mkdir(path.dirname(trashFilePath), { recursive: true });
  await writeFile(trashFilePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function addToTrash(record: Omit<DeletedRecord, "deletedAt">): Promise<DeletedRecord> {
  const current = await readTrashStore();
  const entry: DeletedRecord = {
    ...record,
    deletedAt: new Date().toISOString(),
  };
  // Prepend so newest deleted is first
  const updated = [entry, ...current.filter((r) => r.id !== record.id)];
  await writeTrashStore(updated);
  return entry;
}

export async function removeFromTrash(id: string): Promise<DeletedRecord | null> {
  const current = await readTrashStore();
  const target = current.find((r) => r.id === id) ?? null;
  if (!target) return null;
  const updated = current.filter((r) => r.id !== id);
  await writeTrashStore(updated);
  return target;
}

export async function clearTrash(): Promise<void> {
  await writeTrashStore([]);
}
