export async function importCadlCompiler(): Promise<typeof import("@cadl-lang/compiler")> {
  // We need to do this so the compiler loaded is the same as the one loaded by the bundled libraries.
  const name = "@cadl-lang/compiler";
  return import(/* @vite-ignore */ name) as any;
}
