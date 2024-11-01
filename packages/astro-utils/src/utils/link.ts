export function link(input: string | undefined): string {
  if (input === undefined) {
    return undefined as any;
  }
  const href = input[0] === "/" ? import.meta.env.BASE_URL + input.slice(1) : input;
  const hrefWithTrailingSlash = href[href.length - 1] === "/" ? href : href + "/";
  return hrefWithTrailingSlash;
}
