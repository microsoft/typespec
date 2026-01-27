// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { Diagnostic, Program, Tracer } from "@typespec/compiler";
import { getTracer } from "./lib.js";
import { LoggerLevel } from "./logger-level.js";

/**
 * The Logger class for the emitter.
 * @beta
 */
export class Logger {
  private tracer: Tracer;
  private level: LoggerLevel;
  private program: Program;

  public constructor(program: Program, level: LoggerLevel, collectDiagnostics: boolean = false) {
    this.tracer = getTracer(program);
    this.level = level;
    this.program = program;
  }

  /**
   * Get collected diagnostics. Only available if the logger was created with collectDiagnostics=true.
   * @returns The collected diagnostics.
   * @beta
   * @deprecated This method is deprecated and will be removed. Use sdkContext.__diagnostics instead.
   */
  public getDiagnostics(): readonly Diagnostic[] {
    return [];
  }

  trace(level: LoggerLevel, message: string): void {
    switch (level) {
      case LoggerLevel.INFO:
        this.info(message);
        break;
      case LoggerLevel.DEBUG:
        this.debug(message);
        break;
      case LoggerLevel.VERBOSE:
        this.verbose(message);
        break;
    }
  }

  info(message: string): void {
    if (
      this.level === LoggerLevel.INFO ||
      this.level === LoggerLevel.DEBUG ||
      this.level === LoggerLevel.VERBOSE
    ) {
      this.tracer.trace(LoggerLevel.INFO, message);
    }
  }

  debug(message: string): void {
    if (this.level === LoggerLevel.DEBUG || this.level === LoggerLevel.VERBOSE) {
      this.tracer.trace(LoggerLevel.DEBUG, message);
    }
  }

  verbose(message: string): void {
    if (this.level === LoggerLevel.VERBOSE) {
      this.tracer.trace(LoggerLevel.VERBOSE, message);
    }
  }
}
