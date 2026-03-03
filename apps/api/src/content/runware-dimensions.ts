const WIDTH_HEIGHT_MIN = 128;
const WIDTH_HEIGHT_MAX = 2048;
const STEP = 64;

function div64(n: number): number {
  return Math.round(n / STEP) * STEP;
}

/**
 * Normalize width/height to Runware requirement (multiple of 64, within 128–2048).
 */
export function normalizeImageDimensions(
  width: number,
  height: number,
): { width: number; height: number } {
  const w = Math.max(
    WIDTH_HEIGHT_MIN,
    Math.min(WIDTH_HEIGHT_MAX, div64(width)),
  );
  const h = Math.max(
    WIDTH_HEIGHT_MIN,
    Math.min(WIDTH_HEIGHT_MAX, div64(height)),
  );
  return { width: w, height: h };
}
