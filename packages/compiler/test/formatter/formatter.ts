import { strictEqual, throws } from "assert";
import prettier from "prettier";
import * as plugin from "../../formatter/index.js";

function format(code: string): string {
  const output = prettier.format(code, {
    parser: "cadl",
    plugins: [plugin],
  });
  return output;
}

function assertFormat({ code, expected }: { code: string; expected: string }) {
  const result = format(code);
  strictEqual(result.trim(), expected.trim());
}

describe("cadl: prettier formatter", () => {
  it("throws error if there is a parsing issue", () => {
    const code = `namespace this is invalid`;

    throws(() => format(code));
  });

  it("format imports", () => {
    assertFormat({
      code: `
    import   "@cadl-lang/rest";
import        "@azure-tools/cadl-autorest";
import "@azure-tools/cadl-rpaas"  ;
`,
      expected: `
import "@cadl-lang/rest";
import "@azure-tools/cadl-autorest";
import "@azure-tools/cadl-rpaas";
`,
    });
  });

  it("format using", () => {
    assertFormat({
      code: `
using       Azure.Arm  
`,
      expected: `
using Azure.Arm;
`,
    });
  });

  describe("model", () => {
    it("format simple models", () => {
      assertFormat({
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

    it("format nested models", () => {
      assertFormat({
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

    it("format models with default values", () => {
      assertFormat({
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

    it("format models with spread", () => {
      assertFormat({
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

    it("format model with decorator", () => {
      assertFormat({
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

    it("format model with heritage", () => {
      assertFormat({
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

    it("format model with is", () => {
      assertFormat({
        code: `
model   Foo is Base {
}

model   Bar is Base< 
  string    > {
}
`,
        expected: `
model Foo is Base {}

model Bar is Base<string> {}
`,
      });
    });

    it("format model with generic", () => {
      assertFormat({
        code: `
model   Foo < T   >{
}
`,
        expected: `
model Foo<T> {}
`,
      });
    });
  });

  describe("comments", () => {
    it("format single line comments", () => {
      assertFormat({
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

    it("format multi line comments", () => {
      assertFormat({
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
  });

  describe("alias union", () => {
    it("format simple alias", () => {
      assertFormat({
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

    it("format generic alias", () => {
      assertFormat({
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

    it("format long alias", () => {
      assertFormat({
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
  });

  describe("alias intersection", () => {
    it("format intersection of types", () => {
      assertFormat({
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

    it("format intersection of anoymous models", () => {
      assertFormat({
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
  });

  describe("enum", () => {
    it("format simple enum", () => {
      assertFormat({
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

    it("format named enum", () => {
      assertFormat({
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
  });

  describe("namespaces", () => {
    it("format global namespace", () => {
      assertFormat({
        code: `
namespace     Foo;
`,
        expected: `
namespace Foo;
`,
      });
    });

    it("format global nested namespace", () => {
      assertFormat({
        code: `
namespace Foo     .   Bar;
`,
        expected: `
namespace Foo.Bar;
`,
      });
    });

    it("format global namespace with decorators", () => {
      assertFormat({
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

    it("format namespace with body", () => {
      assertFormat({
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

    it("format nested namespaces", () => {
      assertFormat({
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

  describe("string literals", () => {
    it("format single line string literal", () => {
      assertFormat({
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

    it("format single line with newline characters", () => {
      assertFormat({
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

    it("format multi line string literal", () => {
      assertFormat({
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
  });

  describe("number literals", () => {
    it("format integer", () => {
      assertFormat({
        code: `
alias MyNum =     123   ;
`,
        expected: `
alias MyNum = 123;
`,
      });
    });

    it("format float", () => {
      assertFormat({
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

    it("format e notation numbers", () => {
      assertFormat({
        code: `
alias MyBigNumber =     1.0e8  ;
`,
        expected: `
alias MyBigNumber = 1.0e8;
`,
      });
    });

    it("format big numbers", () => {
      assertFormat({
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
    it("adds missing ;", () => {
      assertFormat({
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

    it("adds missing } at the end of the file", () => {
      assertFormat({
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
    it("keeps directive before a model", () => {
      assertFormat({
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

    it("keeps directive before a model property", () => {
      assertFormat({
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

    it("keeps directive before a decorators", () => {
      assertFormat({
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
  });
});
