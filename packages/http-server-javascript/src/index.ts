// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { EmitContext, NoTarget, listServices } from "@typespec/compiler";
import { visitAllTypes } from "./common/namespace.js";
import { JsContext, Module, createModule, createPathCursor } from "./ctx.js";
import { JsEmitterOptions, reportDiagnostic } from "./lib.js";
import { parseCase } from "./util/case.js";
import { UnimplementedError } from "./util/error.js";
import { createOnceQueue } from "./util/once-queue.js";
import { writeModuleTree } from "./write.js";

import { createModule as initializeHelperModule } from "../generated-defs/helpers/index.js";

// #region features

import { emitSerialization } from "./common/serialization/index.js";
import { emitHttp } from "./http/index.js";

// #endregion

export { $lib } from "./lib.js";

export async function $onEmit(context: EmitContext<JsEmitterOptions>) {
  const services = listServices(context.program);

  if (services.length === 0) {
    reportDiagnostic(context.program, {
      code: "no-services-in-program",
      target: NoTarget,
      messageId: "default",
    });
    return;
  } else if (services.length > 1) {
    throw new UnimplementedError("multiple service definitions per program.");
  }

  const [service] = services;

  const serviceModuleName = parseCase(service.type.name).snakeCase;

  const rootCursor = createPathCursor();

  const globalNamespace = context.program.getGlobalNamespaceType();

  // Root module for emit.
  const rootModule: Module = {
    name: serviceModuleName,
    cursor: rootCursor,

    imports: [],
    declarations: [],
  };

  // This has the side effect of setting the `module` property of all helpers.
  // Don't do anything with the emitter code before this is called.
  await initializeHelperModule(rootModule);

  // Module for all models, including synthetic and all.
  const modelsModule: Module = createModule("models", rootModule);

  // Module for all types in all namespaces.
  const allModule: Module = createModule("all", modelsModule, globalNamespace);

  // Module for all synthetic (named ad-hoc) types.
  const syntheticModule: Module = createModule("synthetic", modelsModule);

  const jsCtx: JsContext = {
    program: context.program,
    options: context.options,
    globalNamespace,
    service,

    typeQueue: createOnceQueue(),
    synthetics: [],
    syntheticNames: new Map(),

    rootModule,
    namespaceModules: new Map([[globalNamespace, allModule]]),
    syntheticModule,
    modelsModule,
    globalNamespaceModule: allModule,

    serializations: createOnceQueue(),
  };

  await emitHttp(jsCtx);

  if (!context.options["omit-unreachable-types"]) {
    // Visit everything in the service namespace to ensure we emit a full `models` module and not just the subparts that
    // are reachable from the service impl.

    visitAllTypes(jsCtx, service.type);
  }

  // Emit serialization code for all required types.
  emitSerialization(jsCtx);

  if (!context.program.compilerOptions.noEmit) {
    try {
      const stat = await context.program.host.stat(context.emitterOutputDir);
      if (stat.isDirectory()) {
        await context.program.host.rm(context.emitterOutputDir, {
          recursive: true,
        });
      }
    } catch {}

    await writeModuleTree(
      jsCtx,
      context.emitterOutputDir,
      rootModule,
      !context.options["no-format"],
    );
  }
}
