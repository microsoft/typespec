import { type Model } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { InputType } from "../../src/components/types/index.js";
import { createGraphQLMutationEngine, GraphQLTypeContext } from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";
import { renderToSDL } from "./test-utils.js";

describe("InputType component", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("renders a basic input object type", async () => {
    const { Book } = await tester.compile(
      t.code`model ${t.model("Book")} { title: string; year: int32; }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Book, GraphQLTypeContext.Input).mutatedType;

    const sdl = renderToSDL(tester.program, <InputType type={mutated} />);

    expect(sdl).toMatch(/input BookInput \{/);
    expect(sdl).toContain("title: String!");
    expect(sdl).toContain("year: Int!");
  });

  it("renders input type with doc comment", async () => {
    const { Book } = await tester.compile(
      t.code`
        /** Data for creating a book */
        model ${t.model("Book")} { title: string; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Book, GraphQLTypeContext.Input).mutatedType;

    const sdl = renderToSDL(tester.program, <InputType type={mutated} />);

    expect(sdl).toContain('"Data for creating a book"');
    expect(sdl).toMatch(/input BookInput \{/);
  });

  it("renders oneOf input type with @oneOf directive", async () => {
    const { SearchBy } = await tester.compile(
      t.code`
        union ${t.union("SearchBy")} { byName: string; byId: int32; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutation = engine.mutateUnion(SearchBy, GraphQLTypeContext.Input);
    // In input context, union becomes a @oneOf Model
    const mutated = mutation.mutatedType as Model;

    const sdl = renderToSDL(tester.program, <InputType type={mutated} />);

    expect(sdl).toMatch(/input SearchByInput @oneOf \{/);
  });

  it("renders input type with optional fields", async () => {
    const { Filter } = await tester.compile(
      t.code`model ${t.model("Filter")} { name?: string; limit?: int32; }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Filter, GraphQLTypeContext.Input).mutatedType;

    const sdl = renderToSDL(tester.program, <InputType type={mutated} />);

    // Optional fields are nullable (no !)
    expect(sdl).toContain("name: String");
    expect(sdl).not.toContain("name: String!");
  });
});
