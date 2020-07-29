export function charSize(ch: number) {
  if (ch >= 0x10000) {
    return 2;
  }
  return 1;
}