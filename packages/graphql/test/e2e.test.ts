import { expect, describe, it } from "vitest";
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
