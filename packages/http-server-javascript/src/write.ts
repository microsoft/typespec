// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { resolvePath } from "@typespec/compiler";
import { JsContext, Module, isModule } from "./ctx.js";

import { emitModuleBody } from "./common/namespace.js";
import { OnceQueue, createOnceQueue } from "./util/once-queue.js";

import * as prettier from "prettier";

import { EOL } from "os";
import path from "path";
import { bifilter } from "./util/iter.js";

/**
 * Writes the tree of modules to the output directory.
 *
 * @param ctx - The emitter context.
 * @param baseOutputPath - The base output directory to write the module tree to.
 * @param rootModule - The root module to begin emitting from.
 * @param format - Whether to format the output using Prettier.
 */
export async function writeModuleTree(
  ctx: JsContext,
  baseOutputPath: string,
  rootModule: Module,
  format: boolean
): Promise<void> {
  const queue = createOnceQueue(rootModule);

  while (!queue.isEmpty()) {
    const module = queue.take()!;
    await writeModuleFile(ctx, baseOutputPath, module, queue, format);
  }
}

/**
 * Write a single module file to the output directory.
 *
 * @param ctx - The emitter context.
 * @param baseOutputPath - The base output directory to write the module tree to.
 * @param module - The module to write.
 * @param queue - The queue of modules to write.
 * @param format - Whether to format the output using Prettier.
 */
async function writeModuleFile(
  ctx: JsContext,
  baseOutputPath: string,
  module: Module,
  queue: OnceQueue<Module>,
  format: boolean
): Promise<void> {
  const moduleText = [
    "// Generated by Microsoft TypeSpec",
    "",
    ...emitModuleBody(ctx, module, queue),
  ];

  const [declaredModules, declaredText] = bifilter(module.declarations, isModule);

  if (declaredText.length === 0) {
    // Early exit to avoid writing an empty module.
    return;
  }

  const isIndex = module.cursor.path.length === 0 || declaredModules.length > 0;

  const moduleRelativePath =
    module.cursor.path.length > 0
      ? module.cursor.path.join("/") + (isIndex ? "/index.ts" : ".ts")
      : "index.ts";

  const modulePath = resolvePath(baseOutputPath, moduleRelativePath);

  const text = format
    ? await prettier.format(moduleText.join(EOL), {
        parser: "typescript",
      })
    : moduleText.join(EOL);

  await ctx.program.host.mkdirp(path.dirname(modulePath));
  await ctx.program.host.writeFile(modulePath, text);
}
