/* eslint-disable no-console */
/**
 * Shared helpers, types, constants, and data tables used by `regenerate.ts`.
 *
 * This file is meant to be **byte-identical** between this package and the
 * upstream `@typespec/http-client-python`. typespec-python syncs it from
 * <repo-root>/core/packages/http-client-python/eng/scripts/ci/regenerate-common.ts
 * via `pnpm sync`.
 *
 * Per-repo divergence (paths, emitter name, single-phase vs two-phase
 * orchestration, argv/help text) lives in each repo's own `regenerate.ts`,
 * which builds a `RegenerateContext` and feeds it into the helpers exported
 * from this module.
 */

import { compile, NodeHost } from "@typespec/compiler";
import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { access, cp, mkdir, mkdtemp, readdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join, relative, resolve } from "path";
import pc from "picocolors";

// ---- Public types ----

export interface RegenerateFlags {
  flavor: string;
  debug: boolean;
  name?: string;
}

export interface CompileTask {
  spec: string;
  outputDir: string;
  options: Record<string, unknown>;
}

// Group of tasks for the same spec that must run sequentially
export interface TaskGroup {
  spec: string;
  tasks: CompileTask[];
}

/**
 * Per-repo context injected into the helpers below.  Every value is repo
 * specific and must be supplied by the caller's `regenerate.ts`.
 */
export interface RegenerateContext {
  /** Absolute path to the package root (the dir containing `package.json`). */
  pluginDir: string;
  /** Absolute path to the azure-http-specs `specs/` dir. */
  azureHttpSpecs: string;
  /** Absolute path to the http-specs `specs/` dir. */
  httpSpecs: string;
  /** Absolute path to where generated SDKs should go (e.g. `<plugin>/generator`). */
  generatedFolder: string;
  /** Emitter name to invoke (e.g. `@azure-tools/typespec-python`). */
  emitterName: string;
}

/**
 * Optional knobs for `buildTaskGroups`.  Kept here so the call site in each
 * repo's `regenerate.ts` can opt into the upstream two-phase pipeline
 * (`emitYamlOnly: true`) or the single-phase pipeline (default).
 */
export interface BuildTaskGroupsOptions {
  /** If true, ask the emitter to write YAML only and skip Python codegen. */
  emitYamlOnly?: boolean;
}

// ---- Public constants ----

export const SKIP_SPECS: string[] = ["type/file", "service/multiple-services"];

export const SpecialFlags: Record<string, Record<string, any>> = {
  azure: {
    "generate-test": true,
    "generate-sample": true,
  },
};

// ---- Spec-specific emitter option overrides ----

export const AZURE_EMITTER_OPTIONS: Record<
  string,
  Record<string, string> | Record<string, string>[]
> = {
  "azure/client-generator-core/access": {
    namespace: "specs.azure.clientgenerator.core.access",
  },
  "azure/client-generator-core/alternate-type": {
    namespace: "specs.azure.clientgenerator.core.alternatetype",
  },
  "azure/client-generator-core/api-version": {
    namespace: "specs.azure.clientgenerator.core.apiversion",
  },
  "azure/client-generator-core/client-initialization/default": {
    namespace: "specs.azure.clientgenerator.core.clientinitialization.default",
  },
  "azure/client-generator-core/client-initialization/individually": {
    namespace: "specs.azure.clientgenerator.core.clientinitialization.individually",
  },
  "azure/client-generator-core/client-initialization/individuallyParent": {
    namespace: "specs.azure.clientgenerator.core.clientinitialization.individuallyparent",
  },
  "azure/client-generator-core/client-location": {
    namespace: "specs.azure.clientgenerator.core.clientlocation",
  },
  "azure/client-generator-core/deserialize-empty-string-as-null": {
    namespace: "specs.azure.clientgenerator.core.emptystring",
  },
  "azure/client-generator-core/flatten-property": {
    namespace: "specs.azure.clientgenerator.core.flattenproperty",
  },
  "azure/client-generator-core/usage": {
    namespace: "specs.azure.clientgenerator.core.usage",
  },
  "azure/client-generator-core/client-doc": {
    namespace: "specs.azure.clientgenerator.core.clientdoc",
  },
  "azure/client-generator-core/override": {
    namespace: "specs.azure.clientgenerator.core.override",
  },
  "azure/client-generator-core/hierarchy-building": {
    namespace: "specs.azure.clientgenerator.core.hierarchybuilding",
  },
  "azure/core/basic": {
    namespace: "specs.azure.core.basic",
  },
  "azure/core/lro/rpc": {
    namespace: "specs.azure.core.lro.rpc",
  },
  "azure/core/lro/standard": {
    namespace: "specs.azure.core.lro.standard",
  },
  "azure/core/model": {
    namespace: "specs.azure.core.model",
  },
  "azure/core/page": {
    namespace: "specs.azure.core.page",
  },
  "azure/core/scalar": {
    namespace: "specs.azure.core.scalar",
  },
  "azure/core/traits": {
    namespace: "specs.azure.core.traits",
  },
  "azure/encode/duration": {
    namespace: "specs.azure.encode.duration",
  },
  "azure/example/basic": {
    namespace: "specs.azure.example.basic",
  },
  "azure/payload/pageable": {
    namespace: "specs.azure.payload.pageable",
  },
  "azure/versioning/previewVersion": {
    namespace: "specs.azure.versioning.previewversion",
  },
  "client/structure/default": {
    namespace: "client.structure.service",
  },
  "client/structure/multi-client": {
    "package-name": "client-structure-multiclient",
    namespace: "client.structure.multiclient",
  },
  "client/structure/renamed-operation": {
    "package-name": "client-structure-renamedoperation",
    namespace: "client.structure.renamedoperation",
  },
  "client/structure/two-operation-group": {
    "package-name": "client-structure-twooperationgroup",
    namespace: "client.structure.twooperationgroup",
  },
  "client/naming": {
    namespace: "client.naming.main",
  },
  "client/overload": {
    namespace: "client.overload",
  },
  "encode/duration": {
    namespace: "encode.duration",
  },
  "encode/numeric": {
    namespace: "encode.numeric",
  },
  "parameters/basic": {
    namespace: "parameters.basic",
  },
  "parameters/spread": {
    namespace: "parameters.spread",
  },
  "payload/content-negotiation": {
    namespace: "payload.contentnegotiation",
  },
  "payload/multipart": {
    namespace: "payload.multipart",
  },
  "serialization/encoded-name/json": {
    namespace: "serialization.encodedname.json",
  },
  "special-words": {
    namespace: "specialwords",
  },
  "service/multi-service": {
    namespace: "service.multiservice",
  },
  "client/structure/client-operation-group": {
    "package-name": "client-structure-clientoperationgroup",
    namespace: "client.structure.clientoperationgroup",
  },
};

export const EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  "resiliency/srv-driven/old.tsp": {
    "package-name": "resiliency-srv-driven1",
    namespace: "resiliency.srv.driven1",
    "package-mode": "azure-dataplane",
    "package-pprint-name": "ResiliencySrvDriven1",
  },
  "resiliency/srv-driven": {
    "package-name": "resiliency-srv-driven2",
    namespace: "resiliency.srv.driven2",
    "package-mode": "azure-dataplane",
    "package-pprint-name": "ResiliencySrvDriven2",
  },
  "authentication/api-key": {
    "clear-output-folder": "true",
  },
  "authentication/http/custom": {
    "package-name": "authentication-http-custom",
    namespace: "authentication.http.custom",
    "package-pprint-name": "Authentication Http Custom",
  },
  "authentication/union": [
    {
      "package-name": "authentication-union",
      namespace: "authentication.union",
    },
    {
      "package-name": "setuppy-authentication-union",
      namespace: "setuppy.authentication.union",
      "keep-setup-py": "true",
    },
  ],
  "type/array": {
    "package-name": "typetest-array",
    namespace: "typetest.array",
  },
  "type/dictionary": {
    "package-name": "typetest-dictionary",
    namespace: "typetest.dictionary",
  },
  "type/enum/extensible": {
    "package-name": "typetest-enum-extensible",
    namespace: "typetest.enum.extensible",
  },
  "type/enum/fixed": {
    "package-name": "typetest-enum-fixed",
    namespace: "typetest.enum.fixed",
  },
  "type/model/empty": {
    "package-name": "typetest-model-empty",
    namespace: "typetest.model.empty",
  },
  "type/model/inheritance/enum-discriminator": {
    "package-name": "typetest-model-enumdiscriminator",
    namespace: "typetest.model.enumdiscriminator",
  },
  "type/model/inheritance/nested-discriminator": {
    "package-name": "typetest-model-nesteddiscriminator",
    namespace: "typetest.model.nesteddiscriminator",
  },
  "type/model/inheritance/not-discriminated": {
    "package-name": "typetest-model-notdiscriminated",
    namespace: "typetest.model.notdiscriminated",
  },
  "type/model/inheritance/single-discriminator": {
    "package-name": "typetest-model-singlediscriminator",
    namespace: "typetest.model.singlediscriminator",
  },
  "type/model/inheritance/recursive": [
    {
      "package-name": "typetest-model-recursive",
      namespace: "typetest.model.recursive",
    },
    {
      "package-name": "generation-subdir",
      namespace: "generation.subdir",
      "generation-subdir": "_generated",
      "generate-test": "false",
      "clear-output-folder": "true",
    },
  ],
  "type/model/usage": {
    "package-name": "typetest-model-usage",
    namespace: "typetest.model.usage",
  },
  "type/model/visibility": [
    {
      "package-name": "typetest-model-visibility",
      namespace: "typetest.model.visibility",
    },
    {
      "package-name": "headasbooleantrue",
      namespace: "headasbooleantrue",
      "head-as-boolean": "true",
    },
    {
      "package-name": "headasbooleanfalse",
      namespace: "headasbooleanfalse",
      "head-as-boolean": "false",
    },
  ],
  "type/property/nullable": {
    "package-name": "typetest-property-nullable",
    namespace: "typetest.property.nullable",
  },
  "type/property/optionality": {
    "package-name": "typetest-property-optional",
    namespace: "typetest.property.optional",
  },
  "type/property/additional-properties": {
    "package-name": "typetest-property-additionalproperties",
    namespace: "typetest.property.additionalproperties",
  },
  "type/scalar": {
    "package-name": "typetest-scalar",
    namespace: "typetest.scalar",
  },
  "type/property/value-types": {
    "package-name": "typetest-property-valuetypes",
    namespace: "typetest.property.valuetypes",
  },
  "type/union": {
    "package-name": "typetest-union",
    namespace: "typetest.union",
  },
  "type/union/discriminated": {
    "package-name": "typetest-discriminatedunion",
    namespace: "typetest.discriminatedunion",
  },
  "type/file": {
    "package-name": "typetest-file",
    namespace: "typetest.file",
  },
  documentation: {
    "package-name": "specs-documentation",
    namespace: "specs.documentation",
  },
  "versioning/added": [
    {
      "package-name": "versioning-added",
      namespace: "versioning.added",
    },
    {
      "package-name": "generation-subdir2",
      namespace: "generation.subdir2",
      "generate-test": "false",
      "generation-subdir": "_generated",
    },
  ],
};

// ---- Public helpers ----

export function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

/**
 * Whether a spec path belongs to azure-http-specs (vs standard http-specs).
 * Uses the `azure-http-specs` substring rather than `azure` to avoid false
 * positives when the working-dir path itself contains "azure" (e.g.
 * azure-sdk-for-python).
 */
export function isAzureSpec(spec: string): boolean {
  return spec.includes("azure-http-specs");
}

export function defaultPackageName(spec: string, ctx: RegenerateContext): string {
  const specDir = isAzureSpec(spec) ? ctx.azureHttpSpecs : ctx.httpSpecs;
  return toPosix(relative(specDir, dirname(spec)))
    .replace(/\//g, "-")
    .toLowerCase();
}

export function getEmitterOptions(
  spec: string,
  flavor: string,
  ctx: RegenerateContext,
): Record<string, string>[] {
  const specDir = isAzureSpec(spec) ? ctx.azureHttpSpecs : ctx.httpSpecs;
  const relativeSpec = toPosix(relative(specDir, spec));
  const key = relativeSpec.includes("resiliency/srv-driven/old.tsp")
    ? relativeSpec
    : dirname(relativeSpec);
  const emitterOpts = EMITTER_OPTIONS[key] ||
    (flavor === "azure" ? AZURE_EMITTER_OPTIONS[key] : [{}]) || [{}];
  return Array.isArray(emitterOpts) ? emitterOpts : [emitterOpts];
}

/**
 * Walk `baseDir` and collect every TypeSpec entry-point file that the
 * regenerator should compile (handles `client.tsp`, `main.tsp`, and the
 * special `resiliency/srv-driven/old.tsp` case).
 */
export async function getSubdirectories(
  baseDir: string,
  flags: RegenerateFlags,
): Promise<string[]> {
  const subdirectories: string[] = [];

  async function searchDir(currentDir: string) {
    const items = await readdir(currentDir, { withFileTypes: true });

    const promisesArray = items.map(async (item) => {
      const subDirPath = join(currentDir, item.name);
      if (item.isDirectory()) {
        const mainTspPath = join(subDirPath, "main.tsp");
        const clientTspPath = join(subDirPath, "client.tsp");

        const mainTspRelativePath = toPosix(relative(baseDir, mainTspPath));

        if (SKIP_SPECS.some((skipSpec) => mainTspRelativePath.includes(skipSpec))) return;

        const hasMainTsp = await access(mainTspPath)
          .then(() => true)
          .catch(() => false);
        const hasClientTsp = await access(clientTspPath)
          .then(() => true)
          .catch(() => false);

        if (mainTspRelativePath.toLowerCase().includes(flags.name || "")) {
          if (mainTspRelativePath.includes("resiliency/srv-driven")) {
            subdirectories.push(resolve(subDirPath, "old.tsp"));
          }
          if (hasClientTsp) {
            subdirectories.push(resolve(subDirPath, "client.tsp"));
          } else if (hasMainTsp) {
            subdirectories.push(resolve(subDirPath, "main.tsp"));
          }
        }

        await searchDir(subDirPath);
      }
    });

    await Promise.all(promisesArray);
  }

  await searchDir(baseDir);
  return subdirectories;
}

export function buildTaskGroups(
  specs: string[],
  flags: RegenerateFlags,
  ctx: RegenerateContext,
  options: BuildTaskGroupsOptions = {},
): TaskGroup[] {
  const groups: TaskGroup[] = [];

  for (const spec of specs) {
    const tasks: CompileTask[] = [];

    for (const emitterConfig of getEmitterOptions(spec, flags.flavor, ctx)) {
      // Apply flavor defaults first, then per-spec options so they can override
      // (e.g. "generate-test": "false")
      const opts: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(SpecialFlags[flags.flavor] ?? {})) {
        opts[k] = v;
      }
      Object.assign(opts, emitterConfig);

      opts["flavor"] = flags.flavor;

      // Set output directory - tests/generated/<flavor>/<package> structure.
      // Always anchored at <generatedFolder>/../tests/generated regardless of
      // pluginDir, so generator-only checkouts work too.
      const packageName = (opts["package-name"] as string) || defaultPackageName(spec, ctx);
      const outputDir =
        (opts["emitter-output-dir"] as string) ||
        toPosix(`${ctx.generatedFolder}/../tests/generated/${flags.flavor}/${packageName}`);
      opts["emitter-output-dir"] = outputDir;

      if (flags.debug) {
        opts["debug"] = true;
      }

      opts["examples-dir"] = toPosix(join(dirname(spec), "examples"));

      if (options.emitYamlOnly) {
        // Emit YAML only - Python processing is batched after all specs compile.
        opts["emit-yaml-only"] = true;
      }

      tasks.push({ spec, outputDir, options: opts });
    }

    groups.push({ spec, tasks });
  }

  return groups;
}

export async function compileSpec(
  task: CompileTask,
  ctx: RegenerateContext,
): Promise<{ success: boolean; error?: string }> {
  const { spec, outputDir, options } = task;

  try {
    const compilerOptions = {
      emit: [ctx.pluginDir],
      options: {
        [ctx.emitterName]: options,
      },
    };

    const program = await compile(NodeHost, spec, compilerOptions);

    if (program.hasError()) {
      const errors = program.diagnostics
        .filter((d) => d.severity === "error")
        .map((d) => d.message)
        .join("\n");
      return { success: false, error: errors };
    }

    return { success: true };
  } catch (err) {
    rmSync(outputDir, { recursive: true, force: true });
    return { success: false, error: String(err) };
  }
}

export function renderProgressBar(
  completed: number,
  failed: number,
  total: number,
  width: number = 40,
): string {
  const successCount = completed - failed;
  const successWidth = Math.round((successCount / total) * width);
  const failWidth = Math.round((failed / total) * width);
  const emptyWidth = width - successWidth - failWidth;

  const successBar = pc.bgGreen(" ".repeat(successWidth));
  const failBar = failed > 0 ? pc.bgRed(" ".repeat(failWidth)) : "";
  const emptyBar = pc.dim("░".repeat(Math.max(0, emptyWidth)));

  const percent = Math.round((completed / total) * 100);
  return `${successBar}${failBar}${emptyBar} ${pc.cyan(`${percent}%`)} (${completed}/${total})`;
}

export async function runParallel(
  groups: TaskGroup[],
  maxJobs: number,
  ctx: RegenerateContext,
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const executing: Set<Promise<void>> = new Set();

  const totalTasks = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  let completed = 0;
  let failed = 0;
  const failedSpecs: string[] = [];

  const isTTY = process.stdout.isTTY;

  const updateProgress = () => {
    if (isTTY) {
      process.stdout.write(`\r${renderProgressBar(completed, failed, totalTasks)}`);
    }
  };

  updateProgress();

  for (const group of groups) {
    // Each group runs as a unit - tasks within a group run sequentially
    // to avoid state pollution. Different groups run in parallel.
    const runGroup = async () => {
      const specDir = isAzureSpec(group.spec) ? ctx.azureHttpSpecs : ctx.httpSpecs;
      const shortName = toPosix(relative(specDir, dirname(group.spec)));

      let groupSuccess = true;
      for (const task of group.tasks) {
        const packageName = (task.options["package-name"] as string) || shortName;

        const result = await compileSpec(task, ctx);
        completed++;

        if (!result.success) {
          failed++;
          failedSpecs.push(`${packageName}: ${result.error}`);
          groupSuccess = false;
        }

        updateProgress();
      }

      results.set(group.spec, groupSuccess);
    };

    const p = runGroup().finally(() => executing.delete(p));
    executing.add(p);

    if (executing.size >= maxJobs) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  if (isTTY) {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }

  if (failedSpecs.length > 0) {
    console.log(pc.red(`\nFailed specs:`));
    for (const spec of failedSpecs) {
      console.log(pc.red(`  • ${spec}`));
    }
  }

  return results;
}

/**
 * Pre-create the marker files that the test harness expects to find before
 * regeneration so it can verify they're cleared/preserved correctly.
 */
export async function preprocess(flavor: string, generatedFolder: string): Promise<void> {
  if (flavor !== "azure") return;

  const testsGeneratedDir = resolve(generatedFolder, "../tests/generated/azure");

  const DELETE_CONTENT = "# This file is to be deleted after regeneration";
  const KEEP_CONTENT = "# This file is to be kept after regeneration";
  const DELETE_FILE = "to_be_deleted.py";
  const entries: { folder: string[]; file: string; content: string }[] = [
    {
      folder: ["authentication-api-key", "authentication", "apikey", "_operations"],
      file: DELETE_FILE,
      content: DELETE_CONTENT,
    },
    {
      folder: ["generation-subdir", "generation", "subdir", "_generated"],
      file: DELETE_FILE,
      content: DELETE_CONTENT,
    },
    {
      folder: ["generation-subdir", "generated_tests"],
      file: DELETE_FILE,
      content: DELETE_CONTENT,
    },
    {
      folder: ["generation-subdir", "generation", "subdir"],
      file: "to_be_kept.py",
      content: KEEP_CONTENT,
    },
  ];

  await Promise.all(
    entries.map(async ({ folder, file, content }) => {
      const targetFolder = join(testsGeneratedDir, ...folder);
      await mkdir(targetFolder, { recursive: true });
      await writeFile(join(targetFolder, file), content);
    }),
  );
}

/**
 * Resets the `tests/generated/{azure,unbranded}` baseline by sparse-checking-out
 * `eng/tools/azure-sdk-tools/emitter/generated` from the Azure/azure-sdk-for-python repo, then
 * deleting a couple of fully-generated package folders so regeneration has to
 * recreate them from scratch (smoke test of full-emit path).
 *
 * `generatedFolder` is the per-repo `generator/` directory; baseline lands at
 * `<generatedFolder>/../tests/generated`.
 */
export async function prepareBaselineOfGeneratedCode(generatedFolder: string): Promise<void> {
  const repoUrl = "https://github.com/Azure/azure-sdk-for-python.git";
  const branch = "typespec-python-generated-tests";
  const sourceSubdir = "eng/tools/azure-sdk-tools/emitter/generated";
  const testsGeneratedDir = resolve(generatedFolder, "../tests/generated");

  console.log(pc.cyan(`\n${"=".repeat(60)}`));
  console.log(pc.cyan(`Resetting baseline from ${repoUrl} (${branch}/${sourceSubdir})`));
  console.log(pc.cyan(`${"=".repeat(60)}\n`));

  // Wipe tests/generated
  if (existsSync(testsGeneratedDir)) {
    console.log(pc.dim(`Removing ${testsGeneratedDir}`));
    rmSync(testsGeneratedDir, { recursive: true, force: true });
  }

  // Sparse-checkout the baseline folder into a temp directory
  const tempDir = await mkdtemp(join(tmpdir(), "azsdk-baseline-"));
  try {
    console.log(pc.dim(`Cloning into ${tempDir}`));
    const run = (cmd: string) =>
      execSync(cmd, { cwd: tempDir, stdio: ["ignore", "ignore", "inherit"] });

    run(`git init`);
    run(`git config core.longpaths true`);
    run(`git remote add origin ${repoUrl}`);
    run(`git config core.sparseCheckout true`);
    run(`git sparse-checkout init --cone`);
    run(`git sparse-checkout set ${sourceSubdir}`);
    run(`git fetch --depth 1 origin ${branch}`);
    run(`git checkout FETCH_HEAD`);

    // we don't copy whole generated folder, just the specific subfolders needed for tests
    // to verify correct preservation/deletion of files and folders during regeneration,
    // to avoid accidentally including any manually edited code that might be in the repo
    // and cause confusion when it doesn't get updated during regeneration
    const legacyCodePathNeededForTests = [
      "azure/authentication-api-key",
      "unbranded/authentication-api-key",
      "azure/authentication-union",
      "azure/generation-subdir",
      "azure/generation-subdir2",
      "unbranded/generation-subdir",
      "unbranded/generation-subdir2",
      "azure/azure-client-generator-core-alternate-type",
    ];

    const sourceRoot = join(tempDir, ...sourceSubdir.split("/"));
    for (const subPath of legacyCodePathNeededForTests) {
      const segments = subPath.split("/");
      const src = join(sourceRoot, ...segments);
      const dest = join(testsGeneratedDir, ...segments);
      if (!existsSync(src)) {
        console.warn(pc.yellow(`Baseline folder not found: ${src}`));
        continue;
      }
      console.log(pc.dim(`Copying ${subPath} -> ${dest}`));
      await mkdir(dirname(dest), { recursive: true });
      await cp(src, dest, { recursive: true });
    }

    console.log(pc.green(`Baseline reset complete.\n`));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  // Smoke test the full-emit path: delete a couple of fully-generated package
  // folders and every README.md so regeneration has to recreate them.
  const deleteIfExists = (path: string) => {
    if (!existsSync(path)) return;
    console.log(pc.dim(`Deleting ${path}`));
    rmSync(path, { recursive: true, force: true });
  };

  deleteIfExists(join(testsGeneratedDir, "azure", "authentication-http-custom"));
  deleteIfExists(join(testsGeneratedDir, "unbranded", "encode-array"));

  if (existsSync(testsGeneratedDir)) {
    const entries = await readdir(testsGeneratedDir, { recursive: true, withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name === "README.md") {
        deleteIfExists(join(entry.parentPath, entry.name));
      }
    }
  }
}
