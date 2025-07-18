// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Program } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import type { BrowserHost } from "../types.js";

/* eslint-disable no-console */

export interface DebugGlobals {
  /**
   * The current TypeSpec program.
   */
  program: Program | undefined;

  /**
   * The compiler host.
   */
  host: BrowserHost | undefined;

  /**
   * The TypeSpec compiler API.
   */
  compiler: typeof import("@typespec/compiler") | undefined;

  /**
   * Global Typekit instance bound to the current program.
   */
  $$: Typekit | undefined;

  /**
   * A map of all loaded TypeSpec libraries.
   */
  libs: Record<string, unknown> | undefined;
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
  console.info(" - `compiler`: The TypeSpec compiler API.");
  console.info(" - `$$`: A Typekit instance bound to the current program.");
  console.info(" - `libs`: A map of all loaded TypeSpec libraries.");
}

/**
 * Get the global debug variables bound to the `window` object.
 */
export function debugGlobals(): DebugGlobals {
  return window as unknown as DebugGlobals;
}

/**
 * Gets the global debug libraries
 */
export function debugLibs(): Record<string, unknown> {
  return ((window as unknown as DebugGlobals).libs ??= {});
}
