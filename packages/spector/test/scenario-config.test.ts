import * as compiler from "@typespec/compiler";
import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateMockApis } from "../src/actions/validate-mock-apis.js";
import { logger } from "../src/logger.js";
import { loadScenarios } from "../src/scenarios-resolver.js";
import { compileScenario } from "../src/spec-utils/compile-scenario.js";

const enabledConfig = "kind: project\nfeatures: [union-extends]\n";
const source = `
import "@typespec/http";
import "@typespec/spector";
using TypeSpec.Http;
using TypeSpec.Spector;

@scenarioService("/config")
namespace Config;

model Base { name: string; }
model Item extends Base { value: int32; }
union Result extends Base { item: Item }

@scenario
@scenarioDoc("Read a configured union.")
@get
op read(): Result;
`;

let root: string;
let scenariosPath: string;
let specFilePath: string;
let messages: string[];

async function writeFixture(path: string, content: string) {
  const fullPath = join(root, path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}

beforeEach(async () => {
  root = join(import.meta.dirname, `.scenario-config-${randomUUID()}`);
  scenariosPath = join(root, "specs");
  specFilePath = join(scenariosPath, "case/main.tsp");
  messages = [];
  vi.spyOn(logger, "info").mockImplementation(() => {});
  vi.spyOn(logger, "error").mockImplementation((message) => {
    messages.push(message);
  });
  vi.spyOn(compiler.NodeHost.logSink, "log").mockImplementation((log) => {
    messages.push(log.message);
  });
  await writeFixture("specs/case/main.tsp", source);
  await writeFixture(
    "dist/case/mockapi.js",
    `export const Scenarios = {
      Config_read: {
        passCondition: "response-success",
        apis: [{
          kind: "MockApiDefinition",
          method: "get",
          uri: "/config",
          response: { status: 200, body: { name: "item", value: 1 } },
        }],
      },
    };`,
  );
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

describe.each(["loadScenarios", "validateMockApis"] as const)("%s configuration", (entrypoint) => {
  async function validate() {
    if (entrypoint === "loadScenarios") {
      const [scenarios, diagnostics] = await loadScenarios(scenariosPath);
      if (diagnostics.length === 0) {
        expect(scenarios.map((scenario) => scenario.name)).toEqual(["Config_read"]);
      } else {
        expect(scenarios).toEqual([]);
      }
      return diagnostics.length === 0;
    }
    return !(await validateMockApis({ scenariosPath, hasMoreScenarios: true }));
  }

  it("enables union extends using the scenario's project config", async () => {
    await writeFixture("specs/case/tspconfig.yaml", enabledConfig);
    expect(await validate()).toBe(true);
  });

  it.each([undefined, "", "kind: project\nfeatures: []\n"])(
    "rejects union extends without the feature (%j)",
    async (config) => {
      if (config !== undefined) {
        await writeFixture("specs/case/tspconfig.yaml", config);
      }
      expect(await validate()).toBe(false);
      expect(messages.join("\n")).toContain("Union `extends` clauses require the 'union-extends'");
    },
  );

  it.each([undefined, ""])(
    "accepts ordinary scenarios with no/empty config (%j)",
    async (config) => {
      await writeFixture(
        "specs/case/main.tsp",
        source.replace("union Result extends Base", "union Result"),
      );
      if (config !== undefined) {
        await writeFixture("specs/case/tspconfig.yaml", config);
      }
      expect(await validate()).toBe(true);
    },
  );

  it("discovers config in the nearest parent directory", async () => {
    await writeFixture("specs/tspconfig.yaml", enabledConfig);
    expect(await validate()).toBe(true);
  });

  it("uses the nearest config rather than an invalid ancestor", async () => {
    await writeFixture("specs/tspconfig.yaml", "features: [");
    await writeFixture("specs/case/tspconfig.yaml", enabledConfig);
    expect(await validate()).toBe(true);
  });

  it("stops upward discovery at an empty config", async () => {
    await writeFixture("specs/tspconfig.yaml", enabledConfig);
    await writeFixture("specs/case/tspconfig.yaml", "");
    expect(await validate()).toBe(false);
    expect(messages.join("\n")).toContain("Union `extends` clauses require the 'union-extends'");
  });

  it("inherits enabled features through an explicit extends", async () => {
    await writeFixture("shared/tspconfig.yaml", enabledConfig);
    await writeFixture(
      "specs/case/tspconfig.yaml",
      "kind: project\nextends: ../../shared/tspconfig.yaml\n",
    );
    expect(await validate()).toBe(true);
  });

  it("resolves declared environment variables even when emission is disabled", async () => {
    vi.stubEnv("SPECTOR_SCENARIO_OUTPUT_DIR", join(root, "output"));
    await writeFixture(
      "specs/case/tspconfig.yaml",
      `${enabledConfig}environment-variables:
  SPECTOR_SCENARIO_OUTPUT_DIR:
    default: ""
output-dir: "{env.SPECTOR_SCENARIO_OUTPUT_DIR}"
`,
    );
    expect(await validate()).toBe(true);
  });

  it.each(["features: [", "kind: project\nfeatures: true\n"])(
    "reports malformed config instead of compiling with defaults (%j)",
    async (config) => {
      await writeFixture(
        "specs/case/main.tsp",
        source.replace("union Result extends Base", "union Result"),
      );
      await writeFixture("specs/case/tspconfig.yaml", config);
      expect(await validate()).toBe(false);
      expect(messages.join("\n")).toMatch(/Flow sequence|array/);
    },
  );

  it("reports missing inherited config", async () => {
    await writeFixture("specs/case/tspconfig.yaml", `${enabledConfig}extends: ./missing.yaml\n`);
    expect(await validate()).toBe(false);
    expect(messages.join("\n")).toContain("missing.yaml");
  });

  it("honors configured imports relative to the scenario", async () => {
    await writeFixture(
      "specs/case/main.tsp",
      source.replace('import "@typespec/spector";', "").replace("model Base { name: string; }", ""),
    );
    await writeFixture("specs/case/base.tsp", "namespace Config; model Base { name: string; }");
    await writeFixture(
      "specs/case/tspconfig.yaml",
      `${enabledConfig}imports:\n  - "@typespec/spector"\n  - "./base.tsp"\n`,
    );
    expect(await validate()).toBe(true);
  });

  it("does not load or execute configured emitters", async () => {
    await writeFixture(
      "specs/case/emitter.mjs",
      `throw new Error("Configured emitter must not be loaded");
       export function $onEmit() { throw new Error("Configured emitter must not run"); }`,
    );
    await writeFixture(
      "specs/case/tspconfig.yaml",
      `${enabledConfig}emit:\n  - "./emitter.mjs"\n  - "nonexistent-spector-test-emitter"\n`,
    );
    expect(await validate()).toBe(true);
  });
});

it("keeps loadScenarios' implicit Spector import alongside configured imports", async () => {
  await writeFixture(
    "specs/case/main.tsp",
    source.replace('import "@typespec/spector";', "").replace("model Base { name: string; }", ""),
  );
  await writeFixture("specs/case/base.tsp", "namespace Config; model Base { name: string; }");
  await writeFixture("specs/case/tspconfig.yaml", `${enabledConfig}imports: ["./base.tsp"]\n`);
  const [scenarios, diagnostics] = await loadScenarios(scenariosPath);
  expect(diagnostics).toEqual([]);
  expect(scenarios.map((scenario) => scenario.name)).toEqual(["Config_read"]);
});

it("enforces validation options after resolving config with the supplied compiler", async () => {
  await writeFixture(
    "specs/case/tspconfig.yaml",
    `${enabledConfig}warn-as-error: false\nemit: ["not-an-emitter"]\n`,
  );
  const resolveCompilerOptions = vi.fn(compiler.resolveCompilerOptions);
  const [program, diagnostics] = await compileScenario(
    { ...compiler, resolveCompilerOptions },
    relative(process.cwd(), specFilePath),
  );
  expect(diagnostics).toEqual([]);
  expect(resolveCompilerOptions).toHaveBeenCalledWith(compiler.NodeHost, {
    entrypoint: specFilePath,
    cwd: dirname(specFilePath),
    env: process.env,
  });
  expect(program?.compilerOptions).toMatchObject({
    noEmit: true,
    warningAsError: true,
    emit: [],
    configFile: { features: ["union-extends"] },
  });
});

it("does not compile when configuration resolution reports diagnostics", async () => {
  await writeFixture("specs/case/tspconfig.yaml", "features: [");
  const compile = vi.fn(compiler.compile);
  const [program, diagnostics] = await compileScenario({ ...compiler, compile }, specFilePath);
  expect(program).toBeUndefined();
  expect(diagnostics.length).toBeGreaterThan(0);
  expect(compile).not.toHaveBeenCalled();
});
