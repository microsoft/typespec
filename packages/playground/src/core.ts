/**
 * Options for importing libraries.
 */
export interface LibraryImportOptions {
  /**
   * Should use es-module-shim importmap-shim instead of built-in import and importmap system.
   * @see https://github.com/guybedford/es-module-shims
   */
  useShim?: boolean;
}

export async function importTypeSpecCompiler(
  config: LibraryImportOptions,
): Promise<typeof import("@typespec/compiler")> {
  return (await importLibrary("@typespec/compiler", config)) as any;
}

/**
 * @param name Import name.
 * @returns Promise with the loaded module.
 */
export async function importLibrary(name: string, config: LibraryImportOptions): Promise<unknown> {
  return config.useShim
    ? importShim(name)
    : import(/* @vite-ignore */ /* webpackIgnore: true */ name);
}

/**
 * Loading external import map doesn't work yet
 *
 * https://github.com/WICG/import-maps/issues/235
 *
 * A polyfill for importmap is loaded but required calling importShim instead of the native import https://github.com/guybedford/es-module-shims
 * @param name Import name.
 * @returns Promise with the loaded module.
 */
async function importShim(name: string): Promise<unknown> {
  return (window as any).importShim(name);
}
