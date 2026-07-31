import { readFile, readdir } from "fs/promises";
import { dirname, join, relative } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { describe, expect, it } from "vitest";
import type { LoadedPlaygroundTspLibrary } from "../src/browser-host.js";
import { createBrowserHostInternal, resolveVirtualPath } from "../src/browser-host.js";

const compilerRoot = dirname(
  fileURLToPath(await import.meta.resolve!("@typespec/compiler/package.json")),
);

async function collectFiles(dir: string, root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, await collectFiles(full, root));
    } else if (entry.name.endsWith(".tsp")) {
      result[relative(root, full).replaceAll("\\", "/")] = await readFile(full, "utf8");
    }
  }
  return result;
}

/** Build a bundle-shaped payload for the real on-disk compiler package. */
async function realCompilerLibrary(
  compiler: typeof import("@typespec/compiler"),
): Promise<LoadedPlaygroundTspLibrary> {
  const packageJson = await readFile(join(compilerRoot, "package.json"), "utf8");
  return {
    name: "@typespec/compiler",
    isEmitter: false,
    packageJson: JSON.parse(packageJson),
    _TypeSpecLibrary_: {
      typespecSourceFiles: {
        "package.json": packageJson,
        ...(await collectFiles(join(compilerRoot, "lib"), compilerRoot)),
      },
      jsSourceFiles: {
        [JSON.parse(packageJson).main]: compiler,
        // The std library `.tsp` files reference these for their extern decorator implementations.
        ...Object.fromEntries(
          await Promise.all(
            ["dist/src/lib/tsp-index.js", "dist/src/lib/intrinsic/tsp-index.js"].map(
              async (path) =>
                [
                  path,
                  await import(/* @vite-ignore */ pathToFileURL(join(compilerRoot, path)).href),
                ] as const,
            ),
          ),
        ),
      },
    },
  };
}

/** A minimal emitter in the shape the playground bundler produces. */
function fakeEmitterLibrary(
  name: string,
  onEmit: (outputDir: string) => void,
): LoadedPlaygroundTspLibrary {
  const packageJson = JSON.stringify({ name, version: "1.0.0", main: "index.js" });
  return {
    name,
    isEmitter: true,
    packageJson: JSON.parse(packageJson),
    _TypeSpecLibrary_: {
      typespecSourceFiles: { "package.json": packageJson },
      jsSourceFiles: {
        "index.js": {
          $onEmit: async (context: any) => {
            onEmit(context.emitterOutputDir);
            await context.program.host.writeFile(
              join(context.emitterOutputDir, "out.txt"),
              "emitted",
            );
          },
        },
      },
    },
  };
}

describe("compiling with a deferred emitter", () => {
  it("runs an emitter that was imported after the host was created", async () => {
    const compiler = await import("@typespec/compiler");
    let emitted = 0;
    let emitterOutputDir: string | undefined;
    const emitterName = "@test/deferred-emitter";

    const host = createBrowserHostInternal({
      compiler,
      libraries: { "@typespec/compiler": await realCompilerLibrary(compiler) },
      deferredLibraries: {
        [emitterName]: async () =>
          fakeEmitterLibrary(emitterName, (dir) => {
            emitted++;
            emitterOutputDir = dir;
          }),
      },
    });

    await host.writeFile("main.tsp", "model Foo { name: string }");

    // The emitter is advertised but not imported yet, so the compiler cannot resolve it.
    const before = await compiler.compile(host, resolveVirtualPath("main.tsp"), {
      emit: [emitterName],
      outputDir: resolveVirtualPath("tsp-output"),
    });
    expect(before.diagnostics.map((x) => x.code)).toContain("import-not-found");
    expect(emitted).toBe(0);

    await host.loadLibrary(emitterName);

    const after = await compiler.compile(host, resolveVirtualPath("main.tsp"), {
      emit: [emitterName],
      outputDir: resolveVirtualPath("tsp-output"),
    });
    expect(after.diagnostics.map((x) => `${x.code}: ${x.message}`)).toEqual([]);
    expect(emitted).toBe(1);
    expect((await host.readFile(join(emitterOutputDir!, "out.txt"))).text).toEqual("emitted");
  });
});
