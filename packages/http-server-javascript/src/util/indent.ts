// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

/**
 * Prepends a string `indentation` to each value in `values`.
 *
 * @param values - an iterable of strings to indent
 * @param indentation - the string to prepend to the beginning of each value
 */
export function* indent(values: Iterable<string>, indentation: string = "  "): Iterable<string> {
  for (const value of values) {
    yield indentation + value;
  }
}
