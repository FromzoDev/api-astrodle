// Minimal valid 1x1 transparent PNG, used to exercise file-upload endpoints
// without shipping a binary fixture file.
const ONE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export function pngBuffer(): Buffer {
  return Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64');
}

export function textBuffer(): Buffer {
  return Buffer.from('this is not an image', 'utf-8');
}
