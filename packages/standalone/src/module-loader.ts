import type { LoadHookSync, ResolveHookSync } from "node:module";
import { registerHooks } from "node:module";

// In-memory module serving.
//
// Modules baked into this single-executable as SEA assets are just strings in memory, so
// `registerHooks` (`ensureHooks` + `serveFromMemory`) teaches the module loader to resolve our
// synthetic URLs to those sources. This is inherent to shipping a self-contained executable.

export interface MemoryModule {
  readonly format: "commonjs" | "module";
  readonly source: string;
}

const memoryModules = new Map<string, MemoryModule>();
const specifierToUrl = new Map<string, string>();

let hooksRegistered = false;

/** Register the module hooks that serve {@link memoryModules} from memory (idempotent). */
function ensureHooks() {
  if (hooksRegistered) return;
  const resolve: ResolveHookSync = (spec, context, next) => {
    const url = specifierToUrl.get(spec);
    if (url !== undefined) {
      return { url, format: memoryModules.get(url)!.format, shortCircuit: true };
    }
    return next(spec, context);
  };
  const load: LoadHookSync = (url, context, next) => {
    const mod = memoryModules.get(url);
    if (mod !== undefined) {
      return { format: mod.format, source: mod.source, shortCircuit: true };
    }
    return next(url, context);
  };
  registerHooks({ resolve, load });
  hooksRegistered = true;
}

/**
 * Register a module to be served from memory under a synthetic specifier/URL. Serving it under a
 * short synthetic `file://` URL (rather than a `data:` URL) keeps stack traces readable: a `data:`
 * URL would embed the entire multi-megabyte source into every stack frame.
 */
export function serveFromMemory(specifier: string, url: string, module: MemoryModule) {
  ensureHooks();
  specifierToUrl.set(specifier, url);
  memoryModules.set(url, module);
}
