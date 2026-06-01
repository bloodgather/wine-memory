import { describe, expect, it } from 'vitest';
import { MAX_DRINK_PHOTO_BYTES, validateImageFile } from '../utils/image';

describe('image utilities', () => {
  it('accepts image files under the size limit', () => {
    expect(() => validateImageFile({ type: 'image/jpeg', size: 1024 })).not.toThrow();
  });

  it('rejects non-image files', () => {
    expect(() => validateImageFile({ type: 'text/plain', size: 1024 })).toThrow('请选择图片文件');
  });

  it('rejects files above the size limit', () => {
    expect(() => validateImageFile({ type: 'image/png', size: MAX_DRINK_PHOTO_BYTES + 1 })).toThrow('图片太大');
  });
});
