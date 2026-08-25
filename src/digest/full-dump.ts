import { SaveGame } from "../save-structure/save-game";

export interface FullDumpOptions {
  /**
   * Include the simulation blob as base64. It is megabytes of opaque data this
   * parser never interprets, so it is omitted by default.
   */
  includeSim?: boolean;
}

/**
 * The whole parsed model, with binary values replaced by
 * `{ $binary: "<base64>", length }` so the result survives JSON.stringify.
 */
export function buildFullDump(
  save: SaveGame,
  options: FullDumpOptions = {}
): unknown {
  const { simData, ...rest } = save;
  return encodeBinaries({
    ...rest,
    simData: options.includeSim
      ? simData
      : { $omitted: "simData", length: simData.byteLength },
  });
}

export function encodeBinaries(value: unknown): unknown {
  if (value instanceof ArrayBuffer) {
    return {
      $binary: Buffer.from(value).toString("base64"),
      length: value.byteLength,
    };
  }
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    return {
      $binary: Buffer.from(
        view.buffer,
        view.byteOffset,
        view.byteLength
      ).toString("base64"),
      length: view.byteLength,
    };
  }
  if (Array.isArray(value)) {
    return value.map(encodeBinaries);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = encodeBinaries(child);
    }
    return out;
  }
  return value;
}
