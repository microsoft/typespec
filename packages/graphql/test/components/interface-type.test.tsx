import { t } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { InterfaceType } from "../../src/components/types/index.js";
import { createGraphQLMutationEngine, GraphQLTypeContext } from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";
import { renderToSDL } from "./test-utils.js";

describe("InterfaceType component", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("renders a basic interface type", async () => {
    const { Node } = await tester.compile(
      t.code`@\`interface\` model ${t.model("Node")} { id: string; }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Node, GraphQLTypeContext.Interface).mutatedType;

    const sdl = renderToSDL(tester.program, <InterfaceType type={mutated} />);

    expect(sdl).toMatch(/interface NodeInterface \{/);
    expect(sdl).toContain("id: String!");
  });

  it("renders interfaceOnly interface without suffix", async () => {
    const { Node } = await tester.compile(
      t.code`@\`interface\`(#{interfaceOnly: true}) model ${t.model("Node")} { id: string; }`,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Node, GraphQLTypeContext.Interface).mutatedType;

    const sdl = renderToSDL(tester.program, <InterfaceType type={mutated} />);

    expect(sdl).toMatch(/interface Node \{/);
    expect(sdl).not.toContain("NodeInterface");
  });

  it("renders interface with doc comment", async () => {
    const { Node } = await tester.compile(
      t.code`
        /** A uniquely identifiable entity */
        @\`interface\` model ${t.model("Node")} { id: string; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Node, GraphQLTypeContext.Interface).mutatedType;

    const sdl = renderToSDL(tester.program, <InterfaceType type={mutated} />);

    expect(sdl).toContain('"A uniquely identifiable entity"');
  });
});
