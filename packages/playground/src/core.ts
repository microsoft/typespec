let cachedCompiler: any;
export async function importCadlCompiler(): Promise<typeof import("@cadl-lang/compiler")> {
  if (cachedCompiler === undefined) {
    // We need to do this so the compiler loaded is the same as the one loaded by the bundled libraries.
    const name = "@cadl-lang/compiler";
    cachedCompiler = (await importShim(name)) as any;
  }

  return cachedCompiler;
}

/**
 * Dynamic imports with importmap unfortunately do not work on all browsers.
 * Safari and Firefox lack support https://caniuse.com/import-maps.
 *
 * A polyfill for importmap is loaded but required calling importShim instead of the native import https://github.com/guybedford/es-module-shims
 * @param name Import name.
 * @returns Promise with the loaded module.
 */
export async function importShim(name: string): Promise<unknown> {
  return (window as any).importShim(name);
}
