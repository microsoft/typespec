// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { NoTarget, Program, Tracer } from "@typespec/compiler";
import { getTracer, reportDiagnostic as libReportDiagnostic } from "./lib.js";

type SecondParameter<T extends (...args: any) => any> = T extends (arg1: any, arg2: infer P, ...args: any) => any ? P : never;

/**
 * The Logger class for the emitter.
 * @beta
 */
export class Logger {
  private tracer: Tracer;
  private level: LoggerLevel;
  private program: Program;

  public constructor(program: Program, level?: LoggerLevel) {
    this.tracer = getTracer(program);
    this.level = level ?? LoggerLevel.INFO;
    this.program = program;
  }

  reportDiagnostic(diag: SecondParameter<typeof libReportDiagnostic>): void {
    libReportDiagnostic(this.program, diag);
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

/**
 * The Logger level to use for logging. The default is `info`.
 * @beta
 */
export enum LoggerLevel {
  INFO = "info",
  DEBUG = "debug",
  VERBOSE = "verbose",
}
