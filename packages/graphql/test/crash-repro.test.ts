import { describe, it, expect } from "vitest";
import { emitSingleSchemaWithDiagnostics } from "./test-host.js";

describe("crash: Record types", () => {
  it("Record<string> should emit as scalar", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User {
          name: string;
          metadata: Record<string>;
        }
        @query op getUser(): User;
      }
    `);
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toContain("type User");
  });
});

describe("crash: Generics", () => {
  it("instantiated generic model should emit", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model PagedResponse<T> {
          data: T[];
          totalCount: int32;
          hasMore: boolean;
        }
        model User { name: string; }
        @query op getUsers(): PagedResponse<User>;
      }
    `);
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toContain("type Query");
  });
});

describe("crash: empty input (all fields visibility-filtered)", () => {
  it("model with all read-only fields used as mutation input", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model ServerGenerated {
          @visibility(Lifecycle.Read)
          requestId: string;
          @visibility(Lifecycle.Read)
          timestamp: string;
        }
        @query op getInfo(): ServerGenerated;
        @mutation op trigger(info: ServerGenerated): boolean;
      }
    `);
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toContain("type Query");
  });
});

describe("crash: union as input", () => {
  it("union used as mutation parameter", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Cat { name: string; }
        model Dog { breed: string; }
        union Pet { cat: Cat, dog: Dog }
        @query op getPets(): Pet[];
        @mutation op adoptPet(pet: Pet): Cat | Dog;
      }
    `);
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toContain("type Query");
  });

  it("union as mutation input with visibility-filtered variant types", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Create, Lifecycle.Update)
          password: string;

          name: string;
        }
        model Admin {
          @visibility(Lifecycle.Read)
          id: string;

          role: string;
        }
        union Entity { user: User, admin: Admin }
        @query op getEntities(): Entity[];
        @mutation op createEntity(input: Entity): Entity;
      }
    `);
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "union Entity = User | Admin

      type User {
        id: String!
        name: String!
      }

      input UserInput {
        password: String!
        name: String!
      }

      type Admin {
        id: String!
        role: String!
      }

      input AdminInput {
        role: String!
      }

      input EntityInput @oneOf {
        user: UserInput
        admin: AdminInput
      }

      type Query {
        getEntities: [Entity!]!
      }

      type Mutation {
        createEntity(input: EntityInput!): Entity!
      }"
    `);
  });
});

describe("crash: nested generics", () => {
  it("nested generic BatchResult<Post> with PagedResponse<Post>[]", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model PagedResponse<T> { data: T[]; totalCount: int32; }
        model BatchResult<T> { pages: PagedResponse<T>[]; batchId: string; }
        model Post { title: string; }
        @query op getBatch(): BatchResult<Post>;
      }
    `);
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toContain("PagedResponseOfPost");
    expect(result.graphQLOutput).toContain("BatchResultOfPost");
  });
});
