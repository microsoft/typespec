import type { PlaygroundSample, PlaygroundTspLibrary } from "../types.js";

/** Well-known emitter tags and which package name patterns they match. */
const emitterTagPatterns: Record<string, (name: string) => boolean> = {
  http: (name) =>
    name === "@typespec/openapi3" || name === "@typespec/openapi" || name.includes("http-client"),
  schema: (name) => name === "@typespec/json-schema",
  grpc: (name) => name === "@typespec/protobuf",
};

/** Resolve the emitter tags for a given package name. */
export function resolveEmitterTags(packageName: string): string[] {
  const tags: string[] = [];
  for (const [tag, matches] of Object.entries(emitterTagPatterns)) {
    if (matches(packageName)) {
      tags.push(tag);
    }
  }
  return tags;
}

/**
 * Check whether a sample is compatible with a given emitter.
 * `compatibleEmitters` entries can be tags (e.g. "http") or exact package names.
 */
export function isSampleCompatibleWithEmitter(
  sample: PlaygroundSample,
  emitterName: string,
  emitterTags: string[],
): boolean {
  const compat = sample.compatibleEmitters;
  if (!compat || compat.length === 0) {
    // No compatibility info — only match by preferredEmitter
    return sample.preferredEmitter === emitterName;
  }

  for (const entry of compat) {
    // Exact package name match
    if (entry === emitterName) return true;
    // Tag match — check if the emitter has this tag
    if (emitterTags.includes(entry)) return true;
  }
  return false;
}

/**
 * Resolve the compatible emitter package names for a sample,
 * expanding tags (e.g. "http") to actual available emitter package names.
 * Returns an array of package names.
 */
export function resolveCompatibleEmitters(
  sample: PlaygroundSample,
  allEmitters: Record<string, PlaygroundTspLibrary>,
): string[] {
  const compat = sample.compatibleEmitters;
  if (!compat || compat.length === 0) {
    return sample.preferredEmitter ? [sample.preferredEmitter] : [];
  }

  const result = new Set<string>();
  const emitterList = Object.values(allEmitters).filter((e) => e.isEmitter);

  for (const entry of compat) {
    if (entry in emitterTagPatterns) {
      // It's a tag — resolve to all matching emitters
      for (const emitter of emitterList) {
        if (emitter.emitterTags.includes(entry)) {
          result.add(emitter.name);
        }
      }
    } else {
      // Exact package name
      if (allEmitters[entry]) {
        result.add(entry);
      }
    }
  }

  return Array.from(result);
}

/** Derives a friendly display name from a TypeSpec emitter package name. */
export function getEmitterDisplayName(packageName: string): string {
  // Strip the @typespec/ or @azure-tools/ prefix
  let name = packageName;
  if (name.startsWith("@typespec/")) {
    name = name.slice("@typespec/".length);
  } else if (name.startsWith("@azure-tools/")) {
    name = name.slice("@azure-tools/".length);
  } else {
    // For unknown scopes, strip everything up to the last /
    const slashIndex = name.lastIndexOf("/");
    if (slashIndex !== -1) {
      name = name.slice(slashIndex + 1);
    }
  }

  // Apply well-known friendly names
  const knownNames: Record<string, string> = {
    openapi3: "OpenAPI 3",
    openapi: "OpenAPI",
    "json-schema": "JSON Schema",
    protobuf: "Protobuf",
    "http-client-js": "JS Client",
    "http-client-csharp": "C# Client",
    "http-client-java": "Java Client",
    "http-client-python": "Python Client",
    streams: "Streams",
    events: "Events",
    sse: "Server-Sent Events",
    xml: "XML",
  };

  if (knownNames[name]) {
    return knownNames[name];
  }

  // Fallback: title-case the hyphenated name
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
