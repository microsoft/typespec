import { deepStrictEqual, strictEqual, throws } from "assert";
import { describe, it } from "vitest";
import { Duration } from "../src/helpers/datetime.js";

describe("datetime", () => {
  describe("duration", () => {
    it("parses an ISO8601 duration string", () => {
      deepStrictEqual(Duration.parseISO8601("P1Y2M3D"), {
        sign: "+",
        years: 1,
        months: 2,
        weeks: 0,
        days: 3,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it("parses a negative ISO8601 duration string", () => {
      deepStrictEqual(Duration.parseISO8601("-P1Y2M3D"), {
        sign: "-",
        years: 1,
        months: 2,
        weeks: 0,
        days: 3,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it("parses a duration string with hours and minutes", () => {
      deepStrictEqual(Duration.parseISO8601("PT1H2M"), {
        sign: "+",
        years: 0,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 1,
        minutes: 2,
        seconds: 0,
      });
    });

    it("parses a duration string with fractional years", () => {
      deepStrictEqual(Duration.parseISO8601("P1.5Y"), {
        sign: "+",
        years: 1.5,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it("does not parse an invalid duration string", () => {
      throws(() => Duration.parseISO8601("1Y2M3D4H"), {
        message: "Invalid ISO8601 duration: 1Y2M3D4H",
      });
    });

    it("does not parse a duration string with too many digits in a component", () => {
      throws(
        () =>
          Duration.parseISO8601(
            "P123429384502934875023948572039485720394857230948572309485723094857203948572309456789.19821374652345232304958273049582730495827340958720349857452345234529223450928347592834387456928374659238476Y",
          ),
        {
          message:
            "ISO8601 duration string is too long: P123429384502934875023948572039485720394857230948572309485723094857203948572309456789.19821374652345232304958273049582730495827340958720349857452345234529223450928347592834387456928374659238476Y",
        },
      );
    });

    it("does not parse a duration string with an invalid group", () => {
      throws(() => Duration.parseISO8601("P1Y2M3D4H5X"), {
        message: "Invalid ISO8601 duration: P1Y2M3D4H5X",
      });
    });

    it("does not parse a duration string with missing group", () => {
      throws(() => Duration.parseISO8601("P1Y2M3D4H5.5"), {
        message: "Invalid ISO8601 duration: P1Y2M3D4H5.5",
      });
    });

    it("does not parse a duration string with multiple points", () => {
      throws(() => Duration.parseISO8601("P1.2.3Y"), {
        message: "Invalid ISO8601 duration: P1.2.3Y",
      });
    });

    it("allows comma as decimal separator", () => {
      deepStrictEqual(Duration.parseISO8601("P1,5Y4.2DT1,005S"), {
        sign: "+",
        years: 1.5,
        months: 0,
        weeks: 0,
        days: 4.2,
        hours: 0,
        minutes: 0,
        seconds: 1.005,
      });
    });

    it("writes an ISO8601 duration string", () => {
      const duration: Duration = {
        sign: "+",
        years: 1,
        months: 2,
        weeks: 3,
        days: 4,
        hours: 5,
        minutes: 6,
        seconds: 7,
      };

      strictEqual(Duration.toISO8601(duration), "P1Y2M3W4DT5H6M7S");
    });

    it("writes a negative ISO8601 duration string", () => {
      const duration: Duration = {
        sign: "-",
        years: 1,
        months: 2,
        weeks: 3,
        days: 4,
        hours: 5,
        minutes: 6,
        seconds: 7,
      };

      strictEqual(Duration.toISO8601(duration), "-P1Y2M3W4DT5H6M7S");
    });

    it("writes a duration string with only years", () => {
      const duration: Duration = {
        sign: "+",
        years: 1,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

      strictEqual(Duration.toISO8601(duration), "P1Y");
    });

    it("writes a duration string with only hours", () => {
      const duration: Duration = {
        sign: "+",
        years: 0,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 36,
        minutes: 0,
        seconds: 0,
      };

      strictEqual(Duration.toISO8601(duration), "PT36H");
    });

    it("writes a duration string with fractional amounts", () => {
      const duration: Duration = {
        sign: "+",
        years: 1.5,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 1.005,
      };

      strictEqual(Duration.toISO8601(duration), "P1.5YT1.005S");
    });

    it("computes total seconds in durations", () => {
      const duration = Duration.parseISO8601("PT22H96M60S");

      strictEqual(Duration.totalSeconds(duration), 22 * 60 * 60 + 96 * 60 + 60);
      strictEqual(Duration.totalSecondsBigInt(duration), 22n * 60n * 60n + 96n * 60n + 60n);
    });

    it("computes total seconds in durations with fractional amounts", () => {
      const duration = Duration.parseISO8601("PT1.5H22.005S");

      strictEqual(Duration.totalSeconds(duration), 1.5 * 60 * 60 + 22 + 0.005);
    });

    it("does not allow total seconds for durations with years, months, weeks, or days", () => {
      const durations = ["P1Y", "P1M", "P1W", "P1D"].map((iso) => Duration.parseISO8601(iso));

      for (const duration of durations) {
        throws(() => Duration.totalSeconds(duration), {
          message:
            "Cannot calculate total seconds for a duration with years, months, weeks, or days.",
        });

        throws(() => Duration.totalSecondsBigInt(duration), {
          message:
            "Cannot calculate total seconds for a duration with years, months, weeks, or days.",
        });
      }
    });

    it("does not allow total seconds as bigint for durations with fractional amounts", () => {
      const durations = ["PT1.5H", "PT1.5M", "PT1.5S", "PT1H1.5M", "PT1H1.5S", "PT1M1.5S"].map(
        (iso) => Duration.parseISO8601(iso),
      );

      for (const duration of durations) {
        throws(() => Duration.totalSecondsBigInt(duration), {
          message:
            "Cannot calculate total seconds as a BigInt for a duration with non-integer components.",
        });
      }
    });
  });
});
