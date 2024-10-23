import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model, Operation } from "../../src/core/index.js";
import { getDoc, getErrorsDoc, getReturnsDoc } from "../../src/lib/decorators.js";
import { BasicTestRunner, createTestRunner } from "../../src/testing/index.js";

let runner: BasicTestRunner;
beforeEach(async () => {
  runner = await createTestRunner();
});

describe("compiler: checker: doc comments", () => {
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
      @test("target") model Foo {}`,
    );

    testMainDoc(
      "templated model",
      `${docComment}
      @test("target") model Foo<T> {}

      model Bar { foo: Foo<string> }`,
    );

    testMainDoc(
      "model property",
      `
      model Foo {
        ${docComment}
        @test("target") foo: string;
      }
    `,
    );

    testMainDoc(
      "scalar",
      `${docComment}
      @test("target") scalar foo;`,
    );

    testMainDoc(
      "enum",
      `${docComment}
      @test("target") enum Foo {}`,
    );

    testMainDoc(
      "enum memember",
      `
      enum Foo {
        ${docComment}
        @test("target") foo,
      }
    `,
    );
    testMainDoc(
      "operation",
      `${docComment}
      @test("target") op test(): string;`,
    );

    testMainDoc(
      "interface",
      `${docComment}
      @test("target") interface Foo {}`,
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
});

describe("@param", () => {
  async function getDocForParam(code: string): Promise<string | undefined> {
    const { target } = (await runner.compile(code)) as { target: Operation };
    ok(target, `Make sure to have @test("target") in code.`);
    return getDoc(runner.program, target.parameters.properties.get("one")!);
  }

  it("applies doc on param", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      @test("target") op base(one: string): void;
    `);
    strictEqual(doc, "Doc comment");
  });

  it("@doc on param wins", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      @test("target") op base(@doc("Explicit") one: string): void;
    `);
    strictEqual(doc, "Explicit");
  });

  it("augment @@doc on param wins", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      @test("target") op base(one: string): void;

      @@doc(base::parameters.one, "Override");
    `);
    strictEqual(doc, "Override");
  });

  it("carry over with op is", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      op base(one: string): void;
      
      @test("target") op child is base;
    `);
    strictEqual(doc, "Doc comment");
  });

  it("@param on child operation override parent @param", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      op base(one: string): void;
      
      /**
       * @param one Override for child
       */
      @test("target") op child is base;
    `);
    strictEqual(doc, "Override for child");
  });

  it("augment @@doc wins over @param on child operation", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      op base(one: string): void;
      
      /**
       * @param one Override for child
       */
      @test("target") op child is base;
      @@doc(child::parameters.one, "Override for child again");
    `);
    strictEqual(doc, "Override for child again");
  });

  it("spread model without @param keeps doc on property", async () => {
    const doc = await getDocForParam(`
      model A {
        @doc("Via model") one: string
      }
      @test("target") op base(...A): void;
    `);
    strictEqual(doc, "Via model");
  });

  it("@param override doc set from spread model", async () => {
    const doc = await getDocForParam(`
      model A {
        @doc("Via model") one: string
      }
      /**
       * @param one Doc comment
       */
      @test("target") op base(...A): void;
    `);
    strictEqual(doc, "Doc comment");
  });

  it("applies to distinct parameters", async () => {
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
      "This is the name param doc.",
    );
    strictEqual(
      getDoc(runner.program, addUser.parameters.properties.get("age")!),
      "This is the age param doc.",
    );
  });
});

describe("@prop", () => {
  async function getDocForProp(code: string): Promise<string | undefined> {
    const { target } = (await runner.compile(code)) as { target: Model };
    ok(target, `Make sure to have @test("target") in code.`);
    return getDoc(runner.program, target.properties.get("one")!);
  }

  it("applies doc on param", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      @test("target") model Base { one: string }
    `);
    strictEqual(doc, "Doc comment");
  });

  it("@doc on param wins", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      @test("target") model Base { @doc("Explicit") one: string }
    `);
    strictEqual(doc, "Explicit");
  });

  it("augment @@doc on param wins", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      @test("target") model Base { one: string }

      @@doc(Base.one, "Override");
    `);
    strictEqual(doc, "Override");
  });

  it("carry over with model is", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      model Base { one: string }
      
      @test("target") model Child is Base;
    `);
    strictEqual(doc, "Doc comment");
  });

  it("@prop on child operation override parent @prop", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      model Base { one: string }
      
      /**
       * @prop one Override for child
       */
      @test("target") model Child is Base;
    `);
    strictEqual(doc, "Override for child");
  });

  it("augment @@doc wins over @prop on child operation", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      model Base { one: string }
      
      /**
       * @prop one Override for child
       */
      @test("target") model Child is Base;
      @@doc(Child.one, "Override for child again");
    `);
    strictEqual(doc, "Override for child again");
  });

  it("spread model without @prop keeps doc on property", async () => {
    const doc = await getDocForProp(`
      model Base {
        @doc("Via model") one: string
      }
      @test("target") model Child { ...Base }
    `);
    strictEqual(doc, "Via model");
  });

  it("@prop override doc set from spread model", async () => {
    const doc = await getDocForProp(`
      model Base {
        @doc("Via model") one: string
      }
      /**
       * @prop one Doc comment
       */
      @test("target") model Child { ...Base }
    `);
    strictEqual(doc, "Doc comment");
  });

  it("applies to distinct parameters", async () => {
    // One @prop has a hyphen but the other does not (should handle both cases)
    const { Base } = (await runner.compile(`
    
    /**
     * This is the model doc.
     * @prop name This is the name prop doc.
     * @prop age - This is the age prop doc.
     */
    @test model Base { name: string, age: int32 }
    `)) as { Base: Model };

    strictEqual(getDoc(runner.program, Base), "This is the model doc.");
    strictEqual(getDoc(runner.program, Base.properties.get("name")!), "This is the name prop doc.");
    strictEqual(getDoc(runner.program, Base.properties.get("age")!), "This is the age prop doc.");
  });
});
