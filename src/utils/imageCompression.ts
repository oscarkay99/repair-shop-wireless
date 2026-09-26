const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.82;
// Small enough already — re-encoding would only cost quality.
const SKIP_BELOW_BYTES = 1024 * 1024;

/**
 * Phone camera photos are routinely 4–12MB, over the 5MB repair-media limit,
 * which technicians hit as a rejected upload that blocks the ticket from
 * advancing. Downscale to at most 2048px on the long side and re-encode as
 * JPEG — plenty for repair evidence. Falls back to the original file if the
 * browser can't decode it or the result isn't actually smaller.
 */
export async function shrinkImageForUpload(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.has(file.type) || file.size <= SKIP_BELOW_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]*$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}
