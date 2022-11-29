import { strictEqual } from "assert";
import { migrateCadlContent } from "../src/migrate.js";
import { migrateModelToScalar } from "../src/migrations/v0.38/model-to-scalars.js";

describe("migration: model to scalars", () => {
  it("convert", async () => {
    const [result] = await migrateCadlContent(
      `
model foo is string;

model bar {}

model foo is bar;

@test
@other
@get model Resource<T> is int32;
    `,
      migrateModelToScalar
    );

    strictEqual(
      result.trim(),
      `
scalar foo extends string;

model bar {}

model foo is bar;

@test
@other
@get
scalar Resource<T> extends int32;
    `.trim()
    );
  });
});
