import { normalizeImageDimensions } from '../runware-dimensions';

describe('normalizeImageDimensions', () => {
  it('rounds to multiple of 64', () => {
    expect(normalizeImageDimensions(1000, 600)).toEqual({
      width: 1024,
      height: 576,
    });
  });

  it('clamps to 128-2048', () => {
    expect(normalizeImageDimensions(50, 100)).toEqual({
      width: 128,
      height: 128,
    });
    expect(normalizeImageDimensions(3000, 3000)).toEqual({
      width: 2048,
      height: 2048,
    });
  });

  it('keeps valid dimensions unchanged', () => {
    expect(normalizeImageDimensions(1024, 1024)).toEqual({
      width: 1024,
      height: 1024,
    });
  });
});
