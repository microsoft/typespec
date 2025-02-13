// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DiagnosticReport, NoTarget, Program, Tracer } from "@typespec/compiler";
import { diagMessages, getTracer, reportDiagnostic as libReportDiagnostic } from "./lib.js";
import { LoggerLevel } from "./logger-level.js";

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

  reportDiagnostic<C extends keyof typeof diagMessages, M extends keyof typeof diagMessages[C]>(diagnostic: DiagnosticReport<typeof diagMessages, C, M>): void {
    libReportDiagnostic(this.program, diagnostic);
  }

  warn(message: string): void {
    this.reportDiagnostic({
      code: "general-warning",
      format: { message: message },
      target: NoTarget,
    });
  }

  error(message: string): void {
    this.reportDiagnostic({
      code: "general-error",
      format: { message: message },
      target: NoTarget,
    });
  }
}
