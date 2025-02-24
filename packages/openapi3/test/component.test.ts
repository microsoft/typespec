import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { OpenAPI3Document } from "../src/types.js";
import { worksFor } from "./works-for.js";

interface DiagnosticCheck {
  invalidKey: string;
  declarationKey: string;
  prefix: "#/components/schemas/" | "#/components/parameters/";
}

interface Case {
  title: string;
  code: string;
  diagChecks: DiagnosticCheck[];
  refChecks?: (doc: any) => void;
}

const prefixToKindMap = {
  ["#/components/schemas/"]: "Model",
  ["#/components/parameters/"]: "ModelProperty",
};

const testCases: Case[] = [
  {
    title: "Basic model case",
    code: `
    @service
    namespace Ns1Valid {
      model \`foo-/inva*li\td\` {}
      op f(p: \`foo-/inva*li\td\`): void;
    }`,

    diagChecks: [
      {
        invalidKey: "foo-/inva*li\td",
        declarationKey: "foo-_inva_li_d",
        prefix: "#/components/schemas/",
      },
    ],
    refChecks: (doc) => {
      expect(
        doc.paths["/"].post.requestBody.content["application/json"].schema.properties.p.$ref,
      ).toBe("#/components/schemas/foo-_inva_li_d");
    },
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
      op f(...Zoo): string;
    }`,
    diagChecks: [
      {
        invalidKey: "Zoo.para/invalid",
        declarationKey: "Zoo.para_invalid",
        prefix: "#/components/parameters/",
      },
    ],
    refChecks: (doc) => {
      expect(doc.paths["/"].post.parameters[0].$ref).toBe(
        "#/components/parameters/Zoo.para_invalid",
      );
    },
  },
  {
    title: "Nested model case",
    code: `
    @service
    namespace Ns1Valid {
      model \`Nested/Model\` {
          a: string;
      }
      model MMM {
        b: \`Nested/Model\`;
      }
      op f(p: MMM): void;
    }`,
    diagChecks: [
      {
        invalidKey: "Nested/Model",
        declarationKey: "Nested_Model",
        prefix: "#/components/schemas/",
      },
    ],
  },
  {
    title: "Nested parameter case",
    code: `
    @service
    namespace NS {
      model \`Nested/Model\` {
        a: string;
      }
      model MMM {
        @query \`b/b\`: \`Nested/Model\`;
        d: string;
      }
      op f(...MMM): void;
    }`,
    diagChecks: [
      {
        invalidKey: "Nested/Model",
        declarationKey: "Nested_Model",
        prefix: "#/components/schemas/",
      },
      {
        invalidKey: "MMM.b/b",
        declarationKey: "MMM.b_b",
        prefix: "#/components/parameters/",
      },
    ],
    refChecks: (doc) => {
      expect(doc.components.parameters["MMM.b_b"].schema.$ref).toBe(
        "#/components/schemas/Nested_Model",
      );
      expect(doc.paths["/"].post.parameters[0].$ref).toBe("#/components/parameters/MMM.b_b");
    },
  },
];

worksFor(["3.0.0", "3.1.0"], async (specHelpers) => {
  describe("Invalid component key", () => {
    it.each(testCases)(
      "$title should report diagnostics and replace by valid key",
      async (c: Case) => {
        const [doc, diag] = await specHelpers.emitOpenApiWithDiagnostics(c.code);

        // check diagnostics
        expectDiagnostics(
          diag,
          c.diagChecks.map((d) => createExpectedDiagnostic(d.invalidKey)),
        );
        for (const [i, d] of c.diagChecks.entries()) {
          const target = diag[i].target as any;
          expect(target).toHaveProperty("kind");
          expect(target.kind).toBe(prefixToKindMap[d.prefix]);
          // check generated doc
          const componentField = getComponentField(doc, d.prefix);
          expect(componentField).toBeDefined();
          expect(componentField).toHaveProperty(d.declarationKey);
        }
        // check ref
        if (c.refChecks) c.refChecks(doc);
      },
    );
  });
});

function getComponentField(
  doc: OpenAPI3Document,
  kind: "#/components/schemas/" | "#/components/parameters/",
) {
  switch (kind) {
    case "#/components/schemas/":
      return doc.components?.schemas;
    case "#/components/parameters/":
      return doc.components?.parameters;
  }
}

function createExpectedDiagnostic(key: string) {
  return {
    code: "@typespec/openapi3/invalid-component-fixed-field-key",
    message: `Invalid key '${key}' used in a fixed field of the Component object. Only alphanumerics, dot (.), hyphen (-), and underscore (_) characters are allowed in keys.`,
  };
}
