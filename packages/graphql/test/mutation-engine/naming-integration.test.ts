import type { Model } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";

describe("Mutation Engine - Naming Pipelines", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;

  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  describe("Model naming", () => {
    it("PascalCases model names", async () => {
      await tester.compile(t.code`model ${t.model("ad_account")} { id: string; }`);
      const model = tester.program.getGlobalNamespaceType().models.get("ad_account")!;

      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateModel(model, GraphQLTypeContext.Output);

      expect(mutated.mutatedType.name).toBe("AdAccount");
    });

    it("appends Input suffix for input context", async () => {
      await tester.compile(t.code`model ${t.model("User")} { id: string; }`);
      const model = tester.program.getGlobalNamespaceType().models.get("User")!;

      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateModel(model, GraphQLTypeContext.Input);

      expect(mutated.mutatedType.name).toBe("UserInput");
    });

    it("PascalCases before appending Input suffix", async () => {
      await tester.compile(t.code`model ${t.model("ad_account")} { id: string; }`);
      const model = tester.program.getGlobalNamespaceType().models.get("ad_account")!;

      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateModel(model, GraphQLTypeContext.Input);

      expect(mutated.mutatedType.name).toBe("AdAccountInput");
    });

    it("composes template names", async () => {
      const { TestNs } = await tester.compile(t.code`
        namespace ${t.namespace("TestNs")} {
          model Board { id: string; }
          model PaginatedModel<T> { items: T[]; }
          op get(): PaginatedModel<Board>;
        }
      `);

      const op = TestNs.operations.get("get")!;
      const templateInstance = op.returnType as Model;

      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateModel(templateInstance, GraphQLTypeContext.Output);

      expect(mutated.mutatedType.name).toBe("PaginatedModelOfBoard");
    });
  });

  describe("ModelProperty naming", () => {
    it("camelCases property names", async () => {
      await tester.compile(t.code`model ${t.model("Foo")} { ad_account_id: string; }`);
      const model = tester.program.getGlobalNamespaceType().models.get("Foo")!;

      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateModel(model, GraphQLTypeContext.Output);

      const propNames = Array.from(mutated.mutatedType.properties.values()).map((p) => p.name);
      expect(propNames).toContain("adAccountId");
    });
  });

  describe("Enum naming", () => {
    it("PascalCases enum names", async () => {
      await tester.compile(t.code`enum ${t.enum("my_status")} { Active }`);
      const enumType = tester.program.getGlobalNamespaceType().enums.get("my_status")!;

      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateEnum(enumType);

      expect(mutated.mutatedType.name).toBe("MyStatus");
    });
  });

  describe("EnumMember naming", () => {
    it("CONSTANT_CASEs enum member names", async () => {
      await tester.compile(t.code`enum ${t.enum("Status")} { activeStatus, inactiveStatus }`);
      const enumType = tester.program.getGlobalNamespaceType().enums.get("Status")!;

      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateEnum(enumType);

      const memberNames = Array.from(mutated.mutatedType.members.values()).map((m) => m.name);
      expect(memberNames).toContain("ACTIVE_STATUS");
      expect(memberNames).toContain("INACTIVE_STATUS");
    });
  });

  describe("Operation naming", () => {
    it("camelCases operation names", async () => {
      const { TestNs } = await tester.compile(t.code`
        namespace ${t.namespace("TestNs")} {
          op get_user(): string;
        }
      `);

      const op = TestNs.operations.get("get_user")!;
      const engine = createGraphQLMutationEngine(tester.program);
      const mutated = engine.mutateOperation(op);

      expect(mutated.mutatedType.name).toBe("getUser");
    });
  });
});
