// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Module } from "../../../src/ctx.js";

export let module: Module = undefined as any;

export async function createModule(parent: Module): Promise<Module> {
  if (module) return module;

  module = {
    name: "temporal",
    cursor: parent.cursor.enter("temporal"),
    imports: [],
    declarations: [],
  };

  // Child modules
  await import("./native.js").then((m) => m.createModule(module));
  await import("./polyfill.js").then((m) => m.createModule(module));

  parent.declarations.push(module);

  return module;
}
