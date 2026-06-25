import { t, TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EnumType } from "../../src/components/types/index.js";
import { createGraphQLMutationEngine } from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";
import { renderToSDL } from "./test-utils.js";

describe("EnumType component", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("renders a basic enum", async () => {
    const { Color } = await tester.compile(
      t.code`enum ${t.enum("Color")} { Red, Green, Blue }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateEnum(Color).mutatedType;

    const sdl = renderToSDL(tester.program, <EnumType type={mutated} />);

    expect(sdl).toContain("enum Color");
    expect(sdl).toContain("RED");
    expect(sdl).toContain("GREEN");
    expect(sdl).toContain("BLUE");
  });

  it("renders enum with doc comment as description", async () => {
    const { Role } = await tester.compile(
      t.code`
        /** The role a user can have */
        enum ${t.enum("Role")} { Admin, User }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateEnum(Role).mutatedType;

    const sdl = renderToSDL(tester.program, <EnumType type={mutated} />);

    expect(sdl).toContain('"The role a user can have"');
    expect(sdl).toContain("enum Role");
  });

  it("renders enum with member descriptions", async () => {
    const { Status } = await tester.compile(
      t.code`
        enum ${t.enum("Status")} {
          /** Currently active */
          Active,
          /** No longer active */
          Inactive,
        }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateEnum(Status).mutatedType;

    const sdl = renderToSDL(tester.program, <EnumType type={mutated} />);

    expect(sdl).toContain('"Currently active"');
    expect(sdl).toContain('"No longer active"');
  });

  it("renders enum with deprecated members", async () => {
    const { Status } = await tester.compile(
      t.code`
        enum ${t.enum("Status")} {
          Active,
          #deprecated "use Active instead"
          Legacy,
        }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateEnum(Status).mutatedType;

    const sdl = renderToSDL(tester.program, <EnumType type={mutated} />);

    expect(sdl).toContain("@deprecated");
    expect(sdl).toContain("use Active instead");
  });

  it("renders enum with mutation-engine-sanitized member names", async () => {
    const { E } = await tester.compile(
      t.code`enum ${t.enum("E")} { \`$val1$\`, \`val-2\` }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateEnum(E).mutatedType;

    const sdl = renderToSDL(tester.program, <EnumType type={mutated} />);

    // Mutation engine: sanitize → CONSTANT_CASE
    expect(sdl).toContain("_VAL_1");
    expect(sdl).toContain("VAL_2");
  });
});
