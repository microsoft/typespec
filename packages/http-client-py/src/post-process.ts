import fs from "fs";
import path, { dirname } from "path";
import type { PyodideInterface } from "pyodide";
import { fileURLToPath } from "url";

/**
 * Pyodide version to load. Pinned to match the version shipped with the
 * existing `@typespec/http-client-python` emitter for behavioral parity.
 */
export const PYODIDE_VERSION = "0.26.2";

/**
 * Directories (relative to the package root) that should be excluded from
 * black formatting and pylint linting. Mirrors `blackExcludeDirs` from
 * `@typespec/http-client-python/emitter/src/constants.ts` so generated samples
 * or vendored content don't get rewritten.
 */
export const DEFAULT_EXCLUDE_DIRS = [
  "__pycache__/",
  "node_modules/",
  "venv/",
  "env/",
  ".direnv",
  ".eggs",
  ".git",
  ".hg",
  ".tox",
  ".venv",
  ".mypy_cache",
  ".pytest_cache",
  ".vscode",
  ".*_build/",
  "/build/",
  "dist",
  ".nox",
  ".svn",
  "TempTypeSpecFiles/",
];

/**
 * Options accepted by {@link postProcessPython}.
 */
export interface PostProcessOptions {
  /**
   * Whether to run `black` to format every `.py` file. Defaults to `true`.
   */
  format?: boolean;
  /**
   * Whether to inject `pylint: disable=line-too-long,too-many-lines` headers
   * into files that exceed those limits, matching the behavior of the
   * existing Python emitter. Defaults to `true`.
   */
  pylintHeader?: boolean;
  /**
   * Maximum line length passed to `black --line-length`. Defaults to `120`.
   */
  lineLength?: number;
  /**
   * Additional directories (relative to `outputDir`) to exclude from
   * formatting. These are joined with {@link DEFAULT_EXCLUDE_DIRS}.
   */
  excludeDirs?: string[];
  /**
   * Function used to log progress and errors. Defaults to `console.log`.
   */
  log?: (message: string) => void;
}

/**
 * Walks `outputDir`, lists every `.py` file outside the excluded directories,
 * and returns the relative paths.
 */
function listPythonFiles(outputDir: string, excludeDirs: string[]): string[] {
  const result: string[] = [];
  const stack: string[] = [outputDir];
  const excludeRegex = new RegExp(excludeDirs.map((d) => escapeRegex(d)).join("|"));

  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      const rel = "/" + path.relative(outputDir, full).split(path.sep).join("/") + "/";
      if (excludeRegex.test(rel)) {
        continue;
      }
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".py")) {
        result.push(full);
      }
    }
  }
  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Loads Pyodide using the local copy installed under `node_modules/pyodide`.
 * Mounts `outputDir` into the Pyodide MEMFS so `black` can read/write files
 * directly without an extra copy step.
 */
async function loadPyodideForPostProcess(outputDir: string): Promise<PyodideInterface> {
  const { loadPyodide } = await import("pyodide");
  const pyodide = await loadPyodide({
    indexURL: dirname(fileURLToPath(import.meta.resolve("pyodide"))),
  });
  pyodide.FS.mkdirTree("/work");
  pyodide.FS.mount(pyodide.FS.filesystems.NODEFS, { root: outputDir }, "/work");
  await pyodide.loadPackage("micropip");
  return pyodide;
}

/**
 * Inside Pyodide, install `black` (and its small dependency closure) via
 * micropip. We tolerate version drift — if a pinned wheel isn't available
 * for the current Pyodide build, micropip falls back to the most recent
 * compatible release.
 */
async function installBlack(pyodide: PyodideInterface): Promise<void> {
  const micropip = pyodide.pyimport("micropip");
  await micropip.install("black");
}

/**
 * Runs `black` over every `.py` file under `/work` in the Pyodide MEMFS,
 * using the same line-length and "fast" settings as the existing Python
 * emitter so the output is bytewise consistent across the two emitters.
 */
async function runBlack(
  pyodide: PyodideInterface,
  lineLength: number,
  excludePattern: string,
): Promise<void> {
  await pyodide.runPythonAsync(`
import os, re, black
mode = black.Mode(line_length=${lineLength})
exclude = re.compile(${JSON.stringify(excludePattern)})
for root, _dirs, files in os.walk("/work"):
    for name in files:
        if not name.endswith(".py"):
            continue
        full = os.path.join(root, name)
        rel = "/" + os.path.relpath(full, "/work").replace(os.sep, "/") + "/"
        if exclude.search(rel):
            continue
        try:
            black.format_file_in_place(
                src=black.Path(full),
                fast=True,
                mode=mode,
                write_back=black.WriteBack.YES,
            )
        except Exception as exc:
            print(f"black: skipped {full}: {exc}")
`);
}

/**
 * Adds `# pylint: disable=line-too-long,too-many-lines` headers to files that
 * exceed pylint's defaults, so downstream pylint runs against the generated
 * code don't produce noise the user can't fix. Mirrors the behavior of the
 * existing `@typespec/http-client-python` emitter.
 */
function injectPylintHeaders(files: string[], log: (m: string) => void): void {
  for (const filePath of files) {
    let fileContent: string;
    try {
      fileContent = fs.readFileSync(filePath, "utf-8");
    } catch (e: any) {
      log(`pylint-header: skipped ${filePath}: ${e?.message ?? e}`);
      continue;
    }
    const lineEnding = fileContent.includes("\r\n") ? "\r\n" : "\n";
    const lines = fileContent.split(lineEnding);
    const pylintDisables: string[] = [];

    if (lines.length === 0) continue;

    if (!lines[0].includes("line-too-long") && lines.some((l) => l.length > 120)) {
      pylintDisables.push("line-too-long", "useless-suppression");
    }
    if (!lines[0].includes("too-many-lines") && lines.length > 1000) {
      pylintDisables.push("too-many-lines");
    }
    if (pylintDisables.length === 0) continue;

    const updated = lines[0].includes("pylint: disable=")
      ? [lines[0] + "," + pylintDisables.join(",")].concat(lines.slice(1)).join(lineEnding)
      : `# pylint: disable=${pylintDisables.join(",")}${lineEnding}` + fileContent;

    fs.writeFileSync(filePath, updated);
  }
}

/**
 * Runs `black` and (optionally) `pylint` header injection against every
 * Python file under `outputDir`.
 *
 * Pyodide is loaded lazily — the first call to this function pays the
 * ~one-time cost of bootstrapping a Python VM in WASM, but subsequent files
 * are formatted in-process without spawning external interpreters.
 */
export async function postProcessPython(
  outputDir: string,
  options: PostProcessOptions = {},
): Promise<void> {
  const log = options.log ?? ((m) => process.stdout.write(`${m}\n`));
  const format = options.format ?? true;
  const pylintHeader = options.pylintHeader ?? true;
  const lineLength = options.lineLength ?? 120;
  const excludeDirs = [...DEFAULT_EXCLUDE_DIRS, ...(options.excludeDirs ?? [])];

  if (!fs.existsSync(outputDir)) {
    log(`post-process: skipped (output dir does not exist): ${outputDir}`);
    return;
  }

  if (format) {
    log("post-process: loading pyodide...");
    const pyodide = await loadPyodideForPostProcess(outputDir);
    log("post-process: installing black...");
    await installBlack(pyodide);
    log("post-process: running black...");
    const excludePattern = excludeDirs.map((d) => escapeRegex(d)).join("|");
    await runBlack(pyodide, lineLength, excludePattern);
  }

  if (pylintHeader) {
    log("post-process: injecting pylint headers...");
    const files = listPythonFiles(outputDir, excludeDirs);
    injectPylintHeaders(files, log);
  }

  log("post-process: done.");
}
