// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

/**
 * A utility error for unimplemented functionality.
 */
export class UnimplementedError extends Error {
  constructor(message: string) {
    super(`Unimplemented: ${message}`);
  }
}

/**
 * A utility error for unreachable code paths.
 */
export class UnreachableError extends Error {
  constructor(message: string, values?: Record<string, never>) {
    let fullMessage = `Unreachable: ${message}`;

    if (values) {
      fullMessage += `\nObserved values: ${Object.entries(values)
        .map(([k, v]) => `  ${k}: ${String(v)}`)
        .join(",\n")}`;
    }

    super(fullMessage);
  }
}
