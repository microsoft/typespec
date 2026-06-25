import { t, TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { GraphQLTypeUsage, resolveTypeUsage } from "../src/type-usage.js";
import { Tester } from "./test-host.js";

describe("type-usage", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  function resolve(omitUnreachableTypes = true) {
    return resolveTypeUsage(tester.program, tester.program.getGlobalNamespaceType(), omitUnreachableTypes);
  }


  describe("basic output reachability", () => {
    it("marks return type model as Output", async () => {
      const { User } = await tester.compile(
        t.code`
          model ${t.model("User")} { id: string; }
          @query op getUser(): User;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(User)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.getUsage(User)?.has(GraphQLTypeUsage.Input)).toBeFalsy();
      expect(resolver.isUnreachable(User)).toBe(false);
    });
  });

  describe("basic input reachability", () => {
    it("marks parameter type model as Input", async () => {
      const { UserInput } = await tester.compile(
        t.code`
          model ${t.model("UserInput")} { name: string; }
          @query op createUser(input: UserInput): void;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(UserInput)?.has(GraphQLTypeUsage.Input)).toBe(true);
      expect(resolver.getUsage(UserInput)?.has(GraphQLTypeUsage.Output)).toBeFalsy();
      expect(resolver.isUnreachable(UserInput)).toBe(false);
    });
  });

  describe("nested reachability", () => {
    it("tracks models referenced indirectly via properties", async () => {
      const { Address } = await tester.compile(
        t.code`
          model ${t.model("Address")} { street: string; }
          model User { id: string; address: Address; }
          @query op getUser(): User;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(Address)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.isUnreachable(Address)).toBe(false);
    });
  });

  describe("dual usage", () => {
    it("model used as both parameter and return gets both flags", async () => {
      const { Book } = await tester.compile(
        t.code`
          model ${t.model("Book")} { title: string; }
          @query op getBook(): Book;
          @mutation op updateBook(input: Book): void;
        `,
      );

      const resolver = resolve();
      const usage = resolver.getUsage(Book);
      expect(usage?.has(GraphQLTypeUsage.Input)).toBe(true);
      expect(usage?.has(GraphQLTypeUsage.Output)).toBe(true);
    });

    it("nested model shared across input and output in a single operation gets both flags", async () => {
      const { Shared } = await tester.compile(
        t.code`
          model ${t.model("Shared")} { id: string; }
          model InputData { shared: Shared; }
          model OutputData { shared: Shared; }
          @query op transform(input: InputData): OutputData;
        `,
      );

      const resolver = resolve();
      const usage = resolver.getUsage(Shared);
      expect(usage?.has(GraphQLTypeUsage.Input)).toBe(true);
      expect(usage?.has(GraphQLTypeUsage.Output)).toBe(true);
    });
  });

  describe("unreachable types", () => {
    it("marks unreferenced type as unreachable when omitUnreachableTypes=true", async () => {
      const { Orphan } = await tester.compile(
        t.code`
          model ${t.model("Orphan")} { value: int32; }
          model Used { id: string; }
          @query op getUsed(): Used;
        `,
      );

      const resolver = resolve(true);
      expect(resolver.isUnreachable(Orphan)).toBe(true);
      expect(resolver.getUsage(Orphan)).toBeUndefined();
    });

    it("marks unreferenced type as reachable when omitUnreachableTypes=false", async () => {
      const { Orphan } = await tester.compile(
        t.code`
          model ${t.model("Orphan")} { value: int32; }
          model Used { id: string; }
          @query op getUsed(): Used;
        `,
      );

      const resolver = resolve(false);
      expect(resolver.isUnreachable(Orphan)).toBe(false);
      // Reachable but no usage flags — it wasn't actually referenced by any operation
      expect(resolver.getUsage(Orphan)).toBeUndefined();
    });

    it("preserves usage flags for referenced types when omitUnreachableTypes=false", async () => {
      const { Used } = await tester.compile(
        t.code`
          model ${t.model("Used")} { id: string; }
          @query op getUsed(): Used;
        `,
      );

      const resolver = resolve(false);
      expect(resolver.isUnreachable(Used)).toBe(false);
      expect(resolver.getUsage(Used)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.getUsage(Used)?.has(GraphQLTypeUsage.Input)).toBeFalsy();
    });
  });

  describe("circular references", () => {
    it("handles self-referencing model without infinite loop", async () => {
      const { TreeNode } = await tester.compile(
        t.code`
          model ${t.model("TreeNode")} { id: string; children: TreeNode[]; }
          @query op getRoot(): TreeNode;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(TreeNode)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.isUnreachable(TreeNode)).toBe(false);
    });
  });

  describe("union variant reachability", () => {
    it("tracks types inside a union used in an operation", async () => {
      const { Cat, Dog, Pet } = await tester.compile(
        t.code`
          model ${t.model("Cat")} { name: string; }
          model ${t.model("Dog")} { breed: string; }
          union ${t.union("Pet")} { cat: Cat; dog: Dog; }
          @query op getPet(): Pet;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(Pet)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.getUsage(Cat)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.getUsage(Dog)?.has(GraphQLTypeUsage.Output)).toBe(true);
    });
  });

  describe("array element reachability", () => {
    it("marks element type of array return as Output", async () => {
      const { User } = await tester.compile(
        t.code`
          model ${t.model("User")} { id: string; }
          @query op listUsers(): User[];
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(User)?.has(GraphQLTypeUsage.Output)).toBe(true);
    });
  });

  describe("base model reachability", () => {
    it("tracks parent model when child is reachable", async () => {
      const { Parent } = await tester.compile(
        t.code`
          model ${t.model("Parent")} { id: string; }
          model Child extends Parent { extra: string; }
          @query op getChild(): Child;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(Parent)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.isUnreachable(Parent)).toBe(false);
    });
  });

  describe("enum and scalar reachability", () => {
    it("tracks enum types referenced from operations", async () => {
      const { Status } = await tester.compile(
        t.code`
          enum ${t.enum("Status")} { Active; Inactive; }
          model User { id: string; status: Status; }
          @query op getUser(): User;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(Status)?.has(GraphQLTypeUsage.Output)).toBe(true);
    });

    it("tracks scalar types referenced from operations", async () => {
      const { MyId } = await tester.compile(
        t.code`
          scalar ${t.scalar("MyId")} extends string;
          model User { id: MyId; }
          @query op getUser(): User;
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(MyId)?.has(GraphQLTypeUsage.Output)).toBe(true);
    });
  });

  describe("interface operations", () => {
    it("walks operations inside interface blocks", async () => {
      const { User } = await tester.compile(
        t.code`
          model ${t.model("User")} { id: string; }
          interface UserService {
            @query getUser(): User;
          }
        `,
      );

      const resolver = resolve();
      expect(resolver.getUsage(User)?.has(GraphQLTypeUsage.Output)).toBe(true);
      expect(resolver.isUnreachable(User)).toBe(false);
    });
  });

});
