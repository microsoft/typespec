import { expectDiagnosticEmpty, expectDiagnostics, t } from "@typespec/compiler/testing";
import { describe, it } from "vitest";
import { Tester } from "./test-host.js";

describe("$onValidate", () => {
  describe("empty-schema", () => {
    it("reports empty-schema when no GraphQL operations exist", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/empty-schema",
        severity: "warning",
        message: "GraphQL schema has no operations. At minimum a Query root type is required.",
      });
    });

    it("does not report empty-schema when no @schema decorator", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        model Book { title: string; }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report empty-schema when @query operation exists", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report empty-schema when @mutation operation exists", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
          @mutation op createBook(title: string): Book;
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report empty-schema when @subscription operation exists", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
          @subscription op onBookCreated(): Book;
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("empty-enum", () => {
    it("reports error for enum with no values", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          enum Status {}
          model Book { status: Status; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/empty-enum",
        severity: "error",
        message: 'Enum "Status" must define at least one value. GraphQL enums cannot be empty.',
      });
    });

    it("does not report error for enum with values", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          enum Status { Active, Inactive }
          model Book { status: Status; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("reserved-name", () => {
    it("reports error for model name starting with __", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model __Reserved { title: string; }
          @query op get(): __Reserved;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/reserved-name",
        severity: "error",
        message:
          'Name "__Reserved" must not begin with "__" (two underscores), which is reserved by GraphQL for introspection.',
      });
    });

    it("reports error for property name starting with __", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model Book { __internal: string; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/reserved-name",
        severity: "error",
        message:
          'Name "__internal" must not begin with "__" (two underscores), which is reserved by GraphQL for introspection.',
      });
    });

    it("reports error for operation parameter starting with __", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model Book { title: string; }
          @query op getBook(__id: string): Book;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/reserved-name",
        severity: "error",
        message:
          'Name "__id" must not begin with "__" (two underscores), which is reserved by GraphQL for introspection.',
      });
    });

    it("reports error for enum name starting with __", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          enum __Status { Active }
          model Book { status: __Status; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/reserved-name",
        severity: "error",
        message:
          'Name "__Status" must not begin with "__" (two underscores), which is reserved by GraphQL for introspection.',
      });
    });

    it("reports error for enum member starting with __", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          enum Status { __Internal, Active }
          model Book { status: Status; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/reserved-name",
        severity: "error",
        message:
          'Name "__Internal" must not begin with "__" (two underscores), which is reserved by GraphQL for introspection.',
      });
    });

    it("reports error for union name starting with __", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model Cat { meow: string; }
          model Dog { bark: string; }
          union __Pet { cat: Cat, dog: Dog }
          @query op getPet(): __Pet;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/reserved-name",
        severity: "error",
        message:
          'Name "__Pet" must not begin with "__" (two underscores), which is reserved by GraphQL for introspection.',
      });
    });

    it("does not report error for names with single underscore prefix", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model _Book { _title: string; }
          @query op _getBooks(_filter: string): _Book[];
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report error for names with underscore in middle", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model My__Book { my__title: string; }
          @query op get__Books(): My__Book[];
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("empty-union", () => {
    it("reports error for union with no variants", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          union Empty {}
          @query op get(): Empty;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/empty-union",
        severity: "error",
        message:
          "Union has no non-null variants. A GraphQL union must contain at least one member type.",
      });
    });

    it("reports error for union with only null variant", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          union MaybeNothing { nothing: null }
          @query op get(): MaybeNothing;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/empty-union",
        severity: "error",
        message:
          "Union has no non-null variants. A GraphQL union must contain at least one member type.",
      });
    });

    it("does not report error for union with non-null variants", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model Cat { meow: string; }
          model Dog { bark: string; }
          union Pet { cat: Cat, dog: Dog }
          @query op getPet(): Pet;
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report error for union with null and non-null variants", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model Cat { meow: string; }
          union MaybeCat { cat: Cat, none: null }
          @query op getCat(): MaybeCat;
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not validate anonymous unions", async () => {
      // Anonymous unions like `string | null` are handled differently
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        namespace TestNamespace {
          model Book { title: string | null; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });
  });
});
