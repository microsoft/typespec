// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { Diagnostic, DiagnosticReport, NoTarget, Program, Tracer } from "@typespec/compiler";
import {
  createDiagnostic,
  DiagnosticMessagesMap,
  getTracer,
  reportDiagnostic as libReportDiagnostic,
} from "./lib.js";
import { LoggerLevel } from "./logger-level.js";

/**
 * The Logger class for the emitter.
 * @beta
 */
export class Logger {
  private tracer: Tracer;
  private level: LoggerLevel;
  private program: Program;
  private collectedDiagnostics: Diagnostic[] | undefined;

  public constructor(program: Program, level: LoggerLevel, collectDiagnostics: boolean = false) {
    this.tracer = getTracer(program);
    this.level = level;
    this.program = program;
    this.collectedDiagnostics = collectDiagnostics ? [] : undefined;
  }

  /**
   * Get collected diagnostics. Only available if the logger was created with collectDiagnostics=true.
   * @returns The collected diagnostics.
   * @beta
   */
  public getDiagnostics(): readonly Diagnostic[] {
    return this.collectedDiagnostics ?? [];
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

  reportDiagnostic<C extends keyof DiagnosticMessagesMap, M extends keyof DiagnosticMessagesMap[C]>(
    diag: DiagnosticReport<DiagnosticMessagesMap, C, M>,
  ): void {
    if (this.collectedDiagnostics) {
      // In collecting mode, store the diagnostic instead of reporting it
      this.collectedDiagnostics.push(createDiagnostic(diag));
    } else {
      // In normal mode, report the diagnostic directly
      libReportDiagnostic(this.program, diag);
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
