import { defineMiddleware } from "astro:middleware";

/**
 * Returns true when the MIME type is text-based and should carry charset=utf-8.
 * Covers text/* (html, plain, css, …), XML flavours (image/svg+xml,
 * application/xml, …), JSON, and JavaScript / shell-script types.
 */
function isTextBasedContentType(contentType: string): boolean {
  if (contentType.startsWith("text/")) return true;
  if (contentType.includes("/xml") || contentType.includes("+xml")) return true;
  if (contentType.includes("/json") || contentType.includes("+json")) return true;
  if (contentType.includes("/javascript")) return true;
  if (contentType.includes("/x-sh")) return true;
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const contentType = response.headers.get("content-type");

  // Add charset=utf-8 for text-based content types that don't already specify one
  if (contentType && !contentType.includes("charset") && isTextBasedContentType(contentType)) {
    response.headers.set("content-type", `${contentType}; charset=utf-8`);
  }

  // Disable directory indexing for the configuration page
  const normalizedPath = context.url.pathname.replace(/\/$/, "");
  if (normalizedPath === "/docs/handbook/configuration/configuration") {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
});
