import { expect, describe, it } from "vitest";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { emitSingleSchemaWithDiagnostics } from "./test-host.js";

describe("e2e: operations", () => {
  it("renders query with parameters", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User { name: string; age: int32; }
        @query op getUser(id: string): User;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        name: String!
        age: Int!
      }

      type Query {
        getUser(id: String!): User!
      }"
    `);
  });

  it("renders mutation with input parameter model", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User { name: string; }
        @query op getUsers(): User[];
        @mutation op createUser(input: User): User;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        name: String!
      }

      input UserInput {
        name: String!
      }

      type Query {
        getUsers: [User!]!
      }

      type Mutation {
        createUser(input: UserInput!): User!
      }"
    `);
  });

  it("renders subscription", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Message { text: string; }
        @query op getMessages(): Message[];
        @subscription op onMessage(): Message;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Message {
        text: String!
      }

      type Query {
        getMessages: [Message!]!
      }

      type Subscription {
        onMessage: Message!
      }"
    `);
  });

  it("renders operation with optional parameters as nullable", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User { id: string; }
        @query op searchUsers(query?: string, limit?: int32): User[];
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        id: String!
      }

      type Query {
        searchUsers(query: String, limit: Int): [User!]!
      }"
    `);
  });

  it("renders operation returning nullable type", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User { name: string; }
        @query op getUser(id: string): User | null;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        name: String!
      }

      type Query {
        getUser(id: String!): User
      }"
    `);
  });

  it("renders operation returning list", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Book { title: string; }
        @query op getBooks(): Book[];
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Book {
        title: String!
      }

      type Query {
        getBooks: [Book!]!
      }"
    `);
  });
});

describe("e2e: models", () => {
  it("renders model with various scalar types", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Thing {
          name: string;
          count: int32;
          price: float64;
          active: boolean;
        }
        @query op getThing(): Thing;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Thing {
        name: String!
        count: Int!
        price: Float!
        active: Boolean!
      }

      type Query {
        getThing: Thing!
      }"
    `);
  });

  it("renders model with optional fields as nullable", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User { name: string; nickname?: string; }
        @query op getUser(): User;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        name: String!
        nickname: String
      }

      type Query {
        getUser: User!
      }"
    `);
  });

  it("renders model with array fields", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User { name: string; tags: string[]; }
        @query op getUser(): User;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        name: String!
        tags: [String!]!
      }

      type Query {
        getUser: User!
      }"
    `);
  });

  it("renders recursive model", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Person { name: string; friend?: Person; }
        @query op getPerson(): Person;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Person {
        name: String!
        friend: Person
      }

      type Query {
        getPerson: Person!
      }"
    `);
  });

  it("renders model with doc description", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        /** A user in the system */
        model User { name: string; }
        @query op getUser(): User;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      """"A user in the system"""
      type User {
        name: String!
      }

      type Query {
        getUser: User!
      }"
    `);
  });
});

describe("e2e: enums", () => {
  it("renders enum with CONSTANT_CASE members", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        enum Status { Active, Inactive, PendingReview }
        model Item { status: Status; }
        @query op getItem(): Item;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "enum Status {
        ACTIVE
        INACTIVE
        PENDING_REVIEW
      }

      type Item {
        status: Status!
      }

      type Query {
        getItem: Item!
      }"
    `);
  });

  it("renders enum with deprecated member", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        enum Status {
          Active,
          #deprecated "use Active"
          Legacy,
        }
        model Item { status: Status; }
        @query op getItem(): Item;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "enum Status {
        ACTIVE
        LEGACY @deprecated(reason: "use Active")
      }

      type Item {
        status: Status!
      }

      type Query {
        getItem: Item!
      }"
    `);
  });
});

describe("e2e: scalars", () => {
  it("renders custom scalar", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        scalar DateTime extends string;
        model Event { when: DateTime; }
        @query op getEvent(): Event;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "scalar DateTime

      type Event {
        when: DateTime!
      }

      type Query {
        getEvent: Event!
      }"
    `);
  });

  it("renders scalar with @specifiedBy", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        @specifiedBy("https://example.com/spec")
        scalar JSON extends string;
        model Data { payload: JSON; }
        @query op getData(): Data;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "scalar JSON @specifiedBy(url: "https://example.com/spec")

      type Data {
        payload: JSON!
      }

      type Query {
        getData: Data!
      }"
    `);
  });
});

describe("e2e: unions", () => {
  it("renders named union", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Cat { name: string; }
        model Dog { breed: string; }
        union Pet { cat: Cat, dog: Dog }
        @query op getPet(): Pet;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "union Pet = Cat | Dog

      type Cat {
        name: String!
      }

      type Dog {
        breed: String!
      }

      type Query {
        getPet: Pet!
      }"
    `);
  });

  it("renders union with scalar variants as wrapper models", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Cat { name: string; }
        union SearchResult { cat: Cat, text: string }
        @query op search(): SearchResult;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "union SearchResult = Cat | SearchResultTextUnionVariant

      type Cat {
        name: String!
      }

      type SearchResultTextUnionVariant {
        value: String!
      }

      type Query {
        search: SearchResult!
      }"
    `);
  });
});

describe("e2e: interfaces", () => {
  it("renders @Interface model as interface with suffix", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        @Interface model Animal { name: string; }
        @compose(Animal)
        model Cat { name: string; breed: string; }
        @query op getCat(): Cat;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "interface AnimalInterface {
        name: String!
      }

      type Cat implements AnimalInterface {
        name: String!
        breed: String!
      }

      type Query {
        getCat: Cat!
      }"
    `);
  });
});

describe("e2e: input/output splitting", () => {
  it("model used as both input and output gets two declarations", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Book { title: string; }
        @query op getBooks(): Book[];
        @mutation op createBook(input: Book): Book;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Book {
        title: String!
      }

      input BookInput {
        title: String!
      }

      type Query {
        getBooks: [Book!]!
      }

      type Mutation {
        createBook(input: BookInput!): Book!
      }"
    `);
  });

  it("input-only model does not produce output type", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Book { title: string; }
        model CreatePayload { title: string; year: int32; }
        @query op getBooks(): Book[];
        @mutation op createBook(input: CreatePayload): Book;
      }
    `, { "omit-unreachable-types": true });
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Book {
        title: String!
      }

      input CreatePayloadInput {
        title: String!
        year: Int!
      }

      type Query {
        getBooks: [Book!]!
      }

      type Mutation {
        createBook(input: CreatePayloadInput!): Book!
      }"
    `);
  });
});

describe("e2e: nullability combinations", () => {
  it("handles nullable array elements (T | null)[]", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Item { tags: (string | null)[]; }
        @query op getItem(): Item;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Item {
        tags: [String]!
      }

      type Query {
        getItem: Item!
      }"
    `);
  });

  it("handles nullable array T[] | null", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Item { tags: string[] | null; }
        @query op getItem(): Item;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Item {
        tags: [String!]
      }

      type Query {
        getItem: Item!
      }"
    `);
  });

  it("handles both nullable: (T | null)[] | null", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Item { tags: (string | null)[] | null; }
        @query op getItem(): Item;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Item {
        tags: [String]
      }

      type Query {
        getItem: Item!
      }"
    `);
  });
});

describe("e2e: nullable scalar does not emit built-in scalar declaration", () => {
  it("does not emit scalar string for nullable string field", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Foo {
          id: GraphQL.ID;
          value: string | null;
        }
        @query op getFoo(id: GraphQL.ID): Foo;
      }
    `);
    expect(result.graphQLOutput).not.toContain("scalar string");
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Foo {
        id: ID!
        value: String
      }

      type Query {
        getFoo(id: ID!): Foo!
      }"
    `);
  });

  it("does not emit scalar int32 for nullable int field", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Bar {
          count: int32 | null;
        }
        @query op getBar(): Bar;
      }
    `);
    expect(result.graphQLOutput).not.toContain("scalar int32");
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Bar {
        count: Int
      }

      type Query {
        getBar: Bar!
      }"
    `);
  });
});

describe("e2e: @operationFields", () => {
  it("renders operation as field with arguments on object type", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        @query op getUser(id: string): User;
        @operationFields(getUser)
        model User { id: string; name: string; }
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        id: String!
        name: String!
        getUser(id: String!): User!
      }

      type Query {
        getUser(id: String!): User!
      }"
    `);
  });

  it("renders multiple operation fields", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        @query op getUser(id: string): User;
        @query op getFriends(id: string): User[];
        @operationFields(getUser, getFriends)
        model User { id: string; name: string; }
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        id: String!
        name: String!
        getUser(id: String!): User!
        getFriends(id: String!): [User!]!
      }

      type Query {
        getFriends(id: String!): [User!]!
        getUser(id: String!): User!
      }"
    `);
  });
});

describe("e2e: circular references", () => {
  it("handles self-referencing model", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model TreeNode { value: string; children: TreeNode[]; parent?: TreeNode; }
        @query op getRoot(): TreeNode;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type TreeNode {
        value: String!
        children: [TreeNode!]!
        parent: TreeNode
      }

      type Query {
        getRoot: TreeNode!
      }"
    `);
  });

  it("handles mutual references between models", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Author { name: string; books: Book[]; }
        model Book { title: string; author: Author; }
        @query op getAuthor(): Author;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Author {
        name: String!
        books: [Book!]!
      }

      type Book {
        title: String!
        author: Author!
      }

      type Query {
        getAuthor: Author!
      }"
    `);
  });
});

describe("e2e: anonymous unions", () => {
  it("names anonymous return type union from operation", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Cat { name: string; }
        model Dog { breed: string; }
        @query op getPet(): Cat | Dog;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "union GetPetUnion = Cat | Dog

      type Cat {
        name: String!
      }

      type Dog {
        breed: String!
      }

      type Query {
        getPet: GetPetUnion!
      }"
    `);
  });
});

describe("e2e: @compose does not produce false incompatible diagnostics", () => {
  it("no diagnostics for @compose with spread properties", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        @Interface(#{interfaceOnly: true})
        model Node { id: GraphQL.ID; }

        @compose(Node)
        model Article { ...Node; title: string; }

        @query op getArticle(): Article;
      }
    `);
    expectDiagnosticEmpty(result.diagnostics);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "interface Node {
        id: ID!
      }

      type Article implements Node {
        id: ID!
        title: String!
      }

      type Query {
        getArticle: Article!
      }"
    `);
  });

  it("no diagnostics for @compose with multiple interfaces", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        @Interface(#{interfaceOnly: true})
        model Node { id: GraphQL.ID; }

        @Interface
        model Named { name: string; }

        @compose(Node, Named)
        model User { ...Node; ...Named; age: int32; }

        @query op getUser(): User;
      }
    `);
    expectDiagnosticEmpty(result.diagnostics);
  });
});

describe("e2e: @operationFields on model used as input warns", () => {
  it("warns that operation fields are ignored on input types", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        @query op getUser(id: string): User;
        @operationFields(getUser)
        model User { id: string; name: string; }
        @mutation op createUser(input: User): User;
      }
    `);
    expect(result.graphQLOutput).toContain("getUser(id: String!): User!");
    expect(result.graphQLOutput).not.toMatch(/input UserInput[^}]*getUser/s);
    const warnings = result.diagnostics.filter(d => d.severity === "warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(d => d.code === "@typespec/graphql/operation-fields-ignored-on-input")).toBe(true);
  });
});

describe("e2e: TypeSpec interface keyword prefixes operations", () => {
  it("prefixes operations from interface with interface name", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Board { id: string; name: string; }

        interface BoardOps {
          @query getBoard(id: string): Board;
          @mutation createBoard(name: string): Board;
        }
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Board {
        id: String!
        name: String!
      }

      type Query {
        boardOpsGetBoard(id: String!): Board!
      }

      type Mutation {
        boardOpsCreateBoard(name: String!): Board!
      }"
    `);
  });
});

describe("e2e: visibility filtering", () => {
  it("excludes read-only properties from input type", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Board {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Read)
          createdAt: string;

          name: string;
          description: string;
        }
        @query op getBoard(id: string): Board;
        @mutation op createBoard(input: Board): Board;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Board {
        id: String!
        createdAt: String!
        name: String!
        description: String!
      }

      input BoardInput {
        name: String!
        description: String!
      }

      type Query {
        getBoard(id: String!): Board!
      }

      type Mutation {
        createBoard(input: BoardInput!): Board!
      }"
    `);
  });

  it("excludes create-only properties from output type", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User {
          @visibility(Lifecycle.Read)
          id: string;

          @visibility(Lifecycle.Create)
          password: string;

          name: string;
        }
        @query op getUser(id: string): User;
        @mutation op createUser(input: User): User;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        id: String!
        name: String!
      }

      input UserInput {
        password: String!
        name: String!
      }

      type Query {
        getUser(id: String!): User!
      }

      type Mutation {
        createUser(input: UserInput!): User!
      }"
    `);
  });

  it("includes all properties when no visibility decorator is set", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Item {
          name: string;
          count: int32;
        }
        @query op getItem(): Item;
        @mutation op createItem(input: Item): Item;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Item {
        name: String!
        count: Int!
      }

      input ItemInput {
        name: String!
        count: Int!
      }

      type Query {
        getItem: Item!
      }

      type Mutation {
        createItem(input: ItemInput!): Item!
      }"
    `);
  });

  it("splits input types when query and mutation have different visible properties", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model User {
          @visibility(Lifecycle.Read, Lifecycle.Query)
          id: string;

          @visibility(Lifecycle.Create, Lifecycle.Update)
          password: string;

          name: string;
        }
        @query op getUser(filter: User): User;
        @mutation op createUser(input: User): User;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type User {
        id: String!
        name: String!
      }

      input UserQueryInput {
        id: String!
        name: String!
      }

      input UserMutationInput {
        password: String!
        name: String!
      }

      type Query {
        getUser(filter: UserQueryInput!): User!
      }

      type Mutation {
        createUser(input: UserMutationInput!): User!
      }"
    `);
  });

  it("does not split input types when visibility produces same properties", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Item {
          name: string;
          count: int32;
        }
        @query op searchItems(filter: Item): Item[];
        @mutation op createItem(input: Item): Item;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "type Item {
        name: String!
        count: Int!
      }

      input ItemInput {
        name: String!
        count: Int!
      }

      type Query {
        searchItems(filter: ItemInput!): [Item!]!
      }

      type Mutation {
        createItem(input: ItemInput!): Item!
      }"
    `);
  });
});

describe("e2e: extends flattening", () => {
  it("flattens base model fields into child type", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        scalar DateTime extends utcDateTime;
        model Timestamps { createdAt: DateTime; updatedAt: DateTime; }
        model AuditedComment extends Timestamps {
          commentId: string;
          action: string;
        }
        @query op getAudit(): AuditedComment;
      }
    `);
    expect(result.graphQLOutput).toMatchInlineSnapshot(`
      "scalar DateTime

      type Timestamps {
        createdAt: DateTime!
        updatedAt: DateTime!
      }

      type AuditedComment {
        createdAt: DateTime!
        updatedAt: DateTime!
        commentId: String!
        action: String!
      }

      type Query {
        getAudit: AuditedComment!
      }"
    `);
  });

  it("flattens multi-level inheritance", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Base { id: string; }
        model Middle extends Base { name: string; }
        model Child extends Middle { age: int32; }
        @query op getChild(): Child;
      }
    `);
    // All inherited fields should be on Child, not separate types
    expect(result.graphQLOutput).toMatch(/type Child \{[^}]*id: String!/s);
    expect(result.graphQLOutput).toMatch(/type Child \{[^}]*name: String!/s);
    expect(result.graphQLOutput).toMatch(/type Child \{[^}]*age: Int!/s);
  });

  it("flattens base model fields into input type", async () => {
    const result = await emitSingleSchemaWithDiagnostics(`
      @schema namespace Test {
        model Base { id: string; }
        model Child extends Base { name: string; }
        @query op getChild(): Child;
        @mutation op createChild(input: Child): Child;
      }
    `);
    expect(result.graphQLOutput).toMatch(/input ChildInput[^}]*id: String!/s);
    expect(result.graphQLOutput).toMatch(/input ChildInput[^}]*name: String!/s);
  });
});
