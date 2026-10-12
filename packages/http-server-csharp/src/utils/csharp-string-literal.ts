/**
 * A C# regular string literal for a value. JSON escapes are valid in C#, but JSON leaves U+0085,
 * U+2028 and U+2029 unescaped, and C# treats them as line terminators.
 */
export function csharpStringLiteral(value: string): string {
  return JSON.stringify(value).replace(
    /[\u0085\u2028\u2029]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
