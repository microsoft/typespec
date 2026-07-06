import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ScalarType } from "../../src/components/types/index.js";
import { createGraphQLMutationEngine } from "../../src/mutation-engine/index.js";
import { getSpecifiedBy } from "../../src/lib/specified-by.js";
import { Tester } from "../test-host.js";
import { renderToSDL } from "./test-utils.js";

describe("ScalarType component", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("renders a custom scalar", async () => {
    const { DateTime } = await tester.compile(
      t.code`scalar ${t.scalar("DateTime")} extends string;`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateScalar(DateTime).mutatedType;

    const sdl = renderToSDL(tester.program, <ScalarType type={mutated} />);

    expect(sdl).toContain("scalar DateTime");
  });

  it("renders a scalar with doc comment description", async () => {
    const { JSON } = await tester.compile(
      t.code`
        /** Arbitrary JSON blob */
        scalar ${t.scalar("JSON")} extends string;
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateScalar(JSON).mutatedType;

    const sdl = renderToSDL(tester.program, <ScalarType type={mutated} />);

    expect(sdl).toContain('"Arbitrary JSON blob"');
    expect(sdl).toContain("scalar JSON");
  });

  it("renders a scalar with @specifiedBy", async () => {
    const { MyScalar } = await tester.compile(
      t.code`
        @specifiedBy("https://example.com/spec")
        scalar ${t.scalar("MyScalar")} extends string;
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateScalar(MyScalar).mutatedType;
    const specUrl = getSpecifiedBy(tester.program, mutated);

    const sdl = renderToSDL(
      tester.program,
      <ScalarType type={mutated} specificationUrl={specUrl} />,
    );

    expect(sdl).toContain("@specifiedBy");
    expect(sdl).toContain("https://example.com/spec");
  });

  it("renders a scalar without @specifiedBy when not present", async () => {
    const { MyScalar } = await tester.compile(
      t.code`scalar ${t.scalar("MyScalar")} extends string;`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateScalar(MyScalar).mutatedType;

    const sdl = renderToSDL(tester.program, <ScalarType type={mutated} />);

    expect(sdl).toContain("scalar MyScalar");
    expect(sdl).not.toContain("@specifiedBy");
  });
});
