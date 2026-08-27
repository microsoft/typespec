import { beforeEach, expect, it } from "vitest";
import { ApiTester, compileAndDiagnose, getStandardService } from "./test-host.js";

let tester: Awaited<ReturnType<typeof ApiTester.createInstance>>;

beforeEach(async () => {
  tester = await ApiTester.createInstance();
});

it("emits one nullable suffix for optional nullable value parameters", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      enum Choice {
        one,
      }

      @route("/nullable")
      interface NullableParameters {
        @get test(
          @query value?: int32 | null,
          @query choice?: Choice | null,
        ): void;
      }
    `),
    {
      "emit-mocks": "mocks-only",
      "skip-format": true,
    },
  );

  const interfaceContent = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/INullableParameters.cs"),
  )?.[1];
  const mockContent = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/NullableParameters.cs"),
  )?.[1];

  expect(interfaceContent).toContain("TestAsync(int? value, Choice? choice)");
  expect(mockContent).toContain("TestAsync(int? value, Choice? choice)");
  expect(interfaceContent).not.toMatch(/\w+\?\?\s+\w+/);
  expect(mockContent).not.toMatch(/\w+\?\?\s+\w+/);
});
