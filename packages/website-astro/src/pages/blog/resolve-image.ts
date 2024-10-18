import { join } from "path/posix";
const allImages = import.meta.glob<{ default: ImageMetadata }>(
  "../..//content/blog/**/*.{png,jpg,jpeg,webp}",
);

export async function resolveBlogImagePath(slug: string, relativeImage: string) {
  const path = join("../../content/blog/", slug, relativeImage);
  const { default: image } = await allImages[path]();

  return image;
}
