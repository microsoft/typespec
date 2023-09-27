import { ok, strictEqual } from "assert";
import { Model, Operation } from "../../src/core/index.js";
import { getDoc, getErrorsDoc, getReturnsDoc } from "../../src/lib/decorators.js";
import { BasicTestRunner, createTestRunner } from "../../src/testing/index.js";

describe("compiler: checker: doc comments", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = await createTestRunner();
  });

  const expectedMainDoc = "This is a doc comment.";
  const docComment = `/**
   *  ${expectedMainDoc}
   */`;
  function testMainDoc(name: string, code: string) {
    it(name, async () => {
      const { target } = await runner.compile(code);
      ok(target, `Make sure to have @test("target") in code.`);

      strictEqual(getDoc(runner.program, target), expectedMainDoc);
    });
  }

  describe("main doc apply to", () => {
    testMainDoc(
      "model",
      `${docComment}
      @test("target") model Foo {}`
    );

    testMainDoc(
      "templated model",
      `${docComment}
      @test("target") model Foo<T> {}

      model Bar { foo: Foo<string> }`
    );

    testMainDoc(
      "model property",
      `
      model Foo {
        ${docComment}
        @test("target") foo: string;
      }
    `
    );

    testMainDoc(
      "scalar",
      `${docComment}
      @test("target") scalar foo;`
    );

    testMainDoc(
      "enum",
      `${docComment}
      @test("target") enum Foo {}`
    );

    testMainDoc(
      "enum memember",
      `
      enum Foo {
        ${docComment}
        @test("target") foo,
      }
    `
    );
    testMainDoc(
      "operation",
      `${docComment}
      @test("target") op test(): string;`
    );

    testMainDoc(
      "interface",
      `${docComment}
      @test("target") interface Foo {}`
    );
  });

  it("using @doc() decorator will override the doc comment", async () => {
    const { Foo } = (await runner.compile(`
    
    /**
     * This is a doc comment.
     */
    @doc("This is the actual doc.")
    @test model Foo {}
    `)) as { Foo: Model };

    strictEqual(getDoc(runner.program, Foo), "This is the actual doc.");
  });

  describe("override model is comment", () => {
    it("override another doc comment", async () => {
      const { Foo } = (await runner.compile(`
    
    /** Base comment */
    model Base {}

    /** Override comment */
    @test model Foo is Base {}
    `)) as { Foo: Model };

      strictEqual(getDoc(runner.program, Foo), "Override comment");
    });

    it("override @doc", async () => {
      const { Foo } = (await runner.compile(`
    
    @doc("Base comment")
    model Base {}

    /** Override comment */
    @test model Foo is Base {}
    `)) as { Foo: Model };

      strictEqual(getDoc(runner.program, Foo), "Override comment");
    });
  });

  describe("override op is comment", () => {
    it("override another doc comment", async () => {
      const { foo } = (await runner.compile(`
    
    /** Base comment */
    op base(): void;

    /** Override comment */
    @test op foo is base;
    `)) as { foo: Operation };

      strictEqual(getDoc(runner.program, foo), "Override comment");
    });

    it("override @doc", async () => {
      const { foo } = (await runner.compile(`
    
    @doc("Base comment")
    op base(): void;

    /** Override comment */
    @test op foo is base;
    `)) as { foo: Operation };

      strictEqual(getDoc(runner.program, foo), "Override comment");
    });
  });

  describe("@returns", () => {
    it("set the returnsDoc on an operation", async () => {
      const { test } = (await runner.compile(`
      
      /**
       * @returns A string
       */
      @test op test(): string;
      `)) as { test: Operation };

      strictEqual(getReturnsDoc(runner.program, test), "A string");
    });

    it("@returnsDoc decorator override the doc comment", async () => {
      const { test } = (await runner.compile(`
      
      /**
       * @returns A string
       */
      @returnsDoc("Another string")
      @test op test(): string;
      `)) as { test: Operation };

      strictEqual(getReturnsDoc(runner.program, test), "Another string");
    });

    it("doc comment on op is override the base comment", async () => {
      const { test } = (await runner.compile(`
      
      /**
       * @returns A string
       */
      op base(): string;

      /**
       * @returns Another string
       */
      @test op test(): string;
      `)) as { test: Operation };

      strictEqual(getReturnsDoc(runner.program, test), "Another string");
    });
  });

  describe("@errors", () => {
    it("set the errorsDoc on an operation", async () => {
      const { test } = (await runner.compile(`
      
      /**
       * @errors A string
       */
      @test op test(): string;
      `)) as { test: Operation };

      strictEqual(getErrorsDoc(runner.program, test), "A string");
    });

    it("@errorsDoc decorator override the doc comment", async () => {
      const { test } = (await runner.compile(`
      
      /**
       * @errors A string
       */
      @errorsDoc("Another string")
      @test op test(): string;
      `)) as { test: Operation };

      strictEqual(getErrorsDoc(runner.program, test), "Another string");
    });

    it("doc comment on op is override the base comment", async () => {
      const { test } = (await runner.compile(`
      
      /**
       * @errors A string
       */
      op base(): string;

      /**
       * @errors Another string
       */
      @test op test(): string;
      `)) as { test: Operation };

      strictEqual(getErrorsDoc(runner.program, test), "Another string");
    });
  });

  it("using @param in doc comment of operation applies doc on the parameters", async () => {
    // One @param has a hyphen but the other does not (should handle both cases)
    const { addUser } = (await runner.compile(`
    
    /**
     * This is the operation doc.
     * @param name This is the name param doc.
     * @param age - This is the age param doc.
     */
    @test op addUser(name: string, age: string): void;
    `)) as { addUser: Operation };

    strictEqual(getDoc(runner.program, addUser), "This is the operation doc.");
    strictEqual(
      getDoc(runner.program, addUser.parameters.properties.get("name")!),
      "This is the name param doc."
    );
    strictEqual(
      getDoc(runner.program, addUser.parameters.properties.get("age")!),
      "This is the age param doc."
    );
  });
});
