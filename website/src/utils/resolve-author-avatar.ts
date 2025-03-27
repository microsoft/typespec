// Utility function to resolve author avatar images from the assets directory
const authorAvatars = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/img/authors/*.{png,jpg,jpeg,webp}",
);

export async function resolveAuthorAvatar(avatarPath: string) {
  try {
    const normalizedPath = "../" + avatarPath.replace(/\\/g, "/");
    const imageImporter = authorAvatars[normalizedPath];
    if (!imageImporter) {
      return null;
    }
    const { default: image } = await imageImporter();
    return image;
  } catch (error) {
    return null;
  }
}
