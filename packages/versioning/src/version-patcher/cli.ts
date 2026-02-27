#!/usr/bin/env node
/* eslint-disable no-console */

import { NodeHost, compile, logDiagnostics, resolvePath } from "@typespec/compiler";
import { parseArgs } from "util";
import { removeVersionFromSpec } from "./patch.js";

async function main() {
  const args = parseArgs({
    options: {
      version: {
        type: "string",
        short: "v",
      },
    },
    allowPositionals: true,
  });

  // Validate arguments
  const diagnostics: string[] = [];

  if (!args.positionals.length) {
    diagnostics.push("Missing required positional argument: <entrypoint>");
  } else if (args.positionals.length !== 1) {
    diagnostics.push(
      `Incorrect number of positional arguments: got ${args.positionals.length}, need 1`,
    );
  }

  if (!args.values.version) {
    diagnostics.push("Missing required argument: --version");
  }

  if (diagnostics.length > 0) {
    console.error(diagnostics.join("\n"));
    process.exit(1);
  }

  const entrypoint = resolvePath(process.cwd(), args.positionals[0]);
  const versionName = args.values.version;

  if (!versionName) {
    console.error("Version name is required.");
    process.exit(1);
  }

  try {
    // Compile the TypeSpec program
    const program = await compile(NodeHost, entrypoint, {
      noEmit: true,
    });

    if (program.hasError()) {
      console.error("Failed to compile TypeSpec program");
      logDiagnostics(program.diagnostics, NodeHost.logSink);
      process.exit(1);
    }

    await removeVersionFromSpec(program, versionName);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Internal error:", error);
  process.exit(1);
});
