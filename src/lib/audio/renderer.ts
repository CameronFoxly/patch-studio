import { renderToBuffer, renderToWav } from "@web-kits/audio";
import { Mp3Encoder } from "lamejs";
import { layersToSoundDefinition } from "./engine";
import type { Layer } from "@/lib/types";
import type { Effect } from "@/lib/types";

export interface AudioExportOptions {
  duration: number;
  sampleRate: number;
  bitrate?: number; // MP3 only, kbps
}

export async function renderToWavBlob(
  layers: Layer[],
  globalEffects: Effect[] | undefined,
  options: AudioExportOptions,
): Promise<Blob> {
  const definition = layersToSoundDefinition(layers, globalEffects);
  if (!definition) throw new Error("No active layers to render");

  return renderToWav(definition as Parameters<typeof renderToWav>[0], {
    duration: options.duration,
    sampleRate: options.sampleRate,
    numberOfChannels: 2,
  });
}

export async function renderToMp3Blob(
  layers: Layer[],
  globalEffects: Effect[] | undefined,
  options: AudioExportOptions,
): Promise<Blob> {
  const definition = layersToSoundDefinition(layers, globalEffects);
  if (!definition) throw new Error("No active layers to render");

  const buffer = await renderToBuffer(
    definition as Parameters<typeof renderToBuffer>[0],
    {
      duration: options.duration,
      sampleRate: options.sampleRate,
      numberOfChannels: 2,
    },
  );

  return encodeBufferToMp3(buffer, options.bitrate ?? 192);
}

function encodeBufferToMp3(buffer: AudioBuffer, kbps: number): Blob {
  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);

  const left = floatTo16Bit(buffer.getChannelData(0));
  const right = channels > 1
    ? floatTo16Bit(buffer.getChannelData(1))
    : left;

  const blockSize = 1152;
  const parts: ArrayBuffer[] = [];

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right.subarray(i, i + blockSize);
    const encoded = encoder.encodeBuffer(leftChunk, rightChunk);
    if (encoded.length > 0) {
      const copy = new ArrayBuffer(encoded.byteLength);
      new Uint8Array(copy).set(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength));
      parts.push(copy);
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    const copy = new ArrayBuffer(flushed.byteLength);
    new Uint8Array(copy).set(new Uint8Array(flushed.buffer, flushed.byteOffset, flushed.byteLength));
    parts.push(copy);
  }

  return new Blob(parts, { type: "audio/mpeg" });
}

function floatTo16Bit(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
