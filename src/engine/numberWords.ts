// Child-facing numbers are always spoken as words (CLAUDE.md, SPEC §8.2).

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
] as const;
const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
] as const;

/** 0–100 (the "hundreds edge" is exactly one hundred). US English, hyphenated: "twenty-three". */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100)
    throw new RangeError(`numberToWords: ${n} is outside 0–100`);
  if (n === 100) return 'one hundred';
  if (n < 20) return ONES[n]!;
  const t = TENS[Math.floor(n / 10)]!;
  const o = n % 10;
  return o === 0 ? t : `${t}-${ONES[o]}`;
}

/** Sentence start: "Eight plus …". */
export const capitalize = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
