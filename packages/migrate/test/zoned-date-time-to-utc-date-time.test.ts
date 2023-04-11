import { strictEqual } from "assert";
import { migrateTypeSpecContent } from "../src/migration-impl.js";
import { migrateZonedDateTimeToUtcDateTime } from "../src/migrations/v0.43/zoned-date-time-to-utc-date-time.js";

describe("migration: zonedDateTime to utcDateTime", () => {
  it("migrates type references and not other identifiers", async () => {
    const [result] = await migrateTypeSpecContent(
      `
      scalar instant extends zonedDateTime;

      model Widget {
        created: zonedDateTime;
        \`zonedDateTime\`: zonedDateTime;
      }
      
      @error
      model Error {
        code: int32;
        message: string;
      }
       
      op test(@path id: string, time: zonedDateTime) : zonedDateTime;
      op test(@path id: string, time: zonedDateTime) : zonedDateTime | Error;
    `,
      migrateZonedDateTimeToUtcDateTime
    );

    strictEqual(
      result.trim(),
      // note that the `zonedDateTime` property name no longer needs to be escaped with backticks
      `
scalar instant extends utcDateTime;

model Widget {
  created: utcDateTime;
  zonedDateTime: utcDateTime;
}

@error
model Error {
  code: int32;
  message: string;
}

op test(@path id: string, time: utcDateTime): utcDateTime;
op test(@path id: string, time: utcDateTime): utcDateTime | Error;
`.trim()
    );
  });
});
