import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const contentType = response.headers.get("content-type");

  // Set charset=utf-8 for all HTML responses
  if (contentType?.includes("text/html")) {
    response.headers.set("content-type", "text/html; charset=utf-8");
  }

  // Disable directory indexing for the configuration page
  const normalizedPath = context.url.pathname.replace(/\/$/, "");
  if (normalizedPath === "/docs/handbook/configuration/configuration") {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
});
