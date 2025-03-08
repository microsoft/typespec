import { ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import { Binder, createBinder } from "../src/core/binder.js";
import { typeReferenceToString } from "../src/core/helpers/syntax-utils.js";
import { inspectSymbolFlags } from "../src/core/inspector/symbol.js";
import { createLogger } from "../src/core/logger/logger.js";
import { createTracer } from "../src/core/logger/tracer.js";
import { createResolver, NameResolver } from "../src/core/name-resolver.js";
import { getNodeAtPosition, parse } from "../src/core/parser.js";
import {
  IdentifierNode,
  JsSourceFileNode,
  MemberExpressionNode,
  Node,
  NodeFlags,
  ResolutionResult,
  ResolutionResultFlags,
  Sym,
  SymbolFlags,
  SymbolLinks,
  SyntaxKind,
  TypeReferenceNode,
} from "../src/core/types.js";
import { createSourceFile, Program } from "../src/index.js";

let binder: Binder;
let resolver: ReturnType<typeof createResolver>;
let program: Program;

beforeEach(() => {
  program = createProgramShim();
  binder = createBinder(program);
  resolver = createResolver(program);
});

describe("model statements", () => {
  describe("binding", () => {
    it("binds is members", () => {
      const sym = getGlobalSymbol([
        `
          model M1 {
            x: "x";
          }
  
          model M2 is M1 {
            y: "y";
          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          M1: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
            },
          },
          M2: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
              y: {
                flags: SymbolFlags.Member,
              },
            },
          },
        },
      });
    });

    it("binds spread members", () => {
      const sym = getGlobalSymbol([
        `
          model M1 {
            x: "x";
          }
  
          model M2 {
            ... M1,
            y: "y";
          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          M1: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
            },
          },
          M2: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
              y: {
                flags: SymbolFlags.Member,
              },
            },
          },
        },
      });
    });

    it("binds spread members of templates", () => {
      const sym = getGlobalSymbol([
        `
          model M1<T> {
            x: "x";
            ... T;
          }
  
          model M2 {
            ... M1<{}>,
            y: "y";
          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          M2: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
              y: {
                flags: SymbolFlags.Member,
              },
            },
          },
        },
      });
    });

    it("binds spread members of templates with constraints", () => {
      const sym = getGlobalSymbol([
        `
          model M1<T extends {z: "z"}> {
            x: "x";
            ... T;
          }
  
          model M2 {
            ... M1<{}>,
            y: "y";
          }
          `,
      ]);
      assertSymbol(sym, {
        exports: {
          M2: {
            members: {
              x: { flags: SymbolFlags.Member },
              y: { flags: SymbolFlags.Member },
              z: { flags: SymbolFlags.Member },
            },
          },
        },
      });
    });

    it("sets containsUnknownMembers flag with spread/extends of instantiations", () => {
      const sym = getGlobalSymbol([
        `
          model Template<T> { ... T };
  
          model M1 extends Template<{}> {}

          model M2 {
            ... Template<{}>;
          }

          model M3 extends M1 {}
          model M4 {
            ... M1;
          }
          `,
      ]);

      const hasUnknownMembers = { links: { hasUnknownMembers: true } };
      assertSymbol(sym, {
        exports: {
          M1: hasUnknownMembers,
          M2: hasUnknownMembers,
          M3: hasUnknownMembers,
          M4: hasUnknownMembers,
        },
      });
    });

    it("binds members of templates", () => {
      const sym = getGlobalSymbol([
        `
          model Template<T> {
            x: "x";
          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          Template: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
            },
          },
        },
      });
    });
  });

  describe("resolution", () => {
    it("resolves model members", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            model Foo {
              prop: "prop";
            }
          `,
        ],
        "Foo.prop",
      );
      assertSymbol(prop, { name: "prop", flags: SymbolFlags.Member });
    });

    it("resolves model members from spread", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            model Bar {
              prop: "prop";
            }
  
            model Foo {
              ... Bar;
            }
          `,
        ],
        "Foo.prop",
      );
      assertSymbol(prop, { name: "prop", flags: SymbolFlags.Member });
    });

    it("resolves model members from extends", () => {
      const { "Foo.prop": prop, Bar } = getResolutions(
        [
          `
            model Bar {
              prop: "prop";
            }
  
            model Foo extends Bar {}
          `,
        ],
        "Foo.prop",
        "Bar",
      );
      assertSymbol(prop, { name: "prop", flags: SymbolFlags.Member });
      ok(prop.finalSymbol!.parent === Bar.finalSymbol);
    });

    it("resolves model members from extends with unknown spreads to unknown not inherited member", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            model Bar {
              prop: "prop";
            }
  
            model Foo extends Bar {
              ... Baz<{}>;
            }
  
            model Baz<T> {
              ... T;
            }
          `,
        ],
        "Foo.prop",
      );
      ok(prop.resolutionResult & ResolutionResultFlags.Unknown);
    });

    it("model members should be unknown with an unknown spread", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            model Foo {
              ... Baz<{}>;
            }
  
            model Baz<T> {
              ... T;
            }
  
          `,
        ],
        "Foo.prop",
      );
      ok(prop.resolutionResult & ResolutionResultFlags.Unknown);
    });

    it("model members should be unknown with an unknown base class", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            model Foo extends Baz<{}> {
            }
  
            model Baz<T> {
              ... T;
            }
  
          `,
        ],
        "Foo.prop",
      );
      ok(prop.resolutionResult & ResolutionResultFlags.Unknown);
    });

    it("resolves model circular reference", () => {
      const { Foo: model } = getResolutions(
        [
          `
            model Foo {
              prop: Foo;
            }
          `,
        ],
        "Foo",
      );
      assertSymbol(model, { name: "Foo", flags: SymbolFlags.Declaration });
    });
  });
});

describe("model expressions", () => {
  describe("binding", () => {
    it("binds members", () => {
      const sym = getAliasedSymbol("M1", [
        `
          alias M1 = {
            x: "x";
          }
          `,
      ]);

      assertSymbol(sym, {
        members: {
          x: {
            flags: SymbolFlags.Member,
          },
        },
      });
    });

    it("binds spread members", () => {
      const sym = getAliasedSymbol("M2", [
        `
          alias M1 {
            x: "x";
          }
  
          alias M2 {
            ... M1,
            y: "y";
          }
          `,
      ]);

      assertSymbol(sym, {
        members: {
          x: {
            flags: SymbolFlags.Member,
          },
          y: {
            flags: SymbolFlags.Member,
          },
        },
      });
    });

    it("binds spread members of templates", () => {
      const sym = getAliasedSymbol("M2", [
        `
          alias M1<T> = {
            x: "x";
            ... T;
          }
  
          alias M2 = {
            ... M1<{}>,
            y: "y";
          }
          `,
      ]);

      assertSymbol(sym, {
        members: {
          x: {
            flags: SymbolFlags.Member,
          },
          y: {
            flags: SymbolFlags.Member,
          },
        },
      });
    });

    it("binds spread members of templates with constraints", () => {
      const sym = getAliasedSymbol("M2", [
        `
          alias M1<T extends {z: "z"}> = {
            x: "x";
            ... T;
          }
  
          alias M2 {
            ... M1<{}>,
            y: "y";
          }
          `,
      ]);

      assertSymbol(sym, {
        members: {
          x: { flags: SymbolFlags.Member },
          y: { flags: SymbolFlags.Member },
          z: { flags: SymbolFlags.Member },
        },
      });
    });

    it("binds members of templates", () => {
      const sym = getAliasedSymbol("Template", [
        `
          alias Template<T> =  {
            x: "x";
          }
          `,
      ]);

      assertSymbol(sym, {
        members: {
          x: {
            flags: SymbolFlags.Member,
          },
        },
      });
    });
  });

  describe("resolution", () => {
    it("resolves model members", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            alias Foo = {
              prop: "prop";
            }
          `,
        ],
        "Foo.prop",
      );
      assertSymbol(prop, { name: "prop", flags: SymbolFlags.Member });
    });

    it("resolves model members from spread", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            alias Bar = {
              prop: "prop";
            }
  
            alias Foo = {
              ... Bar;
            }
          `,
        ],
        "Foo.prop",
      );
      assertSymbol(prop, { name: "prop", flags: SymbolFlags.Member });
    });

    it("model members should be unknown with an unknown spread", () => {
      const { "Foo.prop": prop } = getResolutions(
        [
          `
            alias Foo = {
              ... Baz<{}>;
            }
  
            alias Baz<T> = {
              ... T;
            }
  
          `,
        ],
        "Foo.prop",
      );
      ok(prop.resolutionResult & ResolutionResultFlags.Unknown);
    });

    it("resolves model expression circular reference with alias", () => {
      const { Foo: model } = getResolutions(
        [
          `
            alias Foo = {
              prop: Foo;
            }
          `,
        ],
        "Foo",
      );
      assertSymbol(model, { name: "-" });
    });
  });
});

describe("model properties", () => {
  it("resolves meta properties", () => {
    const { "Foo.prop::type": propType, Bar } = getResolutions(
      [
        `
          model Foo {
            prop: Bar;
          }
          model Bar { }
        `,
      ],
      "Foo.prop::type",
      "Bar",
    );
    ok(propType.finalSymbol === Bar.finalSymbol, "should resolve to Bar");
  });

  it("resolves meta properties of nested model types", () => {
    const { "Foo.prop::type.nestedProp::type": propType, Bar } = getResolutions(
      [
        `
          model Foo {
            prop: {
              nestedProp: Bar;
            };
          }
          model Bar { }
        `,
      ],
      "Foo.prop::type.nestedProp::type",
      "Bar",
    );
    ok(propType.finalSymbol === Bar.finalSymbol, "should resolve to Bar");
  });

  it("resolves meta properties of aliased model properties", () => {
    const { "FooProp::type": propType, Bar } = getResolutions(
      [
        `
          model Foo {
            prop: Bar;
          }
          model Bar { }
          alias FooProp = Foo.prop;
        `,
      ],
      "FooProp::type",
      "Bar",
    );
    ok(propType.finalSymbol === Bar.finalSymbol, "should resolve to Bar");
  });
});
describe("interfaces", () => {
  describe("binding", () => {
    it("binds interface members from extends", () => {
      const sym = getGlobalSymbol([
        `
          interface Bar {
            x(): void;
          }
  
          interface Baz {
            y(): void;
          }
          interface Foo extends Bar, Baz {}
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            members: {
              x: {
                flags: SymbolFlags.Member | SymbolFlags.Operation,
              },
              y: {
                flags: SymbolFlags.Member | SymbolFlags.Operation,
              },
            },
          },
        },
      });
    });

    it("binds interface members from extends templates", () => {
      const sym = getGlobalSymbol([
        `
          interface Template<T> {
            x(): void;
          }

          interface Foo extends Template<{}> {

          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            members: {
              x: {
                flags: SymbolFlags.Member | SymbolFlags.Operation,
              },
            },
          },
        },
      });
    });

    it("binds interface members from multiple extends templates", () => {
      const sym = getGlobalSymbol([
        `
          interface Template1<T> {
            x(): void;
          }

          interface Template2<T> extends Template3<T> {
            y(): void;
          }

          interface Template3<T> {
            z(): void;
          }

          interface Foo extends Template1<{}>, Template2<{}> {

          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            members: {
              x: {
                flags: SymbolFlags.Member | SymbolFlags.Operation,
              },
              y: {
                flags: SymbolFlags.Member | SymbolFlags.Operation,
              },
              z: {
                flags: SymbolFlags.Member | SymbolFlags.Operation,
              },
            },
          },
        },
      });
    });
  });
  describe("resolution", () => {
    it("resolves interface members", () => {
      const { "Foo.x": x } = getResolutions(
        [
          `
            interface Foo {
              x(): void;
            }
          `,
        ],
        "Foo.x",
      );
      assertSymbol(x, { name: "x", flags: SymbolFlags.Member | SymbolFlags.Operation });
    });

    it("resolves interface members from templates", () => {
      const { "Foo.x": x, "Template.x": tx } = getResolutions(
        [
          `
            interface Template<T> {
              x(): void;
            }
            interface Foo extends Template<{}> {}
          `,
        ],
        "Foo.x",
        "Template.x",
      );

      assertSymbol(x, { name: "x", flags: SymbolFlags.Member | SymbolFlags.Operation });
      assertSymbol(tx, { name: "x", flags: SymbolFlags.Member | SymbolFlags.Operation });
    });
  });
});

describe("operations", () => {
  describe("resolution", () => {
    it("resolves parameters meta property", () => {
      const { "Foo::parameters.x::type": x, Bar: Bar } = getResolutions(
        [
          `
            model Bar { }
            op Foo(x: Bar): void;
          `,
        ],
        "Foo::parameters.x::type",
        "Bar",
      );

      ok(x.finalSymbol === Bar.finalSymbol, "Should resolve to Bar");
    });

    it("resolves parameters meta property with is ops", () => {
      const { "Baz::parameters.x::type": x, Bar: Bar } = getResolutions(
        [
          `
            model Bar { }
            op Foo(x: Bar): void;
            op Baz is Foo;
          `,
        ],
        "Baz::parameters.x::type",
        "Bar",
      );

      ok(x.finalSymbol === Bar.finalSymbol, "Should resolve to Bar");
    });
  });
});

describe("accessing non members resolve to NotFound", () => {
  it("accessing property on ModelProperty", () => {
    const { "Foo.bar.doesNotExists": x } = getResolutions(
      [
        `
          model Foo { bar: string }
        `,
      ],
      "Foo.bar.doesNotExists",
    );

    ok(x.resolutionResult & ResolutionResultFlags.NotFound);
  });

  it("accessing property on ModelProperty of operation parameters", () => {
    const { "test::parameters.param.doesNotExists": x } = getResolutions(
      [
        `
          op test(param: string): void;
        `,
      ],
      "test::parameters.param.doesNotExists",
    );

    ok(x.resolutionResult & ResolutionResultFlags.NotFound);
  });

  it("accessing property on ModelProperty of operation parameters template", () => {
    const { "test::parameters.param.doesNotExists": x } = getResolutions(
      [
        `
          op template<T>(param: T): void;
          op test is template;
        `,
      ],
      "test::parameters.param.doesNotExists",
    );

    ok(x.resolutionResult & ResolutionResultFlags.NotFound);
  });
});
describe("enums", () => {
  describe("binding", () => {
    it("binds enum members from spread", () => {
      const sym = getGlobalSymbol([
        `
          enum A {
            x;
            ... B;
          }

          enum B{
            y: 2;
          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          A: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
              y: {
                flags: SymbolFlags.Member,
              },
            },
          },
          B: {
            members: {
              y: {
                flags: SymbolFlags.Member,
              },
            },
          },
        },
      });
    });
  });

  describe("resolution", () => {
    it("resolves enum members", () => {
      const { "Foo.x": x } = getResolutions(
        [
          `
            enum Foo {
              x;
            }
          `,
        ],
        "Foo.x",
      );
      assertSymbol(x, { name: "x", flags: SymbolFlags.Member });
    });

    it("resolves enum members from spread", () => {
      const { "Foo.x": x, "Bar.y": y } = getResolutions(
        [
          `
            enum Foo {
              x;
            }
            enum Bar {
              ... Foo;
              y;
            }
          `,
        ],
        "Foo.x",
        "Bar.y",
      );
      assertSymbol(x, { name: "x", flags: SymbolFlags.Member });
      assertSymbol(y, { name: "y", flags: SymbolFlags.Member });
    });
  });
});

describe("unions", () => {
  describe("binding", () => {
    it("binds union members", () => {
      const sym = getGlobalSymbol([
        `
          union Foo {
            x: "x";
          }
          `,
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
            },
          },
        },
      });
    });
  });
  describe("resolution", () => {
    it("resolves named union variants", () => {
      const { "Foo.x": x } = getResolutions(
        [
          `
            union Foo {
              x: "x";
            }
          `,
        ],
        "Foo.x",
      );
      assertSymbol(x, { name: "x", flags: SymbolFlags.Member });
    });
  });
});

describe("namespaces", () => {
  describe("binding", () => {
    it("merges across the same file", () => {
      const sym = getGlobalSymbol([
        `namespace Foo {
            model M { }  
          }
          namespace Foo {
            model N { }
          }`,
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            flags: SymbolFlags.Namespace,
            exports: {
              M: {
                flags: SymbolFlags.Model,
              },
              N: {
                flags: SymbolFlags.Model,
              },
            },
          },
        },
      });
    });

    it("merges across files", () => {
      const sym = getGlobalSymbol([
        `namespace Foo {
            model M { }  
          }`,
        `namespace Foo {
            model N { }
          }`,
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            flags: SymbolFlags.Namespace,
            exports: {
              M: {
                flags: SymbolFlags.Model,
              },
              N: {
                flags: SymbolFlags.Model,
              },
            },
          },
        },
      });
    });
  });

  describe("resolution", () => {
    it("resolves namespace members", () => {
      const { "Foo.Bar.M": M, "Foo.N": N } = getResolutions(
        [
          `namespace Foo {
              namespace Bar {
                model M {}
              }
              model N { }
            }
          `,
        ],
        "Foo.Bar.M",
        "Foo.N",
      );
      assertSymbol(M, { name: "M" });
      assertSymbol(N, { name: "N" });
    });
  });
});

describe("js namespaces", () => {
  describe("binding", () => {
    it("merges across files", () => {
      const sym = getGlobalSymbol([
        {
          $decorators: { Foo: { testDec1: () => null } },
        },
        {
          $decorators: { "Foo.Bar": { testDec2: () => null } },
        },
        {
          $decorators: { "Foo.Bar": { testDec3: () => null } },
        },
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            flags: SymbolFlags.Namespace,
            exports: {
              "@testDec1": {
                flags: SymbolFlags.Decorator,
              },
              Bar: {
                flags: SymbolFlags.Namespace,
                exports: {
                  "@testDec2": {
                    flags: SymbolFlags.Decorator,
                  },
                  "@testDec3": {
                    flags: SymbolFlags.Decorator,
                  },
                },
              },
            },
          },
        },
      });
    });
    it("merges with tsp namespace", () => {
      const sym = getGlobalSymbol([
        `
          namespace Foo {
            model FooModel {}

            namespace Bar {
              model BarModel {}
            }
          }  
        `,
        {
          $decorators: { Foo: { testDec1: () => null } },
        },
        {
          $decorators: { "Foo.Bar": { testDec2: () => null } },
        },
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            flags: SymbolFlags.Namespace,
            exports: {
              "@testDec1": {
                flags: SymbolFlags.Decorator,
              },
              FooModel: {
                flags: SymbolFlags.Model,
              },
              Bar: {
                flags: SymbolFlags.Namespace,
                exports: {
                  "@testDec2": {
                    flags: SymbolFlags.Decorator,
                  },
                  BarModel: {
                    flags: SymbolFlags.Model,
                  },
                },
              },
            },
          },
        },
      });
    });
  });
});

describe("aliases", () => {
  describe("binding", () => {
    it("binds aliases to symbols", () => {
      // this is just handled by the binder, but verifying here.
      const sym = getGlobalSymbol([
        `namespace Foo {
            model M { }  
          }
          namespace Bar {
            alias M = Foo.M;
          }`,
      ]);

      assertSymbol(sym, {
        exports: {
          Foo: {
            flags: SymbolFlags.Namespace,
            exports: {
              M: {
                flags: SymbolFlags.Model,
              },
            },
          },
          Bar: {
            flags: SymbolFlags.Namespace,
            exports: {
              M: {
                flags: SymbolFlags.Alias,
              },
            },
          },
        },
      });
    });
    it("resolves aliases to their aliased symbol", () => {
      const sym = getGlobalSymbol([
        `
            model M1 {
              x: "x";
            }

            alias M2 = M1;
            alias M3 = M2;
            `,
      ]);

      const m1Sym = sym.exports?.get("M1");
      assertSymbol(sym, {
        exports: {
          M1: {
            members: {
              x: {
                flags: SymbolFlags.Member,
              },
            },
          },
          M2: {
            flags: SymbolFlags.Alias,
            links: {
              aliasedSymbol: m1Sym,
            },
          },
          M3: {
            flags: SymbolFlags.Alias,
            links: {
              aliasedSymbol: m1Sym,
            },
          },
        },
      });
    });
  });

  describe("resolution", () => {
    it("resolves aliases", () => {
      const {
        "Foo.Bar.M": M,
        "Baz.AliasM": AliasM,
        "Baz.AliasAliasM": AliasAliasM,
      } = getResolutions(
        [
          `namespace Foo {
                namespace Bar {
                  model M {}
                }
              }
              namespace Baz {
                alias AliasM = Foo.Bar.M;
                alias AliasAliasM = AliasM;
              }
            `,
        ],
        "Foo.Bar.M",
        "Baz.AliasM",
        "Baz.AliasAliasM",
      );
      assertSymbol(M, { name: "M", flags: SymbolFlags.Model });
      assertSymbol(AliasM, { name: "M", flags: SymbolFlags.Model });
      assertSymbol(AliasAliasM, { name: "M", flags: SymbolFlags.Model });
    });

    it("resolves known members of aliased things with members", () => {
      const {
        "Foo.x": x,
        "Bar.x": aliasX,
        Baz: aliasAliasX,
      } = getResolutions(
        [
          `
            model Foo { x: "hi" }
            alias Bar = Foo;
            alias Baz = Bar.x;
          `,
        ],
        "Foo.x",
        "Bar.x",
        "Baz",
      );
      const xDescriptor = { name: "x", flags: SymbolFlags.Member };
      assertSymbol(x, xDescriptor);
      assertSymbol(aliasX, xDescriptor);
      assertSymbol(aliasAliasX, xDescriptor);
    });

    it("resolves unknown members of aliased things with members", () => {
      const { Baz: yResult } = getResolutions(
        [
          `
            model Template<T> { ... T };
            model Foo { x: "hi", ... Template<{}> }
            alias Bar = Foo;
            alias Baz = Bar.y;
          `,
        ],
        "Foo.x",
        "Bar.x",
        "Baz",
      );
      ok(yResult.resolutionResult & ResolutionResultFlags.Unknown, "Baz alias should be unknown");
    });
  });
});

describe("usings", () => {
  describe("binding", () => {
    it("binds usings to locals", () => {
      const sym = getGlobalSymbol(["namespace Foo { model M { }} namespace Bar { using Foo; }"]);
      assertSymbol(sym, {
        exports: {
          Foo: {
            flags: SymbolFlags.Namespace,
          },
          Bar: {
            flags: SymbolFlags.Namespace,
            locals: {
              M: {
                flags: SymbolFlags.Model | SymbolFlags.Using,
              },
            },
          },
        },
      });
    });
  });

  describe("resolution", () => {
    it("resolves usings", () => {
      const sources = [
        `
          namespace Foo {
            model M { }
          }
          
          namespace Bar {
            using Foo;
            ┆
          }
        `,
      ];

      const { M } = getResolutions(sources, "M");
      assertSymbol(M.finalSymbol, { name: "M", flags: SymbolFlags.Using });
    });
  });
});

type StringTuplesToSymbolRecord<T extends string[]> = {
  [K in T[number]]: ResolutionResult;
};

function getResolutions<T extends string[]>(
  sources: string[],
  ...names: T
): StringTuplesToSymbolRecord<T> {
  let index = 0;
  const symbols = {} as any;
  const referenceNodes: TypeReferenceNode[] = [];

  for (let source of sources) {
    const explicitCursorPos = source.indexOf("┆");
    const cursorPos = explicitCursorPos >= 0 ? explicitCursorPos : source.length - 1;
    const aliasCodes = names.map((name) => `alias test${name.replace(/\.|(::)/g, "")} = ${name};`);
    const aliasOffsets: number[] = [];
    let prevOffset = 0;
    for (let i = 0; i < names.length; i++) {
      aliasOffsets.push(prevOffset + aliasCodes[i].length - 1);
      prevOffset += aliasCodes[i].length;
    }
    source = source.slice(0, cursorPos) + aliasCodes.join("") + source.slice(cursorPos + 1);
    const sf = parse(source);
    program.sourceFiles.set(String(index++), sf);
    binder.bindSourceFile(sf);

    for (let i = 0; i < names.length; i++) {
      const node = getNodeAtPosition(sf, cursorPos + aliasOffsets[i]);
      referenceNodes.push(getParentTypeRef(node));
    }
  }

  resolver.resolveProgram();
  for (let i = 0; i < names.length; i++) {
    const nodeLinks = resolver.getNodeLinks(referenceNodes[i]);
    validateReferenceNodes(referenceNodes[0]);

    symbols[names[i]] = nodeLinks;
  }
  return symbols;
}

function validateReferenceNodes(node: TypeReferenceNode) {
  const base = resolver.getNodeLinks(node);
  if (!base.resolutionResult) {
    throw new Error(`Reference ${typeReferenceToString(node)} hasn't been resolved`);
  }
  validate(node.target);

  function validate(sub: IdentifierNode | MemberExpressionNode) {
    const subLinks = resolver.getNodeLinks(node);
    expect(subLinks.resolutionResult).toBe(base.resolutionResult);
    if (sub.kind === SyntaxKind.MemberExpression) {
      validate(sub.id);
    }
  }
}

function getParentTypeRef(node: Node | undefined) {
  if (!node) {
    throw new Error("Can't find parent of undefined node.");
  }
  if (node.kind !== SyntaxKind.MemberExpression && node.kind !== SyntaxKind.Identifier) {
    throw new Error(`Can't find parent of non-reference node. ${SyntaxKind[node.kind]}`);
  }

  if (!node.parent) {
    throw new Error("can't find parent.");
  }

  if (node.parent.kind === SyntaxKind.TypeReference) {
    return node.parent;
  }

  return getParentTypeRef(node.parent);
}

function resolve(sources: (string | Record<string, unknown>)[]): NameResolver {
  let index = 0;
  for (const source of sources) {
    if (typeof source === "string") {
      const sf = parse(source);
      program.sourceFiles.set(String(index++), sf);
      binder.bindSourceFile(sf);
    } else {
      const sf: JsSourceFileNode = createJsSourceFile(source);
      program.jsSourceFiles.set(String(index++), sf);
      binder.bindJsSourceFile(sf);
    }
  }

  resolver.resolveProgram();
  return resolver;
}

function getGlobalSymbol(sources: (string | Record<string, unknown>)[]): Sym {
  const resolver = resolve(sources);
  return resolver.symbols.global;
}
function getAliasedSymbol(name: string, sources: (string | Record<string, unknown>)[]): Sym {
  const global = getGlobalSymbol(sources);
  const aliasSym = global.exports?.get(name);
  ok(aliasSym, `Expected ${name} to be available in global symbol exports`);
  const aliasedSym = resolver.getSymbolLinks(aliasSym).aliasedSymbol;
  ok(aliasedSym, "Expected alias sym to have resolved");
  return aliasedSym;
}

function assertSymbol(
  sym: ResolutionResult | Sym | undefined,
  record: SymbolDescriptor = {},
): asserts sym is Required<ResolutionResult> | Sym {
  if (sym && "resolutionResult" in sym) {
    sym = sym.finalSymbol;
  }
  if (!sym) {
    throw new Error(`Symbol not found.`);
  }
  if (record.flags) {
    ok(
      sym.flags & record.flags,
      `Expected symbol ${sym.name} to have flags ${inspectSymbolFlags(
        record.flags,
      )} but got ${inspectSymbolFlags(sym.flags)}`,
    );
  }

  if (record.nodeFlags) {
    ok(
      sym.declarations[0].flags & record.nodeFlags,
      `Expected symbol ${sym.name} to have node flags ${record.nodeFlags} but got ${sym.declarations[0].flags}`,
    );
  }

  if (record.name) {
    strictEqual(sym.name, record.name);
  }

  if (record.exports) {
    ok(sym.exports, `Expected symbol ${sym.name} to have exports`);
    const exports = resolver.getAugmentedSymbolTable(sym.exports);

    for (const [name, descriptor] of Object.entries(record.exports)) {
      const exportSym = exports.get(name);
      ok(
        exportSym,
        `Expected symbol ${sym.name} to have export ${name} but only has ${[...exports.keys()].join(", ")}`,
      );
      assertSymbol(exportSym, descriptor);
    }
  }

  if (record.locals) {
    const node = sym.declarations[0] as any;
    ok(node.locals, `Expected symbol ${sym.name} to have locals`);
    const locals = resolver.getAugmentedSymbolTable(node.locals);

    for (const [name, descriptor] of Object.entries(record.locals)) {
      const localSym = locals.get(name);
      ok(localSym, `Expected symbol ${sym.name} to have local ${name}`);
      assertSymbol(localSym, descriptor);
    }
  }

  if (record.members) {
    ok(sym.members, `Expected symbol ${sym.name} to have exports`);
    const members = resolver.getAugmentedSymbolTable(sym.members);

    for (const [name, descriptor] of Object.entries(record.members)) {
      const exportSym = members.get(name);
      ok(exportSym, `Expected symbol ${sym.name} to have member ${name}`);
      assertSymbol(exportSym, descriptor);
    }
  }

  if (record.links) {
    const links = resolver.getSymbolLinks(sym);
    for (const [key, value] of Object.entries(record.links) as [keyof SymbolLinks, any][]) {
      if (value) {
        ok(links[key], `Expected symbol ${sym.name} to have link ${key}`);
        strictEqual(links[key], value);
      }
    }
  }
}

interface SymbolDescriptor {
  name?: string;
  flags?: SymbolFlags;
  nodeFlags?: NodeFlags;
  locals?: Record<string, SymbolDescriptor>;
  exports?: Record<string, SymbolDescriptor>;
  members?: Record<string, SymbolDescriptor>;
  links?: SymbolLinks;
}

function createProgramShim(): Program {
  return {
    tracer: createTracer(createLogger({ sink: { log: () => {} } })),
    reportDuplicateSymbols() {},
    onValidate() {},
    sourceFiles: new Map(),
    jsSourceFiles: new Map(),
  } as any;
}

function createJsSourceFile(exports: any): JsSourceFileNode {
  const file = createSourceFile("", "path");
  return {
    kind: SyntaxKind.JsSourceFile,
    id: {
      kind: SyntaxKind.Identifier,
      sv: "",
      pos: 0,
      end: 0,
      symbol: undefined!,
      flags: NodeFlags.Synthetic,
    },
    esmExports: exports,
    file,
    namespaceSymbols: [],
    symbol: undefined!,
    pos: 0,
    end: 0,
    flags: NodeFlags.None,
  };
}
