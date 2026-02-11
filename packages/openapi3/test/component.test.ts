import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { OpenAPI3Document } from "../src/types.js";
import { supportedVersions, worksFor } from "./works-for.js";

interface DiagnosticCheck {
  expectedDiagInvalidKey: string;
  expectedDeclKey: string;
  expectedPrefix: "#/components/schemas/" | "#/components/parameters/";
  kind: "Model" | "ModelProperty" | "Union";
}

interface Case {
  title: string;
  code: string;
  diagChecks: DiagnosticCheck[];
  refChecks?: (doc: any) => void;
}

const testCases: Case[] = [
  {
    title: "Basic model case",
    code: `
    @service
    namespace Ns1Valid {
      model \`foo-/invalid*\td\` {}
      op f(p: \`foo-/invalid*\td\`): void;
    }`,

    diagChecks: [
      {
        expectedDiagInvalidKey: "foo-/invalid*\td",
        expectedDeclKey: "foo-_invalid__d",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
    ],
    refChecks: (doc) => {
      expect(
        doc.paths["/"].post.requestBody.content["application/json"].schema.properties.p.$ref,
      ).toBe("#/components/schemas/foo-_invalid__d");
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
        expectedDiagInvalidKey: "Zoo.para/invalid",
        expectedDeclKey: "Zoo.para_invalid",
        expectedPrefix: "#/components/parameters/",
        kind: "ModelProperty",
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
        expectedDiagInvalidKey: "Nested/Model",
        expectedDeclKey: "Nested_Model",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
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
        expectedDiagInvalidKey: "Nested/Model",
        expectedDeclKey: "Nested_Model",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
      {
        expectedDiagInvalidKey: "MMM.b/b",
        expectedDeclKey: "MMM.b_b",
        expectedPrefix: "#/components/parameters/",
        kind: "ModelProperty",
      },
    ],
    refChecks: (doc) => {
      expect(doc.components.parameters["MMM.b_b"].schema.$ref).toBe(
        "#/components/schemas/Nested_Model",
      );
      expect(doc.paths["/"].post.parameters[0].$ref).toBe("#/components/parameters/MMM.b_b");
    },
  },
  {
    title: "Basic discriminated case",
    code: `
    @service
    namespace NS {
      @discriminated()
      union \`Pe/t\` {
        cat: \`C/at\`,
        dog: \`Do/g\`,
      }

      model \`C/at\` {
        kind: "cat";
        meow: boolean;
      }
      model \`Do/g\` {
        kind: "dog";
        bark: boolean;
      }

      op f(p: \`Pe/t\`): void;
    }`,
    diagChecks: [
      {
        expectedDiagInvalidKey: "C/at",
        expectedDeclKey: "C_at",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
      {
        expectedDiagInvalidKey: "Pe/tCat",
        expectedDeclKey: "Pe_tCat",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
      {
        expectedDiagInvalidKey: "Do/g",
        expectedDeclKey: "Do_g",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
      {
        expectedDiagInvalidKey: "Pe/tDog",
        expectedDeclKey: "Pe_tDog",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
      {
        expectedDiagInvalidKey: "Pe/t",
        expectedDeclKey: "Pe_t",
        expectedPrefix: "#/components/schemas/",
        kind: "Union",
      },
    ],
  },
  {
    title: "Basic extend case",
    code: `
    @service
    namespace NS {
      @discriminator("kind")
      model \`Pe/t\`{ kind: string }
      model \`C*at\` extends \`Pe/t\` {kind: "cat", meow: boolean}
      model \`D*og\` extends \`Pe/t\`  {kind: "dog", bark: boolean}
      op f(p: \`Pe/t\`): void;
    }`,
    diagChecks: [
      {
        expectedDiagInvalidKey: "C*at",
        expectedDeclKey: "C_at",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
      {
        expectedDiagInvalidKey: "D*og",
        expectedDeclKey: "D_og",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
      {
        expectedDiagInvalidKey: "Pe/t",
        expectedDeclKey: "Pe_t",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
    ],
  },
  {
    title: "Basic generic case",
    code: `
    @service
    namespace NS {
      model Foo<T> {x: T;}
      model \`x/x/x\` {a: string}
      op read(x: \`x/x/x\`): Foo<int32>;
    }`,
    diagChecks: [
      {
        expectedDiagInvalidKey: "x/x/x",
        expectedDeclKey: "x_x_x",
        expectedPrefix: "#/components/schemas/",
        kind: "Model",
      },
    ],
    refChecks: (doc) => {
      expect(
        doc.paths["/"].post.requestBody.content["application/json"].schema.properties.x.$ref,
      ).toBe("#/components/schemas/x_x_x");
    },
  },
];

worksFor(supportedVersions, async (specHelpers) => {
  describe("Invalid component key", () => {
    it.each(testCases)(
      "$title should report diagnostics and replace by valid key",
      async (c: Case) => {
        const [doc, diag] = await specHelpers.emitOpenApiWithDiagnostics(c.code);

        // check diagnostics
        expectDiagnostics(
          diag,
          c.diagChecks.map((d) => createExpectedDiagnostic(d.expectedDiagInvalidKey)),
        );
        for (const [i, d] of c.diagChecks.entries()) {
          const target = diag[i].target as any;
          expect(target).toHaveProperty("kind");
          expect(target.kind).toBe(d.kind);
          // check generated doc
          const componentField = getComponentField(doc, d.expectedPrefix);
          expect(componentField).toBeDefined();
          expect(componentField).toHaveProperty(d.expectedDeclKey);
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
