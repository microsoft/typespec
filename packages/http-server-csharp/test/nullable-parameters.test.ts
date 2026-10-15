import { expect, it } from "vitest";
import { EmitterTester, getStandardService } from "./test-host.js";

it("emits one nullable suffix for optional nullable value parameters", async () => {
  const { outputs } = await EmitterTester.compile(
    getStandardService(`
      enum Choice {
        one,
      }

      union MaybeInt {
        int32,
        null,
      }

      @route("/nullable")
      interface NullableParameters {
        @get test(
          @query value?: int32 | null,
          @query choice?: Choice | null,
          @query maybeInt?: MaybeInt | null,
        ): void;
      }
    `),
    {
      compilerOptions: {
        options: {
          "@typespec/http-server-csharp": {
            "emit-mocks": "mocks-only",
            "skip-format": true,
          },
        },
      },
    },
  );

  const interfaceContent = outputs["generated/operations/INullableParameters.cs"];
  const mockContent = outputs["mocks/NullableParameters.cs"];
  const controllerContent = outputs["generated/controllers/NullableParametersController.cs"];

  expect(interfaceContent).toBeDefined();
  expect(mockContent).toBeDefined();
  expect(controllerContent).toBeDefined();
  expect(interfaceContent).toContain("TestAsync(int? value, Choice? choice, int? maybeInt)");
  expect(mockContent).toContain("TestAsync(int? value, Choice? choice, int? maybeInt)");
  expect(controllerContent).toContain("int? value");
  expect(controllerContent).toContain("Choice? choice");
  expect(controllerContent).toContain("int? maybeInt");
  expect(interfaceContent).not.toMatch(/\w+\?\?\s+\w+/);
  expect(mockContent).not.toMatch(/\w+\?\?\s+\w+/);
  expect(controllerContent).not.toMatch(/\w+\?\?\s+\w+/);
});
