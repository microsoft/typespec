// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { NoTarget, Program, Tracer } from "@typespec/compiler";
import { getTracer, reportDiagnostic } from "./lib.js";
import { LoggerLevel } from "./log-level.js";

/**
 * The Logger class for the emitter.
 * @beta
 */
export class Logger {
  private tracer: Tracer;
  private level: LoggerLevel;
  private program: Program;

  public constructor(program: Program, level: LoggerLevel) {
    this.tracer = getTracer(program);
    this.level = level;
    this.program = program;
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

  warn(message: string): void {
    reportDiagnostic(this.program, {
      code: "general-warning",
      format: { message: message },
      target: NoTarget,
    });
  }

  error(message: string): void {
    reportDiagnostic(this.program, {
      code: "general-error",
      format: { message: message },
      target: NoTarget,
    });
  }
}
