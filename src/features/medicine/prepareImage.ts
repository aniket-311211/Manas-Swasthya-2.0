/**
 * Getting a phone photo into a request without wasting anyone's time.
 *
 * A modern phone camera produces a 4–12 MB JPEG. The old page read that
 * straight to base64 and posted it, which is a third larger again, so a single
 * check could push 16 MB up a hostel wifi connection — and the model gets
 * nothing from resolution beyond the point where the print on the strip is
 * legible.
 *
 * So: downscale to fit MAX_EDGE, re-encode as JPEG, and only then hand it over.
 * Typically ~200 KB. This also normalises HEIC-ish inputs that the browser can
 * decode but Gemini will not accept, because the canvas re-encode always
 * produces a JPEG whatever went in.
 */

/** Long edge, in pixels. Enough to read a foil strip; far below a raw photo. */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

/** Refused before any of the work happens. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export class ImageError extends Error {}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageError('That file could not be opened as an image.'));
    img.src = src;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageError('That file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export interface PreparedImage {
  /** `data:image/jpeg;base64,…`, ready to post. */
  dataUrl: string;
  /** Same string, for showing the user what they sent. */
  preview: string;
  bytes: number;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Pick a photo — a JPEG, PNG or WebP.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError('That photo is enormous. Try one under 15 MB.');
  }

  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // No canvas: send the original rather than failing outright. The server
    // still checks the magic bytes, so this cannot smuggle a non-image through.
    return { dataUrl: original, preview: original, bytes: file.size };
  }

  // White underneath, so a transparent PNG does not flatten to black and hide
  // the text we are asking the model to read.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  return {
    dataUrl,
    preview: dataUrl,
    // Base64 carries 3 bytes per 4 characters, minus any padding.
    bytes: Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4),
  };
}
