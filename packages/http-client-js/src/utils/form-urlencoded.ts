export const FORM_URL_ENCODED_MEDIA_TYPE = "application/x-www-form-urlencoded";

/** True when the media type is `application/x-www-form-urlencoded`, ignoring parameters such as charset. */
export function isFormUrlEncodedContentType(contentType: string | undefined): boolean {
  if (!contentType) {
    return false;
  }
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
  return mediaType === FORM_URL_ENCODED_MEDIA_TYPE;
}
