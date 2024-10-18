import { resolve } from "path/posix";

export function resolveBlogImagePath(slug: string, relativeImage: string) {
  return relativeImage && resolve("/src/content/blog/", slug, relativeImage);
}
