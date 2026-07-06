/**
 * Built-in emitter presets.
 *
 * Each entry is pure data: the regenerate command plus where the emitter and
 * its generated code live. `--emitter <name>` selects a preset; any field can
 * still be overridden with `--command` / `--emitter-path` /
 * `--generated-code-path`. New languages add a row here (or pass all
 * three flags directly and skip `--emitter`).
 */
import type { EmitterConfig } from "./types.js";

// @azure-tools/typespec-ts (Azure/typespec-azure). `regen-test-baselines` runs
// gen-spector.js, which writes the in-tree spector baselines under
// test/azure-modular-integration/generated.
const typescript: EmitterConfig = {
  command: "npm run regen-test-baselines",
  emitterPath: "packages/typespec-ts",
  generatedCodePath: "test/azure-modular-integration/generated",
  setup: ["pnpm install", "npm run build"],
};

export const EMITTER_DEFAULTS: Record<string, EmitterConfig> = {
  python: {
    command: "npm run regenerate",
    emitterPath: "packages/http-client-python",
    generatedCodePath: "tests/generated",
    // http-client-python is excluded from the pnpm workspace
    // (see pnpm-workspace.yaml), so it manages its own registry-versioned deps.
    // Install them with npm (not pnpm), skipping the prepare/venv scripts, then
    // run the package's own setup (build + venv/wheel install).
    setup: ["npm install --ignore-scripts", "npm run setup"],
  },
  typescript,
  ts: typescript,
  // Future: rust, java, go ... each just names its regenerate command and paths.
};

export function getEmitterDefaults(name: string): EmitterConfig | undefined {
  return EMITTER_DEFAULTS[name];
}

export function listEmitters(): string[] {
  return Object.keys(EMITTER_DEFAULTS);
}
