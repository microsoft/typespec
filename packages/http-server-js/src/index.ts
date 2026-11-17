// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import type { EmitContext } from "@typespec/compiler";
import { joinPaths } from "@typespec/compiler";
import { visitAllTypes } from "./common/namespace.js";
import { createInitialContext } from "./ctx.js";
import type { JsEmitterOptions } from "./lib.js";
import { writeModuleTree } from "./write.js";

// #region features

import { emitSerialization } from "./common/serialization/index.js";
import { emitHttp } from "./http/index.js";

// #endregion

export { $lib } from "./lib.js";

/**
 * TypeSpec emitter entry point that generates TypeScript server bindings for a single service.
 *
 * Replaces `src/generated` beneath the emitter output directory with server, model, and
 * serialization modules. In a compiler dry run, builds the module tree without deleting or
 * writing files. A program without a service produces a warning and no output; HTTP service
 * errors disable HTTP bindings but do not stop model emission.
 *
 * @param context - Compiler-provided program, emitter options, and output directory.
 * @throws If the program defines multiple services or encounters an unsupported emission
 * feature. File-writing and formatting failures also reject the returned promise.
 */
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

  const srcGeneratedPath = joinPaths(context.emitterOutputDir, "src", "generated");

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
