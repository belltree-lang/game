const DEFAULT_BASE_WIDTH = 320;
const DEFAULT_BASE_HEIGHT = 640;

function getFallbackDimensions(baseWidth, baseHeight) {
  return {
    width: baseWidth ?? DEFAULT_BASE_WIDTH,
    height: baseHeight ?? DEFAULT_BASE_HEIGHT,
  };
}

/**
 * Resize a canvas element so that its internal drawing buffer matches the
 * rendered size defined by CSS. Returns metrics about the resulting size.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} [baseWidth=DEFAULT_BASE_WIDTH]
 * @param {number} [baseHeight=DEFAULT_BASE_HEIGHT]
 * @returns {{ width: number, height: number, scale: number }}
 */
export function resizeCanvasToDisplaySize(
  canvas,
  baseWidth = DEFAULT_BASE_WIDTH,
  baseHeight = DEFAULT_BASE_HEIGHT,
) {
  if (!canvas) {
    return { width: 0, height: 0, scale: 1 };
  }

  const fallback = getFallbackDimensions(baseWidth, baseHeight);
  const displayWidth = Math.round(canvas.clientWidth || fallback.width);
  const displayHeight = Math.round(canvas.clientHeight || fallback.height);

  if (canvas.width !== displayWidth) {
    canvas.width = displayWidth;
  }
  if (canvas.height !== displayHeight) {
    canvas.height = displayHeight;
  }

  const width = canvas.width;
  const height = canvas.height;
  const scaleX = width / fallback.width;
  const scaleY = height / fallback.height;
  const scale = Number.isFinite(scaleX) ? Math.min(scaleX, scaleY) : 1;

  return { width, height, scale };
}
