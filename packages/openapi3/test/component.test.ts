import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { OpenAPI3Document } from "../src/types.js";
import { worksFor } from "./works-for.js";

interface Case {
  title: string;
  code: string;
  invalidKey: string;
  validKey: string;
  typeName: string;
  kind: Kind;
}

enum Kind {
  Model,
  Parameter,
}

const kindMap = {
  [Kind.Model]: "Model",
  [Kind.Parameter]: "ModelProperty",
};

worksFor(["3.0.0", "3.1.0"], async (specHelpers) => {
  describe("Invalid component key", () => {
    it.each([
      {
        title: "Basic model case",
        code: `
        @service
        namespace Ns1Valid {
          model \`foo-/inva*li\td\` {}
        }`,
        invalidKey: "foo-/inva*li\td",
        validKey: "foo-_inva_li_d",
        typeName: "foo-/inva*li\td",
        kind: Kind.Model,
      },
      {
        title: "Nested model case",
        code: `
        @service
        namespace NsOut {
          namespace NsNested {
            model \`foo/invalid\` {}
          }
        }`,
        invalidKey: "NsNested.foo/invalid",
        validKey: "NsNested.foo_invalid",
        typeName: "foo/invalid",
        kind: Kind.Model,
      },
      {
        title: "Basic parameter case",
        code: `
        @service
        namespace Ns {
          model Zoo {
            @query
            \`para/invalid\`: string;
            b: string;
          }
          op get(...Zoo): string;
        }`,
        invalidKey: "Zoo.para/invalid",
        validKey: "Zoo.para_invalid",
        typeName: "para/invalid",
        kind: Kind.Parameter,
      },
      {
        title: "Nested parameter case",
        code: `
        @service
        namespace Ns {
          namespace NsNest {
            model Zoo {
              @query
              \`para/invalid\`: string;
              b: string;
            }
            op get(...Zoo): string;
          }
        }`,
        invalidKey: "NsNest.Zoo.para/invalid",
        validKey: "NsNest.Zoo.para_invalid",
        typeName: "para/invalid",
        kind: Kind.Parameter,
      },
    ])("$title should report diagnostics and replace by valid key", async (c: Case) => {
      const [doc, diag] = await specHelpers.emitOpenApiWithDiagnostics(c.code);

      // check diagnostics
      expectDiagnostics(diag, [createExpectedDiagnostic(c.invalidKey)]);
      const target = diag[0].target as any;
      expect(target).toHaveProperty("kind");
      expect(target.kind).toBe(kindMap[c.kind]);
      expect(target.name).toBe(c.typeName);

      // check generated doc
      const componentField = getComponentField(doc, c.kind);
      expect(componentField).toBeDefined();
      expect(componentField).not.toHaveProperty(c.invalidKey);
      expect(componentField).toHaveProperty(c.validKey);

      // check ref: TODO
      switch (c.kind) {
        case Kind.Model: {
          break;
        }
        case Kind.Parameter: {
          break;
        }
      }
    });
  });
});

function getComponentField(doc: OpenAPI3Document, kind: Kind) {
  switch (kind) {
    case Kind.Model:
      return doc.components?.schemas;
    case Kind.Parameter:
      return doc.components?.parameters;
  }
}

function createExpectedDiagnostic(key: string) {
  return {
    code: "@typespec/openapi3/invalid-component-fixed-field-key",
    message: `Invalid key '${key}' used in a fixed field of the Component object. Only alphanumerics, dot (.), hyphen (-), and underscore (_) characters are allowed in keys.`,
  };
}
