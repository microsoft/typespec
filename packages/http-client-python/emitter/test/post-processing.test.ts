import fs from "fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, join, sep } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmitterTester } from "./test-host.js";

const { execSync, saveCodeModelAsYaml, loadPyodide } = vi.hoisted(() => ({
  execSync: vi.fn(),
  saveCodeModelAsYaml: vi.fn(),
  loadPyodide: vi.fn(),
}));

vi.mock("child_process", () => ({ execSync }));
vi.mock("../src/external-process.js", () => ({ saveCodeModelAsYaml }));
vi.mock("pyodide", () => ({ loadPyodide }));

describe("typespec-python: post-processing", () => {
  let outputDir: string;
  let yamlPath: string;
  const userFiles = ["tests/custom.py", "samples/custom.py", "custom.py"];
  const content = Buffer.from(
    "\uFEFFvalue={'key':1}\r\n# " + "x".repeat(121) + "\r\n" + "# filler\r\n".repeat(1000),
  );

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), "python post-processing "));
    yamlPath = join(outputDir, "code-model.yaml");
    saveCodeModelAsYaml.mockResolvedValue(yamlPath);
    for (const file of userFiles) {
      const filePath = join(outputDir, file);
      await mkdir(join(filePath, ".."), { recursive: true });
      await writeFile(filePath, content);
    }
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    await rm(outputDir, { recursive: true, force: true });
  });

  async function emit(usePyodide: boolean) {
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(
      "@service namespace Test; op ping(): void;",
      {
        compilerOptions: {
          options: {
            "@typespec/http-client-python": {
              "emitter-output-dir": outputDir,
              "use-pyodide": usePyodide,
            },
          },
        },
      },
    );
    expect(diagnostics).toEqual([]);
  }

  it("does not scan output files after native Python generation", async () => {
    const existsSync = fs.existsSync.bind(fs);
    vi.spyOn(fs, "existsSync").mockImplementation(
      (file) =>
        String(file).endsWith(`${sep}venv`) ||
        String(file).endsWith(`${sep}venv${sep}Scripts`) ||
        existsSync(file),
    );

    // The native pipeline wrote no files. Post-processing must not fall back to a directory scan.
    await emit(false);

    expect(execSync).toHaveBeenCalledTimes(1);
    expect(execSync.mock.calls[0][0]).toContain("run_tsp.py");
    expect(execSync.mock.calls[0][0]).not.toContain("-m black");
    for (const file of userFiles) {
      expect(await readFile(join(outputDir, file))).toEqual(content);
    }
  });

  it("uses the shared scoped generation pipeline in Node Pyodide", async () => {
    const toPy = vi.fn((globals) => globals);
    const runPythonAsync = vi.fn();
    loadPyodide.mockResolvedValue({
      FS: {
        mkdirTree: vi.fn(),
        mount: vi.fn(),
        filesystems: { NODEFS: {} },
      },
      toPy,
      runPythonAsync,
      loadPackage: vi.fn(),
      pyimport: vi.fn(() => ({ install: vi.fn() })),
    });

    await emit(true);

    expect(execSync).not.toHaveBeenCalled();
    expect(toPy).toHaveBeenCalledWith({
      outputFolder: "/output",
      yamlFile: `/yaml/${basename(yamlPath)}`,
      commandArgs: expect.any(Object),
    });
    expect(runPythonAsync).toHaveBeenCalledTimes(1);
    expect(runPythonAsync.mock.calls[0][0]).toContain("from pygen.generate import generate");
    expect(runPythonAsync.mock.calls[0][0]).toContain(
      "generate(output_folder=outputFolder, tsp_file=yamlFile, **commandArgs)",
    );
  });

  it("uses the same scoped generation pipeline in browser Pyodide", async () => {
    const toPy = vi.fn((globals) => globals);
    const runPythonAsync = vi.fn();
    loadPyodide.mockResolvedValue({
      FS: {
        mkdirTree: vi.fn(),
        readdir: vi.fn(() => [".", ".."]),
        writeFile: vi.fn(),
      },
      toPy,
      runPythonAsync,
      loadPackage: vi.fn(),
      pyimport: vi.fn(() => ({ install: vi.fn() })),
    });
    vi.stubGlobal("window", globalThis);

    await emit(true);

    expect(execSync).not.toHaveBeenCalled();
    expect(toPy).toHaveBeenCalledWith({
      outputFolder: "/output",
      yamlFile: "/yaml/python-yaml-path.yaml",
      commandArgs: expect.any(Object),
    });
    expect(runPythonAsync).toHaveBeenCalledTimes(1);
    expect(runPythonAsync.mock.calls[0][0]).toContain("from pygen.generate import generate");
    expect(runPythonAsync.mock.calls[0][0]).toContain(
      "generate(output_folder=outputFolder, tsp_file=yamlFile, **commandArgs)",
    );
  });
});
