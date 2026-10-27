import {
  resolveCompilerOptions,
  type CompilerHost,
  type CompilerOptions,
} from "@typespec/compiler";

/**
 * Resolve the compiler options from the library's own `tspconfig.yaml`, so that features it opts
 * into (such as `auto-decorators`) apply when tspd compiles it.
 *
 * tspd only ever inspects a library, so emitting is always disabled.
 */
export async function resolveLibraryCompilerOptions(
  host: CompilerHost,
  entrypoint: string,
): Promise<CompilerOptions> {
  const [options] = await resolveCompilerOptions(host, { cwd: process.cwd(), entrypoint });
  return { ...options, noEmit: true };
}
