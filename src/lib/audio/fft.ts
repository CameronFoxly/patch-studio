/**
 * Pure-JS radix-2 Cooley-Tukey FFT and helpers for offline spectrum analysis.
 *
 * Produces output compatible with Web Audio's AnalyserNode.getByteFrequencyData()
 * so the existing drawGrid() visualiser can consume it directly.
 */

const MIN_DECIBELS = -90;
const MAX_DECIBELS = -10;
const DB_RANGE = MAX_DECIBELS - MIN_DECIBELS;

/** Pre-computed Hann window (lazily allocated per size). */
const hannCache = new Map<number, Float32Array>();

function getHannWindow(size: number): Float32Array {
  let w = hannCache.get(size);
  if (w) return w;
  w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  hannCache.set(size, w);
  return w;
}

/** Bit-reversal permutation index. */
function reverseBits(x: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (x & 1);
    x >>= 1;
  }
  return result;
}

/**
 * In-place iterative radix-2 FFT.
 * @param re - real parts (modified in place)
 * @param im - imaginary parts (modified in place)
 */
function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  const bits = Math.log2(n) | 0;

  // Bit-reversal permutation
  for (let i = 0; i < n; i++) {
    const j = reverseBits(i, bits);
    if (j > i) {
      let tmp = re[i];
      re[i] = re[j];
      re[j] = tmp;
      tmp = im[i];
      im[i] = im[j];
      im[j] = tmp;
    }
  }

  // Butterfly stages
  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const step = (2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < halfSize; k++) {
        const angle = -step * k;
        const twRe = Math.cos(angle);
        const twIm = Math.sin(angle);

        const evenIdx = i + k;
        const oddIdx = i + k + halfSize;

        const tRe = twRe * re[oddIdx] - twIm * im[oddIdx];
        const tIm = twRe * im[oddIdx] + twIm * re[oddIdx];

        re[oddIdx] = re[evenIdx] - tRe;
        im[oddIdx] = im[evenIdx] - tIm;
        re[evenIdx] = re[evenIdx] + tRe;
        im[evenIdx] = im[evenIdx] + tIm;
      }
    }
  }
}

/**
 * Compute FFT magnitude spectrum at a given sample offset.
 *
 * @param samples    - full audio buffer (Float32Array, values in -1..1)
 * @param fftSize    - FFT window size (must be power of 2, e.g. 4096)
 * @param offset     - sample index for the centre of the analysis window
 * @returns Uint8Array of length fftSize/2 with values 0–255 (byte frequency data)
 */
export function computeFFT(
  samples: Float32Array,
  fftSize: number,
  offset: number,
): Uint8Array {
  const halfSize = fftSize / 2;
  const result = new Uint8Array(halfSize);

  // Extract windowed segment
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const hann = getHannWindow(fftSize);

  const start = offset - halfSize;
  for (let i = 0; i < fftSize; i++) {
    const idx = start + i;
    const sample = idx >= 0 && idx < samples.length ? samples[idx] : 0;
    re[i] = sample * hann[i];
  }

  fftInPlace(re, im);

  // Convert to magnitude (dB) → byte (0–255)
  for (let i = 0; i < halfSize; i++) {
    const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / halfSize;
    const db = mag > 0 ? 20 * Math.log10(mag) : MIN_DECIBELS;
    const clamped = Math.max(MIN_DECIBELS, Math.min(MAX_DECIBELS, db));
    result[i] = Math.round(((clamped - MIN_DECIBELS) / DB_RANGE) * 255);
  }

  return result;
}
