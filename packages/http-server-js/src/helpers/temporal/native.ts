// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

// Due to the lack of generally-available global type definitions for Temporal, we use `any` throughout this module.
// When global.d.ts eventually has definitions for Temporal, we can unify this module with `polyfill.ts`.

/**
 * Parses an HTTP date string (e.g. `Wed, 21 Oct 2015 07:28:00 GMT`) into a `Temporal.Instant`.
 * The date string must be in the format specified by RFC 7231.
 *
 * @param httpDate - The HTTP date string to parse.
 * @throws {RangeError} If the date string is invalid or cannot be parsed.
 * @returns The parsed `Temporal.Instant`.
 */
export function parseHttpDate(httpDate: string): any {
  const timestamp = globalThis.Date.parse(httpDate);

  if (isNaN(timestamp)) {
    throw new RangeError(`Invalid HTTP date: ${httpDate}`);
  }

  return (globalThis as any).Temporal.Instant.fromEpochMilliseconds(timestamp);
}

/**
 * Formats a `Temporal.Instant` into an HTTP date string (e.g. `Wed, 21 Oct 2015 07:28:00 GMT`).
 * The date string is formatted according to RFC 7231.
 *
 * @param instant - The `Temporal.Instant` to format.
 * @returns The formatted HTTP date string.
 */
export function formatHttpDate(instant: any) {
  const date = new Date(instant.epochMilliseconds);
  return date.toUTCString();
}

/**
 * Converts a `Temporal.Duration` to a number of seconds.
 * This method will throw an Error if the duration contains any years, months, weeks, or days, as those require a reference
 * point to calculate the total number of seconds.
 *
 * WARNING: If the total number of seconds is larger than the maximum safe integer in JavaScript, this method will
 * lose precision. @see durationTotalSecondsBigInt for a BigInt alternative.
 *
 * @param duration - the duration to calculate the total number of seconds for
 * @returns the total number of seconds in the duration
 */
export function durationTotalSeconds(duration: any): number {
  if (
    duration.years !== 0 ||
    duration.months !== 0 ||
    duration.weeks !== 0 ||
    duration.days !== 0
  ) {
    throw new Error(
      "Cannot calculate total seconds for a duration with years, months, weeks, or days.",
    );
  }

  return (
    duration.seconds +
    duration.minutes * 60 +
    duration.hours * 60 * 60 +
    duration.days * 24 * 60 * 60
  );
}

/**
 * Gets the total number of seconds in a duration.
 *
 * This method will throw an Error if the duration contains any years, months, weeks, or days, as those require a reference
 * point to calculate the total number of seconds. It will also throw an error if any of the components are not integers.
 *
 * @param duration - the duration to calculate the total number of seconds for
 * @returns the total number of seconds in the duration
 */
export function durationTotalSecondsBigInt(duration: any): bigint {
  if (
    duration.years !== 0 ||
    duration.months !== 0 ||
    duration.weeks !== 0 ||
    duration.days !== 0
  ) {
    throw new Error(
      "Cannot calculate total seconds for a duration with years, months, weeks, or days.",
    );
  }

  if (
    !Number.isInteger(duration.seconds) ||
    !Number.isInteger(duration.minutes) ||
    !Number.isInteger(duration.hours) ||
    !Number.isInteger(duration.days)
  ) {
    throw new Error("Duration components must be integers.");
  }

  return (
    BigInt(duration.seconds) +
    BigInt(duration.minutes) * 60n +
    BigInt(duration.hours) * 60n * 60n +
    BigInt(duration.days) * 24n * 60n * 60n
  );
}
