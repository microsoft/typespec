export function link(input: string | undefined): string {
  if (input === undefined) {
    return undefined as any;
  }
  if (input[0] === "/") {
    input = input.slice(1);
  }

  if (input[input.length - 1] !== "/") {
    input += "/";
  }
  return import.meta.env.BASE_URL + input;
}
