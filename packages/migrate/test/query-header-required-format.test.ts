import { strictEqual } from "assert";
import { migrateTypeSpecContent } from "../src/migration-impl.js";
import { migrateQueryHeaderRequiredFormat } from "../src/migrations/v0.43/query-header-required-format.js";

describe("migration: Query Header required format", () => {
  it("adds format csv for header when type is an array", async () => {
    const [result] = await migrateTypeSpecContent(
      `
op test(@header foo: string[]): void
op test2(@Cadl.Http.header foo: string[]): void
op test3(@header("x-foo") foo: string[]): void
op test4(@header({name: "x-foo"}) foo: string[]): void
    `,
      migrateQueryHeaderRequiredFormat
    );

    strictEqual(
      result.trim(),
      `
op test(
  @header({
    format: "csv",
  })
  foo: string[],
): void;
op test2(
  @Cadl.Http.header({
    format: "csv",
  })
  foo: string[],
): void;
op test3(
  @header({
    name: "x-foo",
    format: "csv",
  })
  foo: string[],
): void;
op test4(
  @header({
    name: "x-foo",
    format: "csv",
  })
  foo: string[],
): void;
    `.trim()
    );
  });

  it("adds format multi for query when type is an array", async () => {
    const [result] = await migrateTypeSpecContent(
      `
op test(@query foo: string[]): void
op test2(@Cadl.Http.query foo: string[]): void
op test3(@query("x-foo") foo: string[]): void
op test4(@query({name: "x-foo"}) foo: string[]): void
    `,
      migrateQueryHeaderRequiredFormat
    );

    strictEqual(
      result.trim(),
      `
op test(
  @query({
    format: "multi",
  })
  foo: string[],
): void;
op test2(
  @Cadl.Http.query({
    format: "multi",
  })
  foo: string[],
): void;
op test3(
  @query({
    name: "x-foo",
    format: "multi",
  })
  foo: string[],
): void;
op test4(
  @query({
    name: "x-foo",
    format: "multi",
  })
  foo: string[],
): void;
    `.trim()
    );
  });
});
