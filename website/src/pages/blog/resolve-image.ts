import { join, normalize } from "path/posix";

const allImages = import.meta.glob<{ default: ImageMetadata }>(
  "../../content/blog/**/*.{png,jpg,jpeg,webp}",
);

export async function resolveBlogImagePath(slug: string, relativeImage: string) {
  const path = normalize(join("../../content/blog/", slug, relativeImage));

  const imageImporter = allImages[path];

  if (!imageImporter) {
    throw new Error(`Image not found: ${path}`);
  }

  const { default: image } = await imageImporter();

  return image;
}
