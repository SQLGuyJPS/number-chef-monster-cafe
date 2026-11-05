// Frames of the M1 static layout mock (D36), shared by the mock screen and its screenshot test.
export const MOCK_FRAMES = [
  'a-s3-frames1',
  'b-frames2',
  'c1-count-together-1',
  'c2-count-together-2',
  'e-taken-away',
  'g1-s0-pad',
  'g2-s0-cloche',
] as const;
export type MockFrame = (typeof MOCK_FRAMES)[number];
