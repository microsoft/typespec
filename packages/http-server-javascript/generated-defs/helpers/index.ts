// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Module } from "../../src/ctx.js";

export let module: Module = undefined as any;

export async function createModule(parent: Module): Promise<Module> {
  if (module) return module;

  module = {
    name: "helpers",
    cursor: parent.cursor.enter("helpers"),
    imports: [],
    declarations: [],
  };

  // Child modules
  await import("./router.js").then((m) => m.createModule(module));

  parent.declarations.push(module);

  return module;
}
