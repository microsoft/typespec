import { strictEqual } from "assert";
import { migrateTypeSpecContent } from "../src/migrate.js";
import { migrateModelToScalar } from "../src/migrations/v0.38/model-to-scalars.js";

describe("migration: model to scalars", () => {
  it("various models", async () => {
    const [result] = await migrateTypeSpecContent(
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

  it("inside namespace", async () => {
    const [result] = await migrateTypeSpecContent(
      `
namespace MyService {        
  model foo is string;
}
    `,
      migrateModelToScalar
    );

    strictEqual(
      result.trim(),
      `
namespace MyService {
  scalar foo extends string;
}
    `.trim()
    );
  });

  it("with operations", async () => {
    const [result] = await migrateTypeSpecContent(
      `
model foo is string;

op test(): string;
    `,
      migrateModelToScalar
    );

    strictEqual(
      result.trim(),
      `
scalar foo extends string;

op test(): string;
    `.trim()
    );
  });
});
