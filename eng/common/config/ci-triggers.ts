import { AreaPaths } from "./areas.js";

/**
 * Path that should trigger every CI build.
 */
const all = ["eng/common/", "vitest.config.ts"];

/**
 * Path that should trigger only isolated packages
 */
const isolatedPackages = {
  "http-client-csharp": [...AreaPaths["emitter:client:csharp"]],
};

/**
 * Path that shouldn't trigger the core CI build
 */
const coreIgnore = [".prettierignore", ".prettierrc.json", "cspell.yaml", "esling.config.json"];
