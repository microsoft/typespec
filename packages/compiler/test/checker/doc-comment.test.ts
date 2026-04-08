import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getDoc, getErrorsDoc, getReturnsDoc } from "../../src/lib/decorators.js";
import { t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: checker: doc comments", () => {
  const expectedMainDoc = "This is a doc comment.";
  const docComment = `/**
   *  ${expectedMainDoc}
   */`;
  function testMainDoc(name: string, code: string, key = "target") {
    it(name, async () => {
      const result = (await Tester.compile(code)) as any;
      ok(result[key], `Make sure to have /*${key}*/ marker in code.`);

      strictEqual(getDoc(result.program, result[key]), expectedMainDoc);
    });
  }

  describe("main doc apply to", () => {
    testMainDoc(
      "model",
      `${docComment}
      model /*target*/Foo {}`,
    );

    it("templated model", async () => {
      const { Bar, program } = await Tester.compile(t.code`${docComment}
      model Foo<T> {}

      model ${t.model("Bar")} { foo: Foo<string> }`);
      const fooInstance = Bar.properties.get("foo")!.type;
      strictEqual(getDoc(program, fooInstance), expectedMainDoc);
    });

    testMainDoc(
      "model property",
      `
      model Foo {
        ${docComment}
        /*target*/name: string;
      }
    `,
    );

    testMainDoc(
      "scalar",
      `${docComment}
      scalar /*target*/unreal;`,
    );

    testMainDoc(
      "enum",
      `${docComment}
      enum /*target*/Foo {}`,
    );

    testMainDoc(
      "enum memember",
      `
      enum Foo {
        ${docComment}
        /*target*/a,
      }
    `,
    );
    testMainDoc(
      "operation",
      `${docComment}
      op /*target*/foo(): string;`,
    );

    testMainDoc(
      "interface",
      `${docComment}
      interface /*target*/Foo {}`,
    );
  });

  it("using @doc() decorator will override the doc comment", async () => {
    const { Foo, program } = await Tester.compile(t.code`
    
    /**
     * This is a doc comment.
     */
    @doc("This is the actual doc.")
    model ${t.model("Foo")} {}
    `);

    strictEqual(getDoc(program, Foo), "This is the actual doc.");
  });

  describe("override model is comment", () => {
    it("override another doc comment", async () => {
      const { Foo, program } = await Tester.compile(t.code`
    
    /** Base comment */
    model Base {}

    /** Override comment */
    model ${t.model("Foo")} is Base {}
    `);

      strictEqual(getDoc(program, Foo), "Override comment");
    });

    it("override @doc", async () => {
      const { Foo, program } = await Tester.compile(t.code`
    
    @doc("Base comment")
    model Base {}

    /** Override comment */
    model ${t.model("Foo")} is Base {}
    `);

      strictEqual(getDoc(program, Foo), "Override comment");
    });
  });

  describe("override op is comment", () => {
    it("override another doc comment", async () => {
      const { foo, program } = await Tester.compile(t.code`
    
    /** Base comment */
    op base(): void;

    /** Override comment */
    op ${t.op("foo")} is base;
    `);

      strictEqual(getDoc(program, foo), "Override comment");
    });

    it("override @doc", async () => {
      const { foo, program } = await Tester.compile(t.code`
    
    @doc("Base comment")
    op base(): void;

    /** Override comment */
    op ${t.op("foo")} is base;
    `);

      strictEqual(getDoc(program, foo), "Override comment");
    });
  });

  describe("@returns", () => {
    it("set the returnsDoc on an operation", async () => {
      const { test, program } = await Tester.compile(t.code`
      
      /**
       * @returns A string
       */
      op ${t.op("test")}(): string;
      `);

      strictEqual(getReturnsDoc(program, test), "A string");
    });

    it("@returnsDoc decorator override the doc comment", async () => {
      const { test, program } = await Tester.compile(t.code`
      
      /**
       * @returns A string
       */
      @returnsDoc("Another string")
      op ${t.op("test")}(): string;
      `);

      strictEqual(getReturnsDoc(program, test), "Another string");
    });

    it("doc comment on op is override the base comment", async () => {
      const { test, program } = await Tester.compile(t.code`
      
      /**
       * @returns A string
       */
      op base(): string;

      /**
       * @returns Another string
       */
      op ${t.op("test")}(): string;
      `);

      strictEqual(getReturnsDoc(program, test), "Another string");
    });
  });

  describe("@errors", () => {
    it("set the errorsDoc on an operation", async () => {
      const { test, program } = await Tester.compile(t.code`
      
      /**
       * @errors A string
       */
      op ${t.op("test")}(): string;
      `);

      strictEqual(getErrorsDoc(program, test), "A string");
    });

    it("@errorsDoc decorator override the doc comment", async () => {
      const { test, program } = await Tester.compile(t.code`
      
      /**
       * @errors A string
       */
      @errorsDoc("Another string")
      op ${t.op("test")}(): string;
      `);

      strictEqual(getErrorsDoc(program, test), "Another string");
    });

    it("doc comment on op is override the base comment", async () => {
      const { test, program } = await Tester.compile(t.code`
      
      /**
       * @errors A string
       */
      op base(): string;

      /**
       * @errors Another string
       */
      op ${t.op("test")}(): string;
      `);

      strictEqual(getErrorsDoc(program, test), "Another string");
    });
  });
});

describe("@param", () => {
  async function getDocForParam(code: string): Promise<string | undefined> {
    const { target, program } = (await Tester.compile(code)) as any;
    ok(target, `Make sure to have /*target*/ marker in code.`);
    return getDoc(program, target.parameters.properties.get("one")!);
  }

  it("applies doc on param", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      op /*target*/target(one: string): void;
    `);
    strictEqual(doc, "Doc comment");
  });

  it("@doc on param wins", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      op /*target*/target(@doc("Explicit") one: string): void;
    `);
    strictEqual(doc, "Explicit");
  });

  it("augment @@doc on param wins", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      op /*target*/target(one: string): void;

      @@doc(target::parameters.one, "Override");
    `);
    strictEqual(doc, "Override");
  });

  it("carry over with op is", async () => {
    const doc = await getDocForParam(`
      /**
       * @param one Doc comment
       */
      op base(one: string): void;
      
      op /*target*/target is base;
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
      op /*target*/target is base;
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
      op /*target*/target is base;
      @@doc(target::parameters.one, "Override for child again");
    `);
    strictEqual(doc, "Override for child again");
  });

  it("spread model without @param keeps doc on property", async () => {
    const doc = await getDocForParam(`
      model A {
        @doc("Via model") one: string
      }
      op /*target*/target(...A): void;
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
      op /*target*/target(...A): void;
    `);
    strictEqual(doc, "Doc comment");
  });

  it("applies to distinct parameters", async () => {
    // One @param has a hyphen but the other does not (should handle both cases)
    const { addUser, program } = await Tester.compile(t.code`
    
    /**
     * This is the operation doc.
     * @param name This is the name param doc.
     * @param age - This is the age param doc.
     */
    op ${t.op("addUser")}(name: string, age: string): void;
    `);

    strictEqual(getDoc(program, addUser), "This is the operation doc.");
    strictEqual(
      getDoc(program, addUser.parameters.properties.get("name")!),
      "This is the name param doc.",
    );
    strictEqual(
      getDoc(program, addUser.parameters.properties.get("age")!),
      "This is the age param doc.",
    );
  });
});

describe("@prop", () => {
  async function getDocForProp(code: string): Promise<string | undefined> {
    const { target, program } = (await Tester.compile(code)) as any;
    ok(target, `Make sure to have /*target*/ marker in code.`);
    return getDoc(program, target.properties.get("one")!);
  }

  it("applies doc on param", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      model /*target*/target { one: string }
    `);
    strictEqual(doc, "Doc comment");
  });

  it("@doc on param wins", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      model /*target*/target { @doc("Explicit") one: string }
    `);
    strictEqual(doc, "Explicit");
  });

  it("augment @@doc on param wins", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      model /*target*/target { one: string }

      @@doc(target.one, "Override");
    `);
    strictEqual(doc, "Override");
  });

  it("carry over with model is", async () => {
    const doc = await getDocForProp(`
      /**
       * @prop one Doc comment
       */
      model Base { one: string }
      
      model /*target*/target is Base;
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
      model /*target*/target is Base;
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
      model /*target*/target is Base;
      @@doc(target.one, "Override for child again");
    `);
    strictEqual(doc, "Override for child again");
  });

  it("spread model without @prop keeps doc on property", async () => {
    const doc = await getDocForProp(`
      model Base {
        @doc("Via model") one: string
      }
      model /*target*/target { ...Base }
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
      model /*target*/target { ...Base }
    `);
    strictEqual(doc, "Doc comment");
  });

  it("applies to distinct parameters", async () => {
    // One @prop has a hyphen but the other does not (should handle both cases)
    const { Base, program } = await Tester.compile(t.code`
    
    /**
     * This is the model doc.
     * @prop name This is the name prop doc.
     * @prop age - This is the age prop doc.
     */
    model ${t.model("Base")} { name: string, age: int32 }
    `);

    strictEqual(getDoc(program, Base), "This is the model doc.");
    strictEqual(getDoc(program, Base.properties.get("name")!), "This is the name prop doc.");
    strictEqual(getDoc(program, Base.properties.get("age")!), "This is the age prop doc.");
  });
});
