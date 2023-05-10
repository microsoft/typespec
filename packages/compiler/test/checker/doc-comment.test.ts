import { ok, strictEqual } from "assert";
import { Model, Operation } from "../../core/index.js";
import { getDoc } from "../../lib/decorators.js";
import { BasicTestRunner, createTestRunner } from "../../testing/index.js";

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

  it("using @param in doc comment of operation applies doc on the parameters", async () => {
    const { addUser } = (await runner.compile(`
    
    /**
     * This is the operation doc.
     * @param name This is the name param doc.
     * @param age This is the age param doc.
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
