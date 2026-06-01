export const MAX_DRINK_PHOTO_EDGE = 1200;
export const MAX_DRINK_PHOTO_BYTES = 12 * 1024 * 1024;
export const DRINK_PHOTO_QUALITY = 0.82;

interface CompressOptions {
  maxEdge?: number;
  quality?: number;
}

export function validateImageFile(file: Pick<File, 'type' | 'size'>): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  if (file.size > MAX_DRINK_PHOTO_BYTES) {
    throw new Error('图片太大，请选择 12MB 以内的照片');
  }
}

export async function compressDrinkPhoto(file: File, options: CompressOptions = {}): Promise<string> {
  validateImageFile(file);
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxEdge = options.maxEdge ?? MAX_DRINK_PHOTO_EDGE;
  const quality = options.quality ?? DRINK_PHOTO_QUALITY;
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('当前浏览器无法处理图片');
  }

  context.fillStyle = '#fff9f1';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvasToDataUrl(canvas, quality);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片解析失败，请换一张照片'));
    image.src = src;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  if (!canvas.toBlob) {
    return Promise.resolve(canvas.toDataURL('image/jpeg', quality));
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('图片压缩失败'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('图片压缩失败'));
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}
