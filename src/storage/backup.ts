// Export, Replace import and Reset (SPEC §11.6, D44, D136). The export is the whole event log plus
// this device's settings; restore replaces this device's log and settings with the file's; reset
// empties every store but `snapshots`. Each writes a snapshot of the current data first.
import { z } from 'zod';
import type { Evt } from '../engine/events';
import { balance, replay } from '../engine/replay';
import { migrateEvents, SCHEMA_VERSION, UnknownSchemaVersionError } from './migrations';
import type { Snapshot, Storage } from './types';

export const APP_ID = 'number-chef-monster-cafe';

z.config({ jitless: true }); // CSP has no 'unsafe-eval' (see engine/resume.ts)

const SKILLS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4'] as const;
const skill = z.enum(SKILLS);
const stage = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
const base = { id: z.string().min(1), t: z.number().finite(), dev: z.string(), v: z.number().int() };

/** Every event kind schemaVersion 2 writes (SPEC §11.2; `known` and `focus` come in M7). */
export const eventSchema = z.discriminatedUnion('k', [
  z.object({
    ...base,
    k: z.literal('attempt'),
    svc: z.string(),
    fact: z.string(),
    skill,
    stage,
    outcome: z.enum(['first', 'afterHint', 'fixed', 'assisted']),
    ms: z.number().nonnegative(),
  }),
  z.object({ ...base, k: z.literal('coin'), svc: z.string(), n: z.number().int().nonnegative() }),
  z.object({
    ...base,
    k: z.literal('serviceEnd'),
    svc: z.string(),
    skill,
    seed: z.number(),
    orders: z.number().int().nonnegative(),
    served: z.number().int().nonnegative(),
    tip: z.number().int().nonnegative(),
    activeMs: z.number().nonnegative(),
    partial: z.boolean(),
  }),
  z.object({ ...base, k: z.literal('skillConfig'), skill, stage, ops: z.enum(['both', 'add', 'sub']) }),
  z.object({ ...base, k: z.literal('buy'), item: z.string(), price: z.number().int().nonnegative() }),
  z.object({ ...base, k: z.literal('equip'), slot: z.string(), items: z.array(z.string()) }),
  z.object({
    ...base,
    k: z.literal('crate'),
    n: z.number().int().positive(),
    next: z.number().int().nonnegative(),
  }),
]);

const fileSchema = z.object({
  app: z.literal(APP_ID),
  schemaVersion: z.number().int().min(1),
  deviceId: z.string(),
  deviceLabel: z.string(),
  exportedAt: z.number(),
  events: z.array(z.unknown()),
  settings: z.record(z.string(), z.unknown()),
  checksum: z.string(),
});

export interface ExportFile {
  app: typeof APP_ID;
  schemaVersion: number;
  deviceId: string;
  deviceLabel: string;
  exportedAt: number;
  events: Evt[];
  settings: Record<string, unknown>;
  checksum: string;
}

/**
 * Hex SHA-256 (SubtleCrypto) of `JSON.stringify({ events, settings })`, the two fields as they
 * appear in the file (D136). Import hashes the parsed file's own values, so key order is kept.
 */
export async function checksumOf(events: readonly unknown[], settings: Record<string, unknown>): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify({ events, settings }));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** `number-chef-backup-YYYY-MM-DD.json`, in local time (D136). */
export function exportFileName(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `number-chef-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export async function buildExport(
  storage: Storage,
  deviceId: string,
  now: number,
): Promise<{ file: ExportFile; json: string; name: string }> {
  const [events, settings, label] = await Promise.all([
    storage.loadEvents(),
    storage.allSettings(),
    storage.getMeta('deviceLabel'),
  ]);
  const file: ExportFile = {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    deviceId,
    deviceLabel: label ?? '',
    exportedAt: now,
    events,
    settings,
    checksum: await checksumOf(events, settings),
  };
  return { file, json: JSON.stringify(file), name: exportFileName(now) };
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export interface ParsedImport {
  events: Evt[];
  settings: Record<string, unknown>;
  checksumOk: boolean;
  deviceLabel: string;
  exportedAt: number;
  /** First and last event time, for the summary; null for an empty log. */
  span: { from: number; to: number } | null;
  coins: number;
}

const NOT_A_BACKUP = "This file isn't a Number Chef backup.";

/**
 * Reads a backup file (SPEC §11.6): JSON, the header by zod, a newer schema refused, an older one
 * upcast through the migrations, then every event by zod. The checksum is compared, not enforced:
 * the caller asks twice before using a file whose checksum does not match.
 */
export async function parseImport(text: string): Promise<ParsedImport> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError(NOT_A_BACKUP);
  }
  const head = fileSchema.safeParse(raw);
  if (!head.success) throw new ImportError(NOT_A_BACKUP);
  const f = head.data;
  if (f.schemaVersion > SCHEMA_VERSION) {
    throw new ImportError(
      `${new UnknownSchemaVersionError(f.schemaVersion, SCHEMA_VERSION).message} Update the game on this device first.`,
    );
  }
  // Hash the file's own values (before zod or migrations touch them).
  const checksumOk = (await checksumOf(f.events, f.settings)) === f.checksum;
  const upcast = migrateEvents(f.events, f.schemaVersion);
  const byId = new Map<string, Evt>();
  for (const e of upcast) {
    const r = eventSchema.safeParse(e);
    if (!r.success) throw new ImportError(`${NOT_A_BACKUP} (an entry in it is damaged)`);
    byId.set(r.data.id, r.data as Evt);
  }
  const events = [...byId.values()].sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    events,
    settings: f.settings,
    checksumOk,
    deviceLabel: f.deviceLabel,
    exportedAt: f.exportedAt,
    span: events.length ? { from: events[0]!.t, to: events[events.length - 1]!.t } : null,
    coins: balance(replay(events)),
  };
}

/** The latest full copy of this device's data (SPEC §11.3), written before a replace or reset. */
export async function takeSnapshot(
  storage: Storage,
  deviceId: string,
  reason: Snapshot['reason'],
  now: number,
): Promise<void> {
  const [events, settings] = await Promise.all([storage.loadEvents(), storage.allSettings()]);
  await storage.putSnapshot({ takenAt: now, reason, schemaVersion: SCHEMA_VERSION, deviceId, events, settings });
}

/** Replace import (SPEC §11.6): snapshot first, then the file's events and settings replace ours. */
export async function replaceFromImport(storage: Storage, deviceId: string, imp: ParsedImport, now: number): Promise<void> {
  await takeSnapshot(storage, deviceId, 'replace', now);
  await storage.replaceData(imp.events, imp.settings);
}

/** Reset (SPEC §11.6, D44): snapshot first, then every store but `snapshots` is emptied. */
export async function resetAll(storage: Storage, deviceId: string, now: number): Promise<void> {
  await takeSnapshot(storage, deviceId, 'reset', now);
  await storage.wipeExceptSnapshots();
}
