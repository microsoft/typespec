// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { EmitContext } from "@typespec/compiler";
import { visitAllTypes } from "./common/namespace.js";
import { createInitialContext } from "./ctx.js";
import { JsEmitterOptions } from "./lib.js";
import { writeModuleTree } from "./write.js";

// #region features

import path from "node:path";
import { emitSerialization } from "./common/serialization/index.js";
import { emitHttp } from "./http/index.js";

// #endregion

export { $lib } from "./lib.js";

export async function $onEmit(context: EmitContext<JsEmitterOptions>) {
  const jsCtx = await createInitialContext(context.program, context.options);

  if (!jsCtx) return;

  await emitHttp(jsCtx);

  if (!context.options["omit-unreachable-types"]) {
    // Visit everything in the service namespace to ensure we emit a full `models` module and not just the subparts that
    // are reachable from the service impl.

    visitAllTypes(jsCtx, jsCtx.service.type);
  }

  // Emit serialization code for all required types.
  emitSerialization(jsCtx);

  const srcGeneratedPath = path.join(context.emitterOutputDir, "src", "generated");

  if (!context.program.compilerOptions.dryRun) {
    try {
      const stat = await context.program.host.stat(srcGeneratedPath);
      if (stat.isDirectory()) {
        await context.program.host.rm(srcGeneratedPath, {
          recursive: true,
        });
      }
    } catch {}

    await writeModuleTree(
      jsCtx,
      context.emitterOutputDir,
      jsCtx.rootModule,
      !context.options["no-format"],
    );
  }
}
