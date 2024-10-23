import { rejects, strictEqual } from "assert";
import * as prettier from "prettier";
import { describe, it } from "vitest";
import * as plugin from "../../src/formatter/index.js";

type TestParser = "typespec" | "markdown";
async function format(code: string, parser: TestParser = "typespec"): Promise<string> {
  const output = await prettier.format(code, {
    parser,
    plugins: [plugin],
  });
  return output;
}

async function assertFormat({
  code,
  expected,
  parser,
}: {
  code: string;
  expected: string;
  parser?: TestParser;
}) {
  const result = await format(code, parser ?? "typespec");
  strictEqual(result.trim(), expected.trim());
}

describe("compiler: prettier formatter", () => {
  it("throws error if there is a parsing issue", async () => {
    const code = `namespace this is invalid`;

    await rejects(() => format(code));
  });

  it("format imports", async () => {
    await assertFormat({
      code: `
    import   "@scope/package1";
import        "@scope/package2";
import "@scope/package3"  ;
`,
      expected: `
import "@scope/package1";
import "@scope/package2";
import "@scope/package3";
`,
    });
  });

  it("formats returns of anonymous models", async () => {
    await assertFormat({
      code: `
op test(): { a: string; b: string; };
`,
      expected: `
op test(): {
  a: string;
  b: string;
};
`,
    });
  });

  it("format using", async () => {
    await assertFormat({
      code: `
using       Some.Namespace  
`,
      expected: `
using Some.Namespace;
`,
    });
  });

  describe("model", () => {
    it("format empty model on single line", async () => {
      await assertFormat({
        code: `
model Foo {
  

  
}
`,
        expected: `
model Foo {}
`,
      });
    });

    it("format simple models", async () => {
      await assertFormat({
        code: `
model Foo {
  id: number;
    type: Bar;

    name?:    string;
  isArray:      string[]  ;
}
`,
        expected: `
model Foo {
  id: number;
  type: Bar;
  name?: string;
  isArray: string[];
}
`,
      });
    });

    it("format nested models", async () => {
      await assertFormat({
        code: `
model Foo {
      id: number;
  address: { street: string, country:   string}
}
`,
        expected: `
model Foo {
  id: number;
  address: {
    street: string;
    country: string;
  };
}
`,
      });
    });

    it("format models with default values", async () => {
      await assertFormat({
        code: `
model Foo {

    name?:    string    =      "foo";
}
`,
        expected: `
model Foo {
  name?: string = "foo";
}
`,
      });
    });

    it("format models with spread", async () => {
      await assertFormat({
        code: `
model Foo {
    id: number;
      ...Bar;
  name: string;
}
`,
        expected: `
model Foo {
  id: number;
  ...Bar;
  name: string;
}
`,
      });
    });

    it("format model with decorator", async () => {
      await assertFormat({
        code: `
      @some @decorator
model   Foo {}
`,
        expected: `
@some
@decorator
model Foo {}
`,
      });
    });

    describe("model `extends`", () => {
      it("format inline", async () => {
        await assertFormat({
          code: `
model   Foo extends Base {
}

model   Bar extends Base< 
  string    > {
}
`,
          expected: `
model Foo extends Base {}

model Bar extends Base<string> {}
`,
        });
      });

      it("split and indent is when model declaration line is too long", async () => {
        await assertFormat({
          code: `
model   Foo extends SuperExtremeAndVeryVeryVeryVeryVeryVeryLongModelThatWillBeTooLong {
}
`,
          expected: `
model Foo
  extends SuperExtremeAndVeryVeryVeryVeryVeryVeryLongModelThatWillBeTooLong {}
`,
        });
      });
    });

    describe("model `is`", () => {
      it("remove body if its empty", async () => {
        await assertFormat({
          code: `
model   Foo is Base {
}

model   Bar is Base< 
  string    > {
}
`,
          expected: `
model Foo is Base;

model Bar is Base<string>;
`,
        });
      });

      it("keeps body if there is a comment inside", async () => {
        await assertFormat({
          code: `
model   Foo is Base {
   // Some comment
}
`,
          expected: `
model Foo is Base {
  // Some comment
}
`,
        });
      });

      it("split and indent is when model declaration line is too long", async () => {
        await assertFormat({
          code: `
model   Foo is SuperExtremeAndVeryVeryVeryVeryVeryVeryLongLongLongModelThatWillBeTooLong {
}
`,
          expected: `
model Foo
  is SuperExtremeAndVeryVeryVeryVeryVeryVeryLongLongLongModelThatWillBeTooLong;
`,
        });
      });
    });

    it("format model with generic", async () => {
      await assertFormat({
        code: `
model   Foo < T   >{
}
`,
        expected: `
model Foo<T> {}
`,
      });
    });

    it("format spread reference", async () => {
      await assertFormat({
        code: `
model Foo {
        ...       Bar


}
`,
        expected: `
model Foo {
  ...Bar;
}
`,
      });
    });

    it("remove unnecessary backticks", async () => {
      await assertFormat({
        code: `
model \`Foo\` {
  \`abc\`: string;
  \`import\`: boolean;
  \`this-needs-backticks\`: int32;
}
`,
        expected: `
model Foo {
  abc: string;
  \`import\`: boolean;
  \`this-needs-backticks\`: int32;
}
`,
      });
    });

    it("format quoted string to identifier or backticked identifier when necessary", async () => {
      await assertFormat({
        code: `
model Foo {
  "abc": string;
  "this-needs-quotes": int32;
  "foo\\nbar\\\\not\`": int32;
}
enum \`2Colors\` {
  "red color",
  "green-color",
}
`,
        expected: `
model Foo {
  abc: string;
  \`this-needs-quotes\`: int32;
  \`foo\\nbar\\\\not\\\`\`: int32;
}
enum \`2Colors\` {
  \`red color\`,
  \`green-color\`,
}
`,
      });
    });

    describe("in between property spacing", () => {
      it("hug properties with no line decorators or comments ", async () => {
        await assertFormat({
          code: `
model   Foo{
  one: string;

  two: string;



  three: string
}
  `,
          expected: `
model Foo {
  one: string;
  two: string;
  three: string;
}
  `,
        });
      });

      it("wrap in new lines properties with line decorators", async () => {
        await assertFormat({
          code: `
model   Foo{
  one: string;
  @foo
  @bar
  two: string;
  three: string;
  four: string;
}
  `,
          expected: `
model Foo {
  one: string;

  @foo
  @bar
  two: string;

  three: string;
  four: string;
}
  `,
        });
      });

      it("wrap only in single line when 2 properties have decorators next to each other", async () => {
        await assertFormat({
          code: `
model   Foo{
  one: string;
  @foo
  two: string;
  @foo
  three: string;
  four: string;
}
  `,
          expected: `
model Foo {
  one: string;

  @foo
  two: string;

  @foo
  three: string;

  four: string;
}
  `,
        });
      });

      it("wrap in new lines properties with line comments", async () => {
        await assertFormat({
          code: `
model   Foo{
  one: string;
  // comment
  two: string;
  three: string
  four: string;
}
  `,
          expected: `
model Foo {
  one: string;

  // comment
  two: string;

  three: string;
  four: string;
}
  `,
        });
      });

      it("first property with decorators or comment should not have extra blank space before", async () => {
        await assertFormat({
          code: `
model   Foo{
  @foo
  one: string;
  two: string;
}
  `,
          expected: `
model Foo {
  @foo
  one: string;

  two: string;
}
  `,
        });
      });

      it("last property with decorators or comment should not have extra blank space after", async () => {
        await assertFormat({
          code: `
model   Foo{
  one: string;
  @foo
  two: string;
}
  `,
          expected: `
model Foo {
  one: string;

  @foo
  two: string;
}
  `,
        });
      });

      it("hug properties if the comment is trailing the property end of line", async () => {
        await assertFormat({
          code: `
model   Foo{
  one: string;

  two: string; // comment
  three: string

  four: string;
}
  `,
          expected: `
model Foo {
  one: string;
  two: string; // comment
  three: string;
  four: string;
}
  `,
        });
      });

      it("wrap in new lines properties with block comments", async () => {
        await assertFormat({
          code: `
model   Foo{
  one: string;
  /** 
   * comment
   */
  two: string;
  three: string;
  four: string;
}
  `,
          expected: `
model Foo {
  one: string;

  /**
   * comment
   */
  two: string;

  three: string;
  four: string;
}
  `,
        });
      });
    });
  });

  describe("op", () => {
    it("keeps operation inline if it can", async () => {
      await assertFormat({
        code: `
op foo(
one: string;

two: string;



three: string,
      ): void;
`,
        expected: `
op foo(one: string, two: string, three: string): void;
`,
      });
    });

    it("doesn't add extra blank space in parameters list if operation split in new lines", async () => {
      await assertFormat({
        code: `
op foo(

      ): "very very very long text that will force this operation to split line"
`,
        expected: `
op foo(
): "very very very long text that will force this operation to split line";
`,
      });
    });

    describe("in between parameter spacing", () => {
      it("hug parameters with no line decorators or comments ", async () => {
        await assertFormat({
          code: `
op foo(
  one: string;

  two: string;



  three: string,   four: string,
  five: string,
        ): void;
  `,
          expected: `
op foo(
  one: string,
  two: string,
  three: string,
  four: string,
  five: string,
): void;
  `,
        });
      });

      it("wrap in new lines parameters with line decorators", async () => {
        await assertFormat({
          code: `
op foo(
  one: string,
  @foo
  @bar
  two: string,
  three: string,
  four: string,
): void;
  `,
          expected: `
op foo(
  one: string,

  @foo
  @bar
  two: string,

  three: string,
  four: string,
): void;
  `,
        });
      });

      it("wrap only in single line when 2 parameters have decorators next to each other", async () => {
        await assertFormat({
          code: `
op foo(
  one: string,
  @foo
  two: string,
  @foo
  three: string,
  four: string
): void;
  `,
          expected: `
op foo(
  one: string,

  @foo
  two: string,

  @foo
  three: string,

  four: string,
): void;
  `,
        });
      });

      it("wrap in new lines parameters with line comments", async () => {
        await assertFormat({
          code: `
op foo(
  one: string,
  // comment
  two: string,
  three: string
  four: string,
): void;
  `,
          expected: `
op foo(
  one: string,

  // comment
  two: string,

  three: string,
  four: string,
): void;
  `,
        });
      });

      it("first property with decorators or comment should not have extra blank space before", async () => {
        await assertFormat({
          code: `
op foo(
  @foo
  one: string,
  two: string,
): void;
  `,
          expected: `
op foo(
  @foo
  one: string,

  two: string,
): void;
  `,
        });
      });

      it("last property with decorators or comment should not have extra blank space after", async () => {
        await assertFormat({
          code: `
op foo(
  one: string,
  @foo
  two: string,
): void;
  `,
          expected: `
op foo(
  one: string,

  @foo
  two: string,
): void;
  `,
        });
      });

      it("hug parameters if the comment is trailing the property end of line", async () => {
        await assertFormat({
          code: `
op foo(
  one: string,

  two: string, // comment
  three: string

  four: string,
): void;
  `,
          expected: `
op foo(
  one: string,
  two: string, // comment
  three: string,
  four: string,
): void;
  `,
        });
      });

      it("wrap in new lines parameters with block comments", async () => {
        await assertFormat({
          code: `
op foo(
  one: string,
  /** 
   * comment
   */
  two: string,
  three: string,
  four: string,
): void;
  `,
          expected: `
op foo(
  one: string,

  /**
   * comment
   */
  two: string,

  three: string,
  four: string,
): void;
  `,
        });
      });
    });
  });

  describe("scalar", () => {
    it("format on single line", async () => {
      await assertFormat({
        code: `
scalar
   Foo
`,
        expected: `
scalar Foo;
`,
      });
    });

    it("format with extends", async () => {
      await assertFormat({
        code: `
scalar
   Foo extends 
        string
`,
        expected: `
scalar Foo extends string;
`,
      });
    });

    it("format with template parameters", async () => {
      await assertFormat({
        code: `
scalar
   Foo<K,
    V> 
`,
        expected: `
scalar Foo<K, V>;
`,
      });
    });

    it("format with decorator", async () => {
      await assertFormat({
        code: `
      @some @decorator
scalar   Foo 
`,
        expected: `
@some
@decorator
scalar Foo;
`,
      });
    });

    it("format with constructors", async () => {
      await assertFormat({
        code: `
scalar
   Foo { init fromFoo(
    value:      string)}
`,
        expected: `
scalar Foo {
  init fromFoo(value: string);
}
`,
      });
    });
    it("format with multiple constructors", async () => {
      await assertFormat({
        code: `
scalar
   Foo { init fromFoo(
    value:      string);  init fromBar(
      value:      string, other: string)}
`,
        expected: `
scalar Foo {
  init fromFoo(value: string);
  init fromBar(value: string, other: string);
}
`,
      });
    });
  });

  describe("scalar constructor call", () => {
    it("call with no arguments", async () => {
      await assertFormat({
        code: `
const foo     = utcDateTime.   now(
    );
`,
        expected: `
const foo = utcDateTime.now();
`,
      });
    });

    it("call with arguments", async () => {
      await assertFormat({
        code: `
const foo     = utcDateTime.   fromISO(
  "abc"  );
`,
        expected: `
const foo = utcDateTime.fromISO("abc");
`,
      });
    });

    it("hug object literal", async () => {
      await assertFormat({
        code: `
const foo     = utcDateTime.   fromFoo(#{ name: "abc",
        multiline1: "abc",
  multiline2: "abc",
    multiline3: "abc",  });
`,
        expected: `
const foo = utcDateTime.fromFoo(#{
  name: "abc",
  multiline1: "abc",
  multiline2: "abc",
  multiline3: "abc",
});
`,
      });
    });

    it("hug array literal", async () => {
      await assertFormat({
        code: `
const foo     = utcDateTime.   fromFoo(#[
        "very very long array",
    "very very long array",
  "very very long array"
]);
`,
        expected: `
const foo = utcDateTime.fromFoo(#[
  "very very long array",
  "very very long array",
  "very very long array"
]);
`,
      });
    });
  });

  describe("comments", () => {
    it("format comment at position 0", async () => {
      await assertFormat({
        code: `// This comment is at position 0.
model Foo {}
`,
        expected: `
// This comment is at position 0.
model Foo {}
`,
      });
    });

    it("format single line comments", async () => {
      await assertFormat({
        code: `
  // This is a comment.
model Foo {}
`,
        expected: `
// This is a comment.
model Foo {}
`,
      });
    });

    it("format indentable multi line comments", async () => {
      await assertFormat({
        code: `
  /**
 * This is a multiline comment
      * that has bad formatting.
    */
model Foo {}
`,
        expected: `
/**
 * This is a multiline comment
 * that has bad formatting.
 */
model Foo {}
`,
      });
    });

    it("format regular multi line comments", async () => {
      await assertFormat({
        code: `
  /*
  This is a multiline comment
       that has bad formatting.
    */
model Foo {}
`,
        expected: `
/*
  This is a multiline comment
       that has bad formatting.
    */
model Foo {}
`,
      });
    });

    it("format doc comment comments without * indent", async () => {
      // Keep the indentation
      await assertFormat({
        code: `
  /*
  This is a multiline comment
       that has bad formatting.
    */
model Foo {}
`,
        expected: `
/*
  This is a multiline comment
       that has bad formatting.
    */
model Foo {}
`,
      });
    });

    it("format single line doc comment", async () => {
      // Keep the indentation
      await assertFormat({
        code: `
  /**    This is a single line doc comment    */
model Foo {}
`,
        expected: `
/** This is a single line doc comment */
model Foo {}
`,
      });
    });

    it("print standalone doc comment", async () => {
      // Keep the indentation
      await assertFormat({
        code: `
  /**    
   * This is a multiline doc comment  
     */
`,
        expected: `
/**
 * This is a multiline doc comment
 */
`,
      });
    });

    it("keeps block comment on same line", async () => {
      await assertFormat({
        code: `
  alias foo = ""; /* one */ /* two */    /* three */ 
  `,
        expected: `
alias foo = ""; /* one */ /* two */ /* three */
  `,
      });
    });

    it("format empty file with comment inside", async () => {
      await assertFormat({
        code: `


  // empty file

`,
        expected: `
// empty file
`,
      });
    });

    it("format empty file with comment inside starting first line", async () => {
      await assertFormat({
        code: `
  // empty file


  // commented out things
`,
        expected: `
// empty file

// commented out things
`,
      });
    });

    it("format empty model with comment inside", async () => {
      await assertFormat({
        code: `
model Foo {
  // empty model

  
}
`,
        expected: `
model Foo {
  // empty model
}
`,
      });

      await assertFormat({
        code: `
model Foo {
  // empty model 1


     // empty model 2

  
}
`,
        expected: `
model Foo {
  // empty model 1
  // empty model 2
}
`,
      });
    });

    it("format empty scalar with comment inside", async () => {
      await assertFormat({
        code: `
scalar foo {
  // empty scalar

  
}
`,
        expected: `
scalar foo {
  // empty scalar
}
`,
      });

      await assertFormat({
        code: `
scalar foo {
  // empty scalar 1


     // empty scalar 2

  
}
`,
        expected: `
scalar foo {
  // empty scalar 1
  // empty scalar 2
}
`,
      });
    });

    it("format empty anonymous model with comment inside", async () => {
      await assertFormat({
        code: `
model Foo {
  nested: {
  // empty model

  }
}
`,
        expected: `
model Foo {
  nested: {
    // empty model
  };
}
`,
      });
    });

    it("format single line comments after doc comment", async () => {
      await assertFormat({
        code: `
model A {
  /**
   * block
   */
    // one line
  s: string;
}
        
`,
        expected: `
model A {
  /**
   * block
   */
  // one line
  s: string;
}
`,
      });
    });

    it("format single line comments after directive", async () => {
      await assertFormat({
        code: `
model A {
  #suppress "foo"
    // one line
  s: string;
}
        
`,
        expected: `
model A {
  #suppress "foo"
  // one line
  s: string;
}
`,
      });
    });

    it("format empty interface with comment inside", async () => {
      await assertFormat({
        code: `
interface Foo {
  // empty interface

  
}
`,
        expected: `
interface Foo {
  // empty interface
}
`,
      });

      await assertFormat({
        code: `
interface Foo {
  // empty interface 1


     // empty interface 2

  
}
`,
        expected: `
interface Foo {
  // empty interface 1
  // empty interface 2
}
`,
      });
    });

    const types = [
      ["blockless namespace", "namespace Bar;"],
      ["flattened blockless namespace", "namespace Foo.Bar;"],
      ["block namespace", "namespace Bar {\n\n}"],
      ["flattened block namespace", "namespace Foo.Bar {\n\n}"],
      ["model", "model Bar {}"],
      ["op", "op test(foo: string): void;"],
      ["scalar", "scalar foo;"],
      ["interface", "interface Foo {}"],
      ["union", "union Foo {}"],
      ["enum", "enum Foo {}"],
    ];

    describe("format comment between decorator and node", () => {
      types.forEach(([name, code]) => {
        it(name, async () => {
          await assertFormat({
            code: `
@foo
    // comment
${code}
`,
            expected: `
@foo
// comment
${code}
`,
          });
        });
      });
    });

    describe("format comment between directive and node", () => {
      types.forEach(([name, code]) => {
        it(name, async () => {
          await assertFormat({
            code: `
#suppress "foo"
    // comment
${code}
`,
            expected: `
#suppress "foo"
// comment
${code}
`,
          });
        });
      });
    });

    describe("format comment between doc comment and node", () => {
      types.forEach(([name, code]) => {
        it(name, async () => {
          await assertFormat({
            code: `
/** doc */
    // comment
${code}
`,
            expected: `
/** doc */
// comment
${code}
`,
          });
        });
      });
    });

    it("keeps comment in between decorators", async () => {
      await assertFormat({
        code: `
@foo
  // comment
  @bar
model Bar {}
`,
        expected: `
@foo
// comment
@bar
model Bar {}
`,
      });
    });

    it("keeps comment at the end of line of a decorators", async () => {
      await assertFormat({
        code: `
@foo          // comment
  @bar
model Bar {}
`,
        expected: `
@foo // comment
@bar
model Bar {}
`,
      });
    });

    it("comment preceding decorators hug decorators", async () => {
      await assertFormat({
        code: `
        // comment
@foo          
  @bar
model Bar {}
`,
        expected: `
// comment
@foo
@bar
model Bar {}
`,
      });
    });

    it("keeps comment in between decorators on model property", async () => {
      await assertFormat({
        code: `
model Bar {
      @foo
        // comment
    @bar
  foo: string;
}
`,
        expected: `
model Bar {
  @foo
  // comment
  @bar
  foo: string;
}
`,
      });
    });

    it("keeps comment in between decorators on enum member", async () => {
      await assertFormat({
        code: `
enum Bar {
      @foo
        // comment
    @bar
  foo: "foo",
}
`,
        expected: `
        enum Bar {
  @foo
  // comment
  @bar
  foo: "foo",
}
`,
      });
    });

    it("keeps comment between statements of a flattened namespace", async () => {
      await assertFormat({
        code: `
        namespace Foo.Bar {
// one
op one(): void;

// two
op two(foo: string): void;

// three
model Bar {}

// four
interface IFace {}

// five
interface MyEnum {}
        }
`,
        expected: `
namespace Foo.Bar {
  // one
  op one(): void;

  // two
  op two(foo: string): void;

  // three
  model Bar {}

  // four
  interface IFace {}

  // five
  interface MyEnum {}
}
`,
      });
    });

    it("keeps comment after augment decorator", async () => {
      await assertFormat({
        code: `
  @@doc(Foo.bar, "This");   // comment
`,
        expected: `
@@doc(Foo.bar, "This"); // comment
`,
      });
    });

    it("formats doc comment before decorators and directives", async () => {
      await assertFormat({
        code: `
#suppress "foo"
@dec1
/**
 * Doc comment
 */
@dec2
model Foo {}
`,
        expected: `
/**
 * Doc comment
 */
#suppress "foo"
@dec1
@dec2
model Foo {}
`,
      });
    });

    it("formats multiple doc comment before decorators and directives", async () => {
      await assertFormat({
        code: `
#suppress "foo"
@dec1
/**
 * Doc comment 1
 */
@dec2
/**
 * Doc comment 2
 */
model Foo {}
`,
        expected: `
/**
 * Doc comment 1
 */
/**
 * Doc comment 2
 */
#suppress "foo"
@dec1
@dec2
model Foo {}
`,
      });
    });
  });

  describe("alias union", () => {
    it("format simple alias", async () => {
      await assertFormat({
        code: `
alias     Foo   = "one"       | "two";
alias     Bar   
      = "one"      
     | "two";
`,
        expected: `
alias Foo = "one" | "two";
alias Bar = "one" | "two";
`,
      });
    });

    it("format generic alias", async () => {
      await assertFormat({
        code: `
alias     Foo<   A,     B>   = A     |    B;
alias     Bar<   
    A,     B>   = 
    A     |   
 B;
`,
        expected: `
alias Foo<A, B> = A | B;
alias Bar<A, B> = A | B;
`,
      });
    });

    it("format long alias", async () => {
      await assertFormat({
        code: `
alias VeryLong =   "one" | "two" | "three" | "four" | "five" | "six" | "seven" | "height" | "nine" | "ten";
`,
        expected: `
alias VeryLong =
  | "one"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "height"
  | "nine"
  | "ten";
`,
      });
    });

    it("keeps parentheses if under an intersection expression", async () => {
      await assertFormat({
        code: `
alias Foo = (A     | B    ) & C;
`,
        expected: `
alias Foo = (A | B) & C;
`,
      });
    });
  });

  describe("alias intersection", () => {
    it("format intersection of types", async () => {
      await assertFormat({
        code: `
alias     Foo   = One       &   Two;
alias     Bar   
      = One &
    Two;
`,
        expected: `
alias Foo = One & Two;
alias Bar = One & Two;
`,
      });
    });

    it("format intersection of anonymous models", async () => {
      await assertFormat({
        code: `
alias     Foo   = { foo: string }       &   {bar: string};
alias     Bar   
      = { foo: string }  &
    {
      bar: string};
`,
        expected: `
alias Foo = {
  foo: string;
} & {
  bar: string;
};
alias Bar = {
  foo: string;
} & {
  bar: string;
};
`,
      });
    });

    it("keeps parentheses if under an union expression", async () => {
      await assertFormat({
        code: `
alias Foo = A  |  (  B     & C);
`,
        expected: `
alias Foo = A | (B & C);
`,
      });
    });
  });

  describe("enum", () => {
    it("format simple enum", async () => {
      await assertFormat({
        code: `
enum      Foo       {    A,        B}
enum      Bar       
      {    A,    
            B}
`,
        expected: `
enum Foo {
  A,
  B,
}
enum Bar {
  A,
  B,
}
`,
      });
    });

    it("format named enum", async () => {
      await assertFormat({
        code: `
enum      Foo       {    A:   "a",        B    : "b"}
enum      Bar       
      {    A: "a",    
            B:      
            "b"}
`,
        expected: `
enum Foo {
  A: "a",
  B: "b",
}
enum Bar {
  A: "a",
  B: "b",
}
`,
      });
    });

    it("separate members if there is decorators", async () => {
      await assertFormat({
        code: `
enum      Foo       {   
  @doc("foo") 
        A:   "a",    @doc("bar") 
           B    : "b", 



      @doc("third")   
       C    : "c"}

`,
        expected: `
enum Foo {
  @doc("foo")
  A: "a",

  @doc("bar")
  B: "b",

  @doc("third")
  C: "c",
}
`,
      });
    });

    it("format spread members", async () => {
      await assertFormat({
        code: `
enum Foo {
        ...       Bar  , One: "1",
        ...Baz  ; Two: "2",

}
`,
        expected: `
enum Foo {
  ...Bar,
  One: "1",
  ...Baz,
  Two: "2",
}
`,
      });
    });
  });

  describe("union", () => {
    it("format simple union", async () => {
      await assertFormat({
        code: `
union      Foo       {    A,        B}
union      Bar       
      {    A,    
            B}
`,
        expected: `
union Foo {
  A,
  B,
}
union Bar {
  A,
  B,
}
`,
      });
    });

    it("format named union", async () => {
      await assertFormat({
        code: `
        union      Foo       {    a: A,        b:       B}
`,
        expected: `
union Foo {
  a: A,
  b: B,
}

`,
      });
    });

    it("separate members if there is decorators", async () => {
      await assertFormat({
        code: `
union      Foo       {   
  @doc("foo") 
        a: A,    @doc("bar") 
           b    : B, 



      @doc("third")   
       c    : C}

`,
        expected: `
union Foo {
  @doc("foo")
  a: A,

  @doc("bar")
  b: B,

  @doc("third")
  c: C,
}
`,
      });
    });
  });

  describe("namespaces", () => {
    it("format global namespace", async () => {
      await assertFormat({
        code: `
namespace     Foo;
`,
        expected: `
namespace Foo;
`,
      });
    });

    it("format global nested namespace", async () => {
      await assertFormat({
        code: `
namespace Foo     .   Bar;
`,
        expected: `
namespace Foo.Bar;
`,
      });
    });

    it("format global namespace with decorators", async () => {
      await assertFormat({
        code: `
  @service
    @other
namespace Foo     .   Bar;
`,
        expected: `
@service
@other
namespace Foo.Bar;
`,
      });
    });

    it("format namespace with body", async () => {
      await assertFormat({
        code: `
namespace     Foo { 
  op some(): string;
}


namespace Foo     .   Bar { 
  op some(): string;
}
`,
        expected: `
namespace Foo {
  op some(): string;
}

namespace Foo.Bar {
  op some(): string;
}
`,
      });
    });

    it("format nested namespaces", async () => {
      await assertFormat({
        code: `
namespace     Foo { 
namespace   Bar { 
op some(): string;
}
}


`,
        expected: `
namespace Foo {
  namespace Bar {
    op some(): string;
  }
}
`,
      });
    });
  });

  describe("single line string literals", () => {
    it("format single line string literal", async () => {
      await assertFormat({
        code: `
@doc(   "this is a doc.  "
 )
model Foo {}
`,
        expected: `
@doc("this is a doc.  ")
model Foo {}
`,
      });
    });

    it("format single line with newline characters", async () => {
      await assertFormat({
        code: `
@doc(   "foo\\nbar"
 )
model Foo {}
`,
        expected: `
@doc("foo\\nbar")
model Foo {}
`,
      });
    });
  });

  describe("multi line string literals", () => {
    it("keeps trailing whitespaces", async () => {
      await assertFormat({
        code: `
@doc(   """
3 whitespaces   

and blank line above  
"""
 )
model Foo {}
`,
        expected: `
@doc("""
  3 whitespaces   
  
  and blank line above  
  """)
model Foo {}
`,
      });
    });

    it("keeps indent relative to closing quotes", async () => {
      await assertFormat({
        code: `
@doc(   """
this is a doc.
 that
 span
 multiple lines.
"""
 )
model Foo {}
`,
        expected: `
@doc("""
  this is a doc.
   that
   span
   multiple lines.
  """)
model Foo {}
`,
      });
    });

    it("keeps escaped charaters", async () => {
      await assertFormat({
        code: `
@doc(   """
with \\n
and \\t
"""
 )
model Foo {}
`,
        expected: `
@doc("""
  with \\n
  and \\t
  """)
model Foo {}
`,
      });
    });
  });

  describe("number literals", () => {
    it("format integer", async () => {
      await assertFormat({
        code: `
alias MyNum =     123   ;
`,
        expected: `
alias MyNum = 123;
`,
      });
    });

    it("format float", async () => {
      await assertFormat({
        code: `
alias MyFloat1 =     1.234   ;
alias MyFloat2 =     0.123   ;
`,
        expected: `
alias MyFloat1 = 1.234;
alias MyFloat2 = 0.123;
`,
      });
    });

    it("format e notation numbers", async () => {
      await assertFormat({
        code: `
alias MyBigNumber =     1.0e8  ;
`,
        expected: `
alias MyBigNumber = 1.0e8;
`,
      });
    });

    it("format big numbers", async () => {
      await assertFormat({
        code: `
alias MyBigNumber =     1.0e999999999   ;
`,
        expected: `
alias MyBigNumber = 1.0e999999999;
`,
      });
    });
  });

  describe("recoverable error can be fixed", () => {
    it("adds missing ;", async () => {
      await assertFormat({
        code: `
alias Foo = string
model Bar {}
`,
        expected: `
alias Foo = string;
model Bar {}
`,
      });
    });

    it("adds missing } at the end of the file", async () => {
      await assertFormat({
        code: `
namespace Bar {
`,
        expected: `
namespace Bar {

}
`,
      });
    });
  });

  describe("directives", () => {
    it("keeps directive before a model", async () => {
      await assertFormat({
        code: `
  #suppress "some-error"    "because"
  
model Bar {}
`,
        expected: `
#suppress "some-error" "because"
model Bar {}
`,
      });
    });

    it("keeps directive before a model property", async () => {
      await assertFormat({
        code: `
        
        model Bar {
          
          #suppress   "some-error"   "because"
  id: string;
}
`,
        expected: `
model Bar {
  #suppress "some-error" "because"
  id: string;
}
`,
      });
    });

    it("keeps directive before a decorators", async () => {
      await assertFormat({
        code: `
  #suppress   "some-error"     "because"
    @decorate("args")
   @decorate()


namespace MyNamespace {}
`,
        expected: `
#suppress "some-error" "because"
@decorate("args")
@decorate
namespace MyNamespace {

}
`,
      });
    });

    it("directive hugs decorators on model property", async () => {
      await assertFormat({
        code: `
model Foo {
  prop1: string;
  #suppress   "some-error"     "because"
    @decorate("args")
   @decorate
   prop2: string;
  }
`,
        expected: `
model Foo {
  prop1: string;

  #suppress "some-error" "because"
  @decorate("args")
  @decorate
  prop2: string;
}
`,
      });
    });
  });

  describe("decorator declaration", () => {
    it("format simple decorator declaration inline", async () => {
      await assertFormat({
        code: `
extern 
  dec 
    foo(target: Type, 
      arg1: StringLiteral);
      `,
        expected: `
extern dec foo(target: Type, arg1: StringLiteral);
`,
      });
    });

    it("format decorator without parameter types", async () => {
      await assertFormat({
        code: `
extern 
  dec 
    foo(target, 
      arg1);
      `,
        expected: `
extern dec foo(target, arg1);
`,
      });
    });

    it("format decorator with optional parameters", async () => {
      await assertFormat({
        code: `
extern 
  dec 
    foo(target: Type, arg1: StringLiteral, 
      arg2?: StringLiteral);
      `,
        expected: `
extern dec foo(target: Type, arg1: StringLiteral, arg2?: StringLiteral);
`,
      });
    });

    it("format decorator with rest parameters", async () => {
      await assertFormat({
        code: `
extern 
  dec 
    foo(target: Type, arg1: StringLiteral,
      ...args: StringLiteral[]);
      `,
        expected: `
extern dec foo(target: Type, arg1: StringLiteral, ...args: StringLiteral[]);
`,
      });
    });

    it("split decorator argument into multiple lines if too long", async () => {
      await assertFormat({
        code: `
extern dec  foo(target: Type,   arg1: StringLiteral,  arg2: StringLiteral,  arg3: StringLiteral,  arg4: StringLiteral);
      `,
        expected: `
extern dec foo(
  target: Type,
  arg1: StringLiteral,
  arg2: StringLiteral,
  arg3: StringLiteral,
  arg4: StringLiteral
);
`,
      });
    });
  });

  describe("function declaration", () => {
    it("format simple function declaration inline", async () => {
      await assertFormat({
        code: `
extern 
  fn 
    foo( 
      arg1: StringLiteral) :   void;
      `,
        expected: `
extern fn foo(arg1: StringLiteral): void;
`,
      });
    });

    it("format function without parameter types and return type", async () => {
      await assertFormat({
        code: `
extern 
  fn 
    foo(target, 
      arg1);
      `,
        expected: `
extern fn foo(target, arg1);
`,
      });
    });

    it("format function with optional parameters", async () => {
      await assertFormat({
        code: `
extern 
  fn 
    foo(target: Type, arg1: StringLiteral, 
      arg2?: StringLiteral): void;
      `,
        expected: `
extern fn foo(target: Type, arg1: StringLiteral, arg2?: StringLiteral): void;
`,
      });
    });

    it("format function with rest parameters", async () => {
      await assertFormat({
        code: `
extern 
  fn 
    foo(target: Type, arg1: Type,
      ...args: Type[]): void;
      `,
        expected: `
extern fn foo(target: Type, arg1: Type, ...args: Type[]): void;
`,
      });
    });

    it("split decorator argument into multiple lines if too long", async () => {
      await assertFormat({
        code: `
extern fn  foo( arg1: StringLiteral,  arg2: StringLiteral,  arg3: StringLiteral,  arg4: StringLiteral) : void;
      `,
        expected: `
extern fn foo(
  arg1: StringLiteral,
  arg2: StringLiteral,
  arg3: StringLiteral,
  arg4: StringLiteral
): void;
`,
      });
    });
  });

  describe("decorators", () => {
    it("keep simple decorators inline", async () => {
      await assertFormat({
        code: `
namespace Foo {
  @route("inline")  op       simple(): string;
}
      `,
        expected: `
namespace Foo {
  @route("inline") op simple(): string;
}
      `,
      });
    });

    it("it preserve new line if provided", async () => {
      await assertFormat({
        code: `
namespace Foo {
  @route("inline")
         op  my(): string;
}
      `,
        expected: `
namespace Foo {
  @route("inline")
  op my(): string;
}
      `,
      });
    });

    it("split by new line if there is more than 2 decorator", async () => {
      await assertFormat({
        code: `
namespace Foo {
  @route("inline") @mark @bar op       my(): string;
}
      `,
        expected: `
namespace Foo {
  @route("inline")
  @mark
  @bar
  op my(): string;
}
      `,
      });
    });

    it("split decorator first if line is long", async () => {
      await assertFormat({
        code: `
namespace Foo {
  @doc("this is a very long documentation that will for sure overflow the max line length") op my(parm: string): string;
}
      `,
        expected: `
namespace Foo {
  @doc("this is a very long documentation that will for sure overflow the max line length")
  op my(parm: string): string;
}
      `,
      });
    });
  });

  describe("augment decorators", () => {
    it("format into a single line if possible", async () => {
      await assertFormat({
        code: `
@@doc(Foo, 
  
        "This is some post doc"
        
        )
      `,
        expected: `
@@doc(Foo, "This is some post doc");
      `,
      });
    });

    it("break arguments per lines if the decorator is too long", async () => {
      await assertFormat({
        code: `
@@doc(Foo,  "This is getting very very very long 1", "This is getting very very very long 2", "This is getting very very very long 3");
      `,
        expected: `
@@doc(Foo,
  "This is getting very very very long 1",
  "This is getting very very very long 2",
  "This is getting very very very long 3"
);
      `,
      });
    });
  });

  describe("interfaces", () => {
    it("removes op prefix", async () => {
      await assertFormat({
        code: `
interface Foo {
  op foo(): int32;
}`,
        expected: `
interface Foo {
  foo(): int32;
}`,
      });
    });
  });

  describe("templated types", () => {
    it("format parameter declarations", async () => {
      await assertFormat({
        code: `
model Foo<   T  , K
> {
}`,
        expected: `
model Foo<T, K> {}`,
      });
    });

    it("format parameter declarations with defaults", async () => {
      await assertFormat({
        code: `
model Foo<   T  ="abc",    K =        134
> {
}`,
        expected: `
model Foo<T = "abc", K = 134> {}`,
      });
    });

    it("format parameter declarations with constraints", async () => {
      await assertFormat({
        code: `
model Foo<   T  extends      string, K      extends { 
        foo: int32   }
> {
}`,
        expected: `
model Foo<T extends string, K extends {foo: int32}> {}`,
      });
    });

    it("format parameter declarations with constraints and defaults", async () => {
      await assertFormat({
        code: `
model Foo<T       extends    string =      
    "abc"> {
}`,
        expected: `
model Foo<T extends string = "abc"> {}`,
      });
    });
  });

  describe("template references", () => {
    it("format simple template reference", async () => {
      await assertFormat({
        code: `
alias Foo = Bar<        
  string
>;
`,
        expected: `
alias Foo = Bar<string>;`,
      });
    });

    it("doesn't split if there is a single argument that is too long", async () => {
      await assertFormat({
        code: `
alias Foo = Bar<
  "very very very very very very very very very very very verylong string that is overflowing the max column allowed">;
`,
        expected: `
alias Foo = Bar<"very very very very very very very very very very very verylong string that is overflowing the max column allowed">;`,
      });
    });

    it("doesn't split if there is multiple args but line is not too long", async () => {
      await assertFormat({
        code: `
alias Foo = Bar<
  string,     int32, 
    boolean
`,
        expected: `
alias Foo = Bar<string, int32, boolean>;`,
      });
    });

    it("split and indent if there is multiple argument and line is overflowing the max column allowed", async () => {
      await assertFormat({
        code: `
alias Foo = Bar<
  "very long string that is overflowing the max column allowed",  "very long string that is overflowing the max column allowed">;
`,
        expected: `
alias Foo = Bar<
  "very long string that is overflowing the max column allowed",
  "very long string that is overflowing the max column allowed"
>;`,
      });
    });

    it("handles nested named template args", async () => {
      await assertFormat({
        code: 'alias F=Foo<int32,V=Foo<V=unknown,T=null,U="test">,U=Foo<string,T=int32,V=never>>;',
        expected: `
alias F = Foo<
  int32,
  V = Foo<V = unknown, T = null, U = "test">,
  U = Foo<string, T = int32, V = never>
>;`,
      });
    });
  });

  describe("array expression", () => {
    it("format an array expression", async () => {
      await assertFormat({
        code: `
alias Foo = string       [];
`,
        expected: `
alias Foo = string[];
`,
      });
    });

    it("keeps parentheses for array type if necessary(for union)", async () => {
      await assertFormat({
        code: `
alias Foo = (string     | int32    )  [];
`,
        expected: `
alias Foo = (string | int32)[];
`,
      });
    });

    it("keeps parentheses for array type if necessary(for intersection)", async () => {
      await assertFormat({
        code: `
alias Foo = (string     & int32    )  [];
`,
        expected: `
alias Foo = (string & int32)[];
`,
      });
    });
  });

  describe("tuple expression", () => {
    it("format a single line tuple", async () => {
      await assertFormat({
        code: `
alias Foo = [string, 
  "abc",           134];
`,
        expected: `
alias Foo = [string, "abc", 134];
`,
      });
    });
    it("format a long tuple over multi line", async () => {
      await assertFormat({
        code: `
alias Foo = ["very long text that will overflow 1","very long text that will overflow 2", "very long text that will overflow 3" ];
`,
        expected: `
alias Foo = [
  "very long text that will overflow 1",
  "very long text that will overflow 2",
  "very long text that will overflow 3"
];
`,
      });
    });
  });

  describe("empty statements", () => {
    it("remove empty statements", async () => {
      await assertFormat({
        code: `
  alias foo = "";;;;
  `,
        expected: `
alias foo = "";
  `,
      });
    });

    it("keeps comments inside empty statements", async () => {
      await assertFormat({
        code: `
  alias foo = "";; /* one */ ;; /* two */ ;;; /* three */ ;;
  `,
        expected: `
alias foo = ""; /* one */ /* two */ /* three */
  `,
      });
    });
  });

  describe("member expression", () => {
    it("a simple member expression", async () => {
      await assertFormat({
        code: `
model Foo {
  p: Some .     bar;
}
`,
        expected: `
model Foo {
  p: Some.bar;
}
`,
      });
    });
    it("nested member expression", async () => {
      await assertFormat({
        code: `
model Foo {
  p: Some . 
  Nested.     bar;
}
`,
        expected: `
model Foo {
  p: Some.Nested.bar;
}
`,
      });
    });
  });

  describe("meta type accessor", () => {
    it("format with ::", async () => {
      await assertFormat({
        code: `
@@doc(myOp ::  parameters.foo, "")
`,
        expected: `
@@doc(myOp::parameters.foo, "");
`,
      });
    });
  });

  describe("valueof", () => {
    it("format simple valueof", async () => {
      await assertFormat({
        code: `
model Foo<T extends      valueof        string>{}
`,
        expected: `
model Foo<T extends valueof string> {}
`,
      });
    });

    it("keeps parentheses around valueof inside a union", async () => {
      await assertFormat({
        code: `
model Foo<T extends      (valueof        string) | Model   >{}
`,
        expected: `
model Foo<T extends (valueof string) | Model> {}
`,
      });
    });
  });

  describe("projections", () => {
    it("format projections", async () => {
      await assertFormat({
        code: `
projection         model#proj 
  {pre to{} to{} pre from {} from {}}
`,
        expected: `
projection model#proj {
  pre to {

  }
  to {

  }
  pre from {

  }
  from {

  }
}
`,
      });
    });

    it("format empty projection on single line", async () => {
      await assertFormat({
        code: `
projection    model#proj    {

}`,
        expected: `
projection model#proj {}`,
      });
    });

    it("format projections with args", async () => {
      await assertFormat({
        code: `
projection         model#proj 
  {pre to ( val ) {} to(   val) {} pre from(  
    
    val) {} from (val  ){}
`,
        expected: `
projection model#proj {
  pre to(val) {

  }
  to(val) {

  }
  pre from(val) {

  }
  from(val) {

  }
}
`,
      });
    });

    it("format function call", async () => {
      await assertFormat({
        code: `
projection model#proj {
to {
   bar(     one, 
    
    two)
}
`,
        expected: `
projection model#proj {
  to {
    bar(one, two);
  }
}
`,
      });
    });

    describe("format operation expression(s)", () => {
      ["+", "-", "*", "/", "==", "!=", ">", "<", ">=", "<=", "||", "&&"].forEach((op) => {
        it(`with ${op}`, async () => {
          await assertFormat({
            code: `
projection model#proj {
to {
    bar( one 
    
      ${op} 
      two)
}
}
    `,
            expected: `
projection model#proj {
  to {
    bar(one ${op} two);
  }
}
    `,
          });
        });
      });

      [
        ["1 + 2 * 3", "1 + (2 * 3)"],
        ["( 1 + 2) * 3", "(1 + 2) * 3"],
        ["one || two && three", "one || (two && three)"],
      ].forEach(([input, expected]) => {
        it(`case ${expected}`, async () => {
          await assertFormat({
            code: `
projection model#proj {
to {
    bar(${input})
}
}
    `,
            expected: `
projection model#proj {
  to {
    bar(${expected});
  }
}
    `,
          });
        });
      });
    });

    it("format lambda", async () => {
      await assertFormat({
        code: `
projection model#proj {
to {
  (  a ,  
    b) => { bar();}
}
}
`,
        expected: `
projection model#proj {
  to {
    (a, b) => {
      bar();
    };
  }
}
`,
      });
    });

    describe("if", () => {
      it("format simple if", async () => {
        await assertFormat({
          code: `
projection model#proj {
  to {
    if foo 
    
      {
              bar();
    }
  }
}
`,
          expected: `
projection model#proj {
  to {
    if foo {
      bar();
    };
  }
}
`,
        });
      });

      it("format with else if", async () => {
        await assertFormat({
          code: `
projection model#proj {
  to {
    if one 
    
      {
              bar();
    } else 
    if two { bar()}
  }
}
`,
          expected: `
projection model#proj {
  to {
    if one {
      bar();
    } else if two {
      bar();
    };
  }
}
`,
        });
      });

      it("format with else", async () => {
        await assertFormat({
          code: `
projection model#proj {
  to {
    if one 
    
      {
              bar();
    } else 
     { bar()}
  }
}
`,
          expected: `
projection model#proj {
  to {
    if one {
      bar();
    } else {
      bar();
    };
  }
}
`,
        });
      });
    });
  });

  describe("when embedded", () => {
    it("doesn't include blank line at the end (in markdown)", async () => {
      await assertFormat({
        parser: "markdown",
        code: `
This is markdown
\`\`\`typespec

op test(): string;


\`\`\`
`,
        expected: `
This is markdown

\`\`\`typespec
op test(): string;
\`\`\`
`,
      });
    });
  });

  describe("string templates", () => {
    describe("single line", () => {
      it("format simple single line string template", async () => {
        await assertFormat({
          code: `alias T = "foo \${     "def" } baz";`,
          expected: `alias T = "foo \${"def"} baz";`,
        });
      });

      it("format simple single line string template with multiple interpolation", async () => {
        await assertFormat({
          code: `alias T = "foo \${     "one" } bar \${"two" } baz";`,
          expected: `alias T = "foo \${"one"} bar \${"two"} baz";`,
        });
      });

      it("format model expression in single line string template", async () => {
        await assertFormat({
          code: `alias T = "foo \${     {foo: 1, bar: 2} } baz";`,
          expected: `
alias T = "foo \${{
  foo: 1;
  bar: 2;
}} baz";
          `,
        });
      });
    });
    describe("triple quoted", () => {
      it("format simple single line string template", async () => {
        await assertFormat({
          code: `
alias T = """
    This \${     "one" } goes over
    multiple
    \${     "two" }
    lines
    """;`,
          expected: `
alias T = """
  This \${"one"} goes over
  multiple
  \${"two"}
  lines
  """;`,
        });
      });
    });
  });

  describe("const", () => {
    it("format const without type annotations", async () => {
      await assertFormat({
        code: `
const     a  =   123;
`,
        expected: `
const a = 123;
`,
      });
    });

    it("format const with type annotations", async () => {
      await assertFormat({
        code: `
const     a  : in32=   123;
`,
        expected: `
const a: in32 = 123;
`,
      });
    });
  });
});
