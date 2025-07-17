// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Program } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import type { BrowserHost } from "../types.js";

/* eslint-disable no-console */

export interface DebugGlobals {
  program: Program | undefined;
  host: BrowserHost | undefined;
  $$: Typekit | undefined;
}

/**
 * Prints debug information to the console.
 */
export function printDebugInfo() {
  console.info("TypeSpec Playground");
  console.info(
    "Some variables are bound to the `window` object in the browser console for debugging.",
  );
  console.info(" - `program`: The current TypeSpec program.");
  console.info(" - `host`: The current compiler host.");
  console.info(" - `$$`: A Typekit instance bound to the current program.");
}

/**
 * Get the global debug variables bound to the `window` object.
 */
export function debugGlobals(): DebugGlobals {
  return window as unknown as DebugGlobals;
}
