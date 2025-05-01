import type { ImageMetadata } from "astro";
import { getCollection } from "astro:content";
import { join, normalize } from "path/posix";

const allImages = import.meta.glob<{ default: ImageMetadata }>(
  "../../content/blog/**/*.{png,jpg,jpeg,webp}",
);

export async function resolveBlogImagePath(
  slug: string,
  relativeImage: string,
): Promise<ImageMetadata> {
  // If no slug provided, we can't resolve the image
  if (!slug) {
    throw new Error(`Cannot resolve image path without a slug`);
  }

  // First, try the direct path using dated directory structure
  // This covers the case where slug is the dated slug OR where slug is the new format but matches a directory name
  const directPath = normalize(join("../../content/blog/", slug, relativeImage));
  let imageImporter = allImages[directPath];

  if (!imageImporter) {
    // If direct path didn't work, try to find the post by slug or redirect_slug
    const posts = await getCollection("blog");

    // Find the post that matches either the slug or redirect_slug
    const post = posts.find(
      (post) => post.data.slug === slug || post.data.redirect_slug === slug || post.slug === slug,
    );

    if (post) {
      // Use the collection entry's id which contains the directory name with date
      // Collection entry id looks like: "2024-04-25-introducing/blog.md"
      const dirWithDate = post.id.split("/")[0];
      const path = normalize(join("../../content/blog/", dirWithDate, relativeImage));
      imageImporter = allImages[path];
    }
  }

  if (!imageImporter) {
    throw new Error(`Image not found for slug "${slug}" and path "${relativeImage}"`);
  }

  const { default: image } = await imageImporter();
  return image;
}
