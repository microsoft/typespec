import type { CompilerOptions } from "@typespec/compiler";
import { Uri, editor } from "monaco-editor";
import { resolveVirtualPath } from "../../browser-host.js";
import type { BrowserHost } from "../../types.js";
import type { CompilationState } from "../types.js";

const outputDir = resolveVirtualPath("tsp-output");

export async function compile(
  host: BrowserHost,
  content: string,
  selectedEmitter: string,
  tspconfig: string,
): Promise<CompilationState> {
  await host.writeFile("main.tsp", content);
  await host.writeFile("tspconfig.yaml", tspconfig);
  await emptyOutputDir(host);
  try {
    const typespecCompiler = host.compiler;

    // Resolve the compiler options natively from the tspconfig.yaml so the playground
    // honors the full config (emit, options, linter, imports, warn-as-error, ...).
    const [resolvedOptions] = await typespecCompiler.resolveCompilerOptions(host, {
      cwd: resolveVirtualPath("."),
      entrypoint: resolveVirtualPath("main.tsp"),
    });

    const options: CompilerOptions = {
      ...resolvedOptions,
      options: {
        ...resolvedOptions.options,
        ...(selectedEmitter
          ? {
              [selectedEmitter]: {
                ...resolvedOptions.options?.[selectedEmitter],
                "emitter-output-dir": outputDir,
              },
            }
          : {}),
      },
      outputDir,
    };

    const program = await typespecCompiler.compile(host, resolveVirtualPath("main.tsp"), options);
    const outputFiles = await findOutputFiles(host);
    return { program, outputFiles };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Internal compiler error", error);
    return { internalCompilerError: error };
  }
}

async function findOutputFiles(host: BrowserHost): Promise<string[]> {
  const files: string[] = [];

  async function addFiles(dir: string) {
    const items = await host.readDir(outputDir + dir);
    for (const item of items) {
      const itemPath = `${dir}/${item}`;
      if ((await host.stat(outputDir + itemPath)).isDirectory()) {
        await addFiles(itemPath);
      } else {
        files.push(dir === "" ? item : `${dir}/${item}`);
      }
    }
  }
  await addFiles("");
  return files;
}

async function emptyOutputDir(host: BrowserHost) {
  const dirs = await host.readDir("./tsp-output");
  for (const file of dirs) {
    const path = "./tsp-output/" + file;
    const uri = Uri.parse(host.pathToFileURL(path));
    const model = editor.getModel(uri);
    if (model) {
      model.dispose();
    }
    await host.rm(path, { recursive: true });
  }
}
