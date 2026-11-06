import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import type { OpenAPI3EmitterOptions } from "../src/lib.js";
import type { OpenAPI3Document } from "../src/types.js";
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
  describe("Component naming", () => {
    const code = `
      @service namespace Demo {
        namespace Models {
          model User_Profile { id: string; }
        }
        @get op read(): Models.User_Profile;
      }
    `;

    it("preserves existing output with explicit defaults", async () => {
      const current = await specHelpers.openApiFor(code);
      const explicit = await specHelpers.openApiFor(code, {
        "component-name-strategy": "fqn",
      });
      expect(explicit).toEqual(current);
      expect(current.components.schemas["Models.User_Profile"]).toBeDefined();
    });

    it.each([
      { strategy: "name-only", name: "User_Profile" },
      { strategy: { kind: "fqn", separator: "_" }, name: "Models_User_Profile" },
      { strategy: { kind: "fqn", separator: "" }, name: "ModelsUser_Profile" },
    ] satisfies {
      strategy: OpenAPI3EmitterOptions["component-name-strategy"];
      name: string;
    }[])("uses $strategy for component keys and references", async ({ strategy, name }) => {
      const doc = await specHelpers.openApiFor(code, { "component-name-strategy": strategy });
      expect(Object.keys(doc.components.schemas)).toEqual([name]);
      expect(doc.paths["/"].get.responses["200"].content["application/json"].schema).toEqual({
        $ref: `#/components/schemas/${name}`,
      });
    });

    it("uses namespace separators across schema kinds without changing friendly or payload names", async () => {
      const doc = await specHelpers.openApiFor(
        `
        @service namespace Demo {
          namespace Models {
            scalar User_Id extends string;
            enum User_Kind { normal }
            union User_State { "active", "inactive" }
            model User_List is User_Profile[];
            @friendlyName("Page-{name}", T)
            model Page<T> { value: T; }
            model User_Profile {
              user_id: User_Id;
              kind: User_Kind;
              state: User_State;
              next?: Page<User_Profile>;
            }
          }
          @get op read(): Models.User_List;
        }
      `,
        { "component-name-strategy": { kind: "fqn", separator: "_" } },
      );
      expect(Object.keys(doc.components.schemas)).toEqual([
        "Models_User_Id",
        "Models_User_Kind",
        "Models_User_List",
        "Models_User_Profile",
        "Models_User_State",
        "Page-User_Profile",
      ]);
      expect(doc.components.schemas.Models_User_List.items.$ref).toBe(
        "#/components/schemas/Models_User_Profile",
      );
      expect(doc.components.schemas.Models_User_Profile.properties.user_id.$ref).toBe(
        "#/components/schemas/Models_User_Id",
      );
      expect(doc.components.schemas.Models_User_Profile.properties.next.$ref).toBe(
        "#/components/schemas/Page-User_Profile",
      );
    });

    it("treats literal dots and friendly names as atomic names", async () => {
      const doc = await specHelpers.openApiFor(
        `
        @service namespace Demo {
          namespace Models {
            model \`User.Profile\` {}
            @friendlyName("Friendly.Name") model Other {}
          }
        }
      `,
        { "component-name-strategy": { kind: "fqn", separator: "_" } },
      );
      expect(Object.keys(doc.components.schemas)).toEqual(["Friendly.Name", "Models_User.Profile"]);
    });

    it("omits namespaces while preserving discriminator references", async () => {
      const doc = await specHelpers.openApiFor(
        `
        @service namespace Demo {
          namespace Models {
            @discriminator("pet_kind") model Pet_Base { pet_kind: string; }
            model House_Cat extends Pet_Base { pet_kind: "house_cat"; }
          }
          @get op read(): Models.Pet_Base;
        }
      `,
        {
          "component-name-strategy": "name-only",
        },
      );
      expect(doc.components.schemas.Pet_Base.discriminator).toEqual({
        propertyName: "pet_kind",
        mapping: { house_cat: "#/components/schemas/House_Cat" },
      });
      expect(doc.components.schemas.House_Cat.allOf).toEqual([
        { $ref: "#/components/schemas/Pet_Base" },
      ]);
    });

    it("omits namespaces for generated envelopes and visibility variants", async () => {
      const doc = await specHelpers.openApiFor(
        `
        namespace Models {
          model House_Cat {
            value: string;
            @visibility(Lifecycle.Create) secret: string;
          }
          @discriminated union Pet_Choice { house_cat: House_Cat }
        }
        @put op update(@body data: Models.Pet_Choice): Models.Pet_Choice;
      `,
        { "component-name-strategy": "name-only" },
      );
      for (const suffix of ["", "CreateOrUpdate"]) {
        expect(doc.components.schemas[`Pet_Choice${suffix}`].discriminator.mapping).toEqual({
          house_cat: `#/components/schemas/Pet_ChoiceHouse_cat${suffix}`,
        });
        expect(doc.components.schemas[`Pet_ChoiceHouse_cat${suffix}`].properties.value.$ref).toBe(
          `#/components/schemas/House_Cat${suffix}`,
        );
      }
      expect(doc.paths["/"].put.requestBody.content["application/json"].schema.$ref).toBe(
        "#/components/schemas/Pet_ChoiceCreateOrUpdate",
      );
      expect(doc.paths["/"].put.responses["200"].content["application/json"].schema.$ref).toBe(
        "#/components/schemas/Pet_Choice",
      );
    });

    it("leaves external references and debugging names unchanged", async () => {
      const doc = await specHelpers.openApiFor(
        `
        @useRef("../common.json#/components/schemas/User_Profile") model External_User {}
        namespace Models { model User_Profile { external: External_User; } }
        model Box<T> { value: T; }
        @get op read(): Box<Models.User_Profile>;
      `,
        {
          "component-name-strategy": "name-only",
          "include-x-typespec-name": "inline-only",
        },
      );
      const schema = doc.paths["/"].get.responses["200"].content["application/json"].schema;
      expect(schema["x-typespec-name"]).toBe("Box<Models.User_Profile>");
      expect(schema.properties.value.$ref).toBe("#/components/schemas/User_Profile");
      expect(doc.components.schemas.User_Profile.properties.external.$ref).toBe(
        "../common.json#/components/schemas/User_Profile",
      );
    });

    it("reports collisions after omitting namespaces", async () => {
      const diagnostics = await specHelpers.diagnoseOpenApiFor(
        `
        namespace A { model User {} } namespace B { model User {} }
        op read(): A.User | B.User;
      `,
        { "component-name-strategy": "name-only" },
      );
      expectDiagnostics(diagnostics, [{ code: "@typespec/openapi/duplicate-type-name" }]);
    });
  });

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
