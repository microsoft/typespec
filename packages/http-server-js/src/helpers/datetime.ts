// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

// #region Duration

/**
 * Regular expression for matching ISO8601 duration strings.
 *
 * Yields:
 * - 0: the full match
 * - 1: the sign (optional)
 * - 2: years (optional)
 * - 3: months (optional)
 * - 4: weeks (optional)
 * - 5: days (optional)
 * - 6: hours (optional)
 * - 7: minutes (optional)
 * - 8: seconds (optional)
 */
const ISO8601_DURATION_REGEX =
  /^(-)?P(?:((?:\d*[.,])?\d+)Y)?(?:((?:\d*[.,])?\d+)M)?(?:((?:\d*[.,])?\d+)W)?(?:((?:\d*[.,])?\d+)D)?(?:T(?:((?:\d*[.,])?\d+)H)?(?:((?:\d*[.,])?\d+)M)?(?:((?:\d*[.,])?\d+)S)?)?$/;

/**
 * A duration of time, measured in years, months, weeks, days, hours, minutes, and seconds.
 *
 * The values may be fractional and are not normalized (e.g. 36 hours is not the same duration as 1 day and 12 hours
 * when accounting for Daylight Saving Time changes or leap seconds).
 *
 * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
 */
export interface Duration {
  /**
   * "+" if the duration is positive, "-" if the duration is negative.
   */
  sign: "+" | "-";
  /**
   * The number of years in the duration.
   */
  years: number;
  /**
   * The number of months in the duration.
   */
  months: number;
  /**
   * The number of weeks in the duration.
   */
  weeks: number;
  /**
   * The number of days in the duration.
   */
  days: number;
  /**
   * The number of hours in the duration.
   */
  hours: number;
  /**
   * The number of minutes in the duration.
   */
  minutes: number;
  /**
   * The number of seconds in the duration.
   */
  seconds: number;
}

export const Duration = Object.freeze({
  /**
   * Parses an ISO8601 duration string into an object.
   *
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   *
   * @param duration - the duration string to parse
   * @returns an object containing the parsed duration
   */
  parseISO8601(duration: string, maxLength: number = 100): Duration {
    duration = duration.trim();
    if (duration.length > maxLength)
      throw new Error(`ISO8601 duration string is too long: ${duration}`);

    const match = duration.match(ISO8601_DURATION_REGEX);

    if (!match) throw new Error(`Invalid ISO8601 duration: ${duration}`);

    return {
      sign: match[1] === undefined ? "+" : (match[1] as Duration["sign"]),
      years: parseFloatNormal(match[2]),
      months: parseFloatNormal(match[3]),
      weeks: parseFloatNormal(match[4]),
      days: parseFloatNormal(match[5]),
      hours: parseFloatNormal(match[6]),
      minutes: parseFloatNormal(match[7]),
      seconds: parseFloatNormal(match[8]),
    };

    function parseFloatNormal(match: string | undefined): number {
      if (match === undefined) return 0;

      const normalized = match.replace(",", ".");

      const parsed = parseFloat(normalized);

      if (isNaN(parsed))
        throw new Error(`Unreachable: Invalid number in ISO8601 duration string: ${match}`);

      return parsed;
    }
  },
  /**
   * Writes a Duration to an ISO8601 duration string.
   *
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   *
   * @param duration - the duration to write to a string
   * @returns a string in ISO8601 duration format
   */
  toISO8601(duration: Duration): string {
    const sign = duration.sign === "+" ? "" : "-";

    const years =
      duration.years !== 0 && !isNaN(Number(duration.years)) ? `${duration.years}Y` : "";
    const months =
      duration.months !== 0 && !isNaN(Number(duration.months)) ? `${duration.months}M` : "";
    const weeks =
      duration.weeks !== 0 && !isNaN(Number(duration.weeks)) ? `${duration.weeks}W` : "";
    const days = duration.days !== 0 && !isNaN(Number(duration.days)) ? `${duration.days}D` : "";

    let time = "";

    const _hours = duration.hours !== 0 && !isNaN(Number(duration.hours));
    const _minutes = duration.minutes !== 0 && !isNaN(Number(duration.minutes));
    const _seconds = duration.seconds !== 0 && !isNaN(Number(duration.seconds));

    if (_hours || _minutes || _seconds) {
      const hours = _hours ? `${duration.hours}H` : "";
      const minutes = _minutes ? `${duration.minutes}M` : "";
      const seconds = _seconds ? `${duration.seconds}S` : "";

      time = `T${hours}${minutes}${seconds}`;
    }

    return `${sign}P${years}${months}${weeks}${days}${time}`;
  },
});

// #endregion
