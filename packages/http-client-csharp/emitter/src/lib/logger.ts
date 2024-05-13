// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { NoTarget, Program, Tracer } from "@typespec/compiler";
import { getTracer, reportDiagnostic } from "./lib.js";

export enum LoggerLevel {
  INFO = 1,
  DEBUG = 2,
  VERBOSE = 3,
}

export class Logger {
  private static instance: Logger;
  private initialized: boolean = false;
  private tracer: Tracer;
  private level: LoggerLevel;
  private area: string = "@typespec/http-client-csharp";
  private program: Program;

  private constructor(program: Program, level: LoggerLevel) {
    this.tracer = getTracer(program);
    this.level = level;
    this.program = program;
  }

  static initialize(program: Program, level: LoggerLevel): void {
    if (!Logger.instance) {
      Logger.instance = new Logger(program, level);
      Logger.instance.initialized = true;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      throw new Error("Logger is not initialized. Call initialize() first.");
    }
    return Logger.instance;
  }

  info(message: string): void {
    if (!this.initialized) {
      throw new Error("Logger is not initialized. Call initialize() first.");
    }
    if (this.level <= LoggerLevel.INFO) {
      this.tracer.trace(this.area, `[${LoggerLevel.INFO}] ${message}`);
    }
  }

  debug(message: string): void {
    if (!this.initialized) {
      throw new Error("Logger is not initialized. Call initialize() first.");
    }
    if (this.level <= LoggerLevel.DEBUG) {
      this.tracer.trace(this.area, `[${LoggerLevel.DEBUG}] ${message}`);
    }
  }

  verbose(message: string): void {
    if (!this.initialized) {
      throw new Error("Logger is not initialized. Call initialize() first.");
    }
    if (this.level <= LoggerLevel.VERBOSE) {
      this.tracer.trace(this.area, `[${LoggerLevel.VERBOSE}] ${message}`);
    }
  }

  warn(message: string): void {
    if (!this.initialized) {
      throw new Error("Logger is not initialized. Call initialize() first.");
    }
    reportDiagnostic(this.program, {
      code: "General-Warning",
      format: { message: message },
      target: NoTarget,
    });
  }

  error(message: string): void {
    if (!this.initialized) {
      throw new Error("Logger is not initialized. Call initialize() first.");
    }
    reportDiagnostic(this.program, {
      code: "General-Error",
      format: { message: message },
      target: NoTarget,
    });
  }
}

// Export a single instance of the Logger class
export const logger = Logger.getInstance();
