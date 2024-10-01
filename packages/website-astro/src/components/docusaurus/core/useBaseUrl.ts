/* eslint-disable unicorn/filename-case */
export default function useBaseUrl(input: string | undefined): string {
  if (input === undefined) {
    return undefined as any;
  }
  if (input[0] === "/") {
    input = input.slice(1);
  }
  return import.meta.env.BASE_URL + input;
}
