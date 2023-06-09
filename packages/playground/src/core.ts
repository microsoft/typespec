let cachedCompiler: any;
export async function importTypeSpecCompiler(): Promise<typeof import("@typespec/compiler")> {
  if (cachedCompiler === undefined) {
    // We need to do this so the compiler loaded is the same as the one loaded by the bundled libraries.
    const name = "@typespec/compiler";
    cachedCompiler = (await importLibrary(name)) as any;
  }

  return cachedCompiler;
}

/**
 * @param name Import name.
 * @returns Promise with the loaded module.
 */
export async function importLibrary(name: string): Promise<unknown> {
  return import(/* @vite-ignore */ name);
}
