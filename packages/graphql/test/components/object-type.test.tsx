import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { InterfaceType, ObjectType } from "../../src/components/types/index.js";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";
import { renderToSDL } from "./test-utils.js";

describe("ObjectType component", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("renders a basic object type with fields", async () => {
    const { Book } = await tester.compile(
      t.code`model ${t.model("Book")} { title: string; year: int32; }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Book, GraphQLTypeContext.Output).mutatedType;

    const sdl = renderToSDL(tester.program, <ObjectType type={mutated} />);

    expect(sdl).toMatch(/type Book \{/);
    expect(sdl).toContain("title: String!");
    expect(sdl).toContain("year: Int!");
  });

  it("renders object type with doc comment", async () => {
    const { Book } = await tester.compile(
      t.code`
        /** A published book */
        model ${t.model("Book")} { title: string; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Book, GraphQLTypeContext.Output).mutatedType;

    const sdl = renderToSDL(tester.program, <ObjectType type={mutated} />);

    expect(sdl).toContain('"A published book"');
    expect(sdl).toMatch(/type Book \{/);
  });

  it("renders object type with optional fields as nullable", async () => {
    const { User } = await tester.compile(
      t.code`model ${t.model("User")} { name: string; nickname?: string; }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(User, GraphQLTypeContext.Output).mutatedType;

    const sdl = renderToSDL(tester.program, <ObjectType type={mutated} />);

    expect(sdl).toContain("name: String!");
    expect(sdl).toContain("nickname: String");
    // nickname should NOT have ! (it's optional/nullable)
    expect(sdl).not.toContain("nickname: String!");
  });

  it("renders object type implementing interfaces", async () => {
    const { Cat, Animal } = await tester.compile(
      t.code`
        @graphqlInterface model ${t.model("Animal")} { name: string; }
        @compose(Animal)
        model ${t.model("Cat")} { name: string; breed: string; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutatedCat = engine.mutateModel(Cat, GraphQLTypeContext.Output).mutatedType;
    const mutatedAnimal = engine.mutateModel(Animal, GraphQLTypeContext.Interface).mutatedType;

    const sdl = renderToSDL(
      tester.program,
      <>
        <InterfaceType type={mutatedAnimal} />
        <ObjectType type={mutatedCat} />
      </>,
    );

    expect(sdl).toMatch(/type Cat implements AnimalInterface \{/);
  });
});
