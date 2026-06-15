import type { Model } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { createVisibilityFilters } from "../../src/lib/visibility.js";
import { Tester } from "../test-host.js";

function createTestEngine(program: Parameters<typeof createGraphQLMutationEngine>[0]) {
  return createGraphQLMutationEngine(program);
}

describe("GraphQL Mutation Engine - Visibility Filtering", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
  let filters: ReturnType<typeof createVisibilityFilters>;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  function mutateAsInput(engine: ReturnType<typeof createTestEngine>, model: Model) {
    filters = createVisibilityFilters(tester.program);
    return engine.mutateModel(model, GraphQLTypeContext.Input, filters.mutation);
  }

  function mutateAsOutput(engine: ReturnType<typeof createTestEngine>, model: Model) {
    filters = createVisibilityFilters(tester.program);
    return engine.mutateModel(model, GraphQLTypeContext.Output, filters.output);
  }

  describe("Input context", () => {
    it("excludes read-only properties from input mutation", async () => {
      const { Board } = await tester.compile(t.code`
        model ${t.model("Board")} {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Read)
          created_at: string;

          name: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsInput(engine, Board);

      expect(mutation.mutatedType.properties.has("name")).toBe(true);
      expect(mutation.mutatedType.properties.has("id")).toBe(false);
      expect(mutation.mutatedType.properties.has("created_at")).toBe(false);
    });

    it("includes create-visible properties in input mutation", async () => {
      const { User } = await tester.compile(t.code`
        model ${t.model("User")} {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Create, Lifecycle.Read)
          email: string;

          name: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsInput(engine, User);

      expect(mutation.mutatedType.properties.has("name")).toBe(true);
      expect(mutation.mutatedType.properties.has("email")).toBe(true);
      expect(mutation.mutatedType.properties.has("id")).toBe(false);
    });

    it("includes properties with no visibility decorator in input mutation", async () => {
      const { Item } = await tester.compile(t.code`
        model ${t.model("Item")} {
          name: string;
          description: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsInput(engine, Item);

      expect(mutation.mutatedType.properties.has("name")).toBe(true);
      expect(mutation.mutatedType.properties.has("description")).toBe(true);
    });
  });

  describe("Output context", () => {
    it("includes read-only properties in output mutation", async () => {
      const { Board } = await tester.compile(t.code`
        model ${t.model("Board")} {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Read)
          createdAt: string;

          name: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsOutput(engine, Board);

      expect(mutation.mutatedType.properties.has("id")).toBe(true);
      expect(mutation.mutatedType.properties.has("createdAt")).toBe(true);
      expect(mutation.mutatedType.properties.has("name")).toBe(true);
    });

    it("excludes create-only properties from output mutation", async () => {
      const { User } = await tester.compile(t.code`
        model ${t.model("User")} {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Create)
          password: string;

          name: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsOutput(engine, User);

      expect(mutation.mutatedType.properties.has("id")).toBe(true);
      expect(mutation.mutatedType.properties.has("name")).toBe(true);
      expect(mutation.mutatedType.properties.has("password")).toBe(false);
    });

    it("includes properties with no visibility decorator in output mutation", async () => {
      const { Item } = await tester.compile(t.code`
        model ${t.model("Item")} {
          name: string;
          description: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsOutput(engine, Item);

      expect(mutation.mutatedType.properties.has("name")).toBe(true);
      expect(mutation.mutatedType.properties.has("description")).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("does not filter properties when no type context is provided", async () => {
      const { Board } = await tester.compile(t.code`
        model ${t.model("Board")} {
          @visibility(Lifecycle.Read)
          id: string;

          name: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      // Mutate without context (e.g., type not reachable from an operation)
      const mutation = mutateAsOutput(engine, Board);

      // Both should be present since Output includes Read-visible properties
      expect(mutation.mutatedType.properties.has("id")).toBe(true);
      expect(mutation.mutatedType.properties.has("name")).toBe(true);
    });

    it("replaces with scalar when all properties are read-only in input context", async () => {
      const { ReadOnlyModel } = await tester.compile(t.code`
        model ${t.model("ReadOnlyModel")} {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Read)
          status: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsInput(engine, ReadOnlyModel);

      expect(mutation.mutationNode.isReplaced).toBe(true);
      const replacement = mutation.mutationNode.replacementNode!.mutatedType;
      expect(replacement.kind).toBe("Scalar");
      expect(replacement.name).toBe("ReadOnlyModelInput");
    });

    it("strips @compose from input variants to avoid spurious validation", async () => {
      const { User } = await tester.compile(t.code`
        @Interface(#{interfaceOnly: true})
        model Node {
          @visibility(Lifecycle.Read)
          id: string;
        }

        @compose(Node)
        model ${t.model("User")} {
          @visibility(Lifecycle.Read)
          id: string;

          name: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const mutation = mutateAsInput(engine, User);

      expect(mutation.mutatedType.properties.has("id")).toBe(false);
      expect(mutation.mutatedType.properties.has("name")).toBe(true);
      const hasCompose = mutation.mutatedType.decorators.some(
        (d) => d.decorator.name === "$compose",
      );
      expect(hasCompose).toBe(false);
    });

    it("excludes @invisible properties from both input and output", async () => {
      const { Secret } = await tester.compile(t.code`
        model ${t.model("Secret")} {
          @invisible(Lifecycle)
          internal: string;

          name: string;
        }
      `);

      const engine = createTestEngine(tester.program);
      const inputMutation = mutateAsInput(engine, Secret);
      const outputMutation = mutateAsOutput(engine, Secret);

      expect(inputMutation.mutatedType.properties.has("internal")).toBe(false);
      expect(inputMutation.mutatedType.properties.has("name")).toBe(true);
      expect(outputMutation.mutatedType.properties.has("internal")).toBe(false);
      expect(outputMutation.mutatedType.properties.has("name")).toBe(true);
    });

    it("properties are finalized with mutated names after mutateModel returns", async () => {
      const { User } = await tester.compile(t.code`
        model ${t.model("User")} {
          @visibility(Lifecycle.Read, Lifecycle.Query)
          user_id: string;

          @visibility(Lifecycle.Create, Lifecycle.Update)
          pass_word: string;

          display_name: string;
        }
      `);

      filters = createVisibilityFilters(tester.program);
      const engine = createTestEngine(tester.program);
      const queryMutation = engine.mutateModel(
        User, GraphQLTypeContext.Input, filters.query, "Query",
      );
      const mutMutation = engine.mutateModel(
        User, GraphQLTypeContext.Input, filters.mutation, "Mutation",
      );

      const queryKeys = [...queryMutation.mutatedType.properties.keys()].sort();
      const mutKeys = [...mutMutation.mutatedType.properties.keys()].sort();

      expect(queryKeys).toEqual(["displayName", "userId"]);
      expect(mutKeys).toEqual(["displayName", "passWord"]);
      expect(queryKeys.join(",")).not.toBe(mutKeys.join(","));
    });
  });
});
