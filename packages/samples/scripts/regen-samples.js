#!/usr/bin/env node
// @ts-check
import { run } from "@cadl-lang/internal-build-utils";
import { readdirSync, rmSync } from "fs";
import mkdirp from "mkdirp";
import { dirname, join, normalize, resolve } from "path";
import { fileURLToPath } from "url";

const excludedSamples = [
  // fails compilation by design to demo language server
  "local-cadl",

  // no actual samples in these dirs
  "node_modules",
  "dist",
  "scratch",
  "scripts",
  "test",
  ".rush",
];

const rootInputPath = resolvePath("../");
const rootOutputPath = resolvePath("../test/output");
const restEmitterSamplePath = resolvePath("../rest-metadata-emitter");

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function main() {
  // clear any previous output as otherwise failing to emit anything could
  // escape PR validation. Also ensures we delete output for samples that
  // no longer exist.
  rmSync(rootOutputPath, { recursive: true });

  for (const folderName of getSampleFolders()) {
    const inputPath = join(rootInputPath, folderName);
    const outputPath = join(rootOutputPath, folderName);
    mkdirp(outputPath);

    let emitter = "@cadl-lang/openapi3";
    if (inputPath === restEmitterSamplePath) {
      emitter = resolvePath("../dist/rest-metadata-emitter/rest-metadata-emitter-sample.js");
    }

    await run(process.execPath, [
      "../../packages/compiler/dist/core/cli/cli.js",
      "compile",
      inputPath,
      `--option="${emitter}.emitter-output-dir=${outputPath}"`,
      `--emit=${emitter}`,
      `--warn-as-error`,
      `--debug`,
    ]);
  }
}

function getSampleFolders() {
  const samples = new Set();
  const excludes = new Set(excludedSamples.map(normalize));
  walk("");
  return samples;

  function walk(relativeDir) {
    if (samples.has(relativeDir) || excludes.has(relativeDir)) {
      return;
    }
    const fullDir = join(rootInputPath, relativeDir);
    for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(relativeDir, entry.name));
      } else if (relativeDir && (entry.name === "main.cadl" || entry.name === "package.json")) {
        samples.add(relativeDir);
      }
    }
  }
}

function resolvePath(...parts) {
  const dir = dirname(fileURLToPath(import.meta.url));
  return resolve(dir, ...parts);
}
