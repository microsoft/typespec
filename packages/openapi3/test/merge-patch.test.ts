import { deepStrictEqual, ok } from "assert";
import { expect, it } from "vitest";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { openApiFor } from "./test-host.js";

export async function oapiForPatchRequest(
  body: string,
  modelDef: string,
  contentType: string,
  options: OpenAPI3EmitterOptions = {},
) {
  const oapi = await openApiFor(
    `
    @service(#{title: "Testing model"})
    @route("/")
    namespace root {
      ${modelDef};
      @patch op update(${body}): void;
    }
  `,
    options,
  );

  const content = oapi.paths["/"].patch.requestBody.content[contentType];
  const useSchema = content.schema;

  return {
    isRef: !!useSchema.$ref,
    schemas: oapi.components.schemas || {},
    requestContent: content,
  };
}

it("emits correct schema for MergePatchUpdateReplaceOnly", async () => {
  const req = await oapiForPatchRequest(
    "@body body: Foo",
    `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Baz {
        subject: Bar[];
      }

      model Foo is MergePatchUpdate<Baz>`,
    "application/merge-patch+json",
  );

  ok(req.isRef);
  deepStrictEqual(req.schemas.Foo.properties.subject, {
    type: "array",
    items: { $ref: "#/components/schemas/BarMergePatchUpdateReplaceOnly" },
  });
  ok(req.schemas.BarMergePatchUpdateReplaceOnly, "Expected a replaceOnly schema for Bar");
  const innerEnvelope = req.schemas.BarMergePatchUpdateReplaceOnly;
  ok(innerEnvelope);
  ok(innerEnvelope.properties);
  ok(innerEnvelope.required);
  deepStrictEqual(innerEnvelope.required, ["id"]);
  deepStrictEqual(innerEnvelope.properties, {
    id: { type: "string" },
    description: { type: "string" },
    createOnly: { type: "string" },
  });
});
it("emits correct schema for spread using MergePatchUpdateReplaceOnly", async () => {
  const req = await oapiForPatchRequest(
    "...MergePatchUpdate<Baz>",
    `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Baz {
        subject: Bar[];
      }
`,
    "application/merge-patch+json",
  );

  ok(req.isRef);
  deepStrictEqual(req.schemas.BazMergePatchUpdate.properties.subject, {
    type: "array",
    items: { $ref: "#/components/schemas/BarMergePatchUpdateReplaceOnly" },
  });
  ok(req.schemas.BarMergePatchUpdateReplaceOnly, "Expected a replaceOnly schema for Bar");
  const innerEnvelope = req.schemas.BarMergePatchUpdateReplaceOnly;
  ok(innerEnvelope);
  ok(innerEnvelope.properties);
  ok(innerEnvelope.required);
  deepStrictEqual(innerEnvelope.required, ["id"]);
  deepStrictEqual(innerEnvelope.properties, {
    id: { type: "string" },
    description: { type: "string" },
    createOnly: { type: "string" },
  });
});
it("emits correct schema for MergePatchUpdate", async () => {
  const req = await oapiForPatchRequest(
    "@body body: Foo",
    `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Baz {
        subject: Bar;
      }

      model Foo is MergePatchUpdate<Baz>`,
    "application/merge-patch+json",
  );

  ok(req.isRef);
  deepStrictEqual(req.schemas.Foo.properties.subject, {
    $ref: "#/components/schemas/BarMergePatchUpdate",
  });
  ok(req.schemas.BarMergePatchUpdate, "Expected a replaceOnly schema for Bar");
  const innerEnvelope = req.schemas.BarMergePatchUpdate;
  ok(innerEnvelope);
  ok(innerEnvelope.properties);
  expect(innerEnvelope.required).toBeUndefined();
  deepStrictEqual(innerEnvelope.properties, {
    id: { type: "string" },
    description: { type: "string", nullable: true },
    updateOnly: { type: "string", nullable: true },
  });
});

it("emits correct schema for MergePatchUpdateOrCreate", async () => {
  const req = await oapiForPatchRequest(
    "@body body: Foo",
    `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Baz {
        subject?: Bar;
      }

      model Foo is MergePatchUpdate<Baz>`,
    "application/merge-patch+json",
  );

  ok(req.isRef);
  deepStrictEqual(req.schemas.Foo.properties.subject, {
    allOf: [{ $ref: "#/components/schemas/BarMergePatchUpdateOrCreate" }],
    nullable: true,
    type: "object",
  });
  ok(req.schemas.BarMergePatchUpdateOrCreate, "Expected a replaceOnly schema for Bar");
  const innerEnvelope = req.schemas.BarMergePatchUpdateOrCreate;
  ok(innerEnvelope);
  ok(innerEnvelope.properties);
  expect(innerEnvelope.required).toBeUndefined();
  deepStrictEqual(innerEnvelope.properties, {
    id: { type: "string" },
    description: { type: "string", nullable: true },
    createOnly: { type: "string", nullable: true },
    updateOnly: { type: "string", nullable: true },
  });
});
it("emits correct schema for MergePatchCreateOrUpdateReplaceOnly", async () => {
  const req = await oapiForPatchRequest(
    "@body body: Foo",
    `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Baz {
        subject: Bar[];
      }

      model Foo is MergePatchCreateOrUpdate<Baz>`,
    "application/merge-patch+json",
  );

  ok(req.isRef);
  deepStrictEqual(req.schemas.Foo.properties.subject, {
    type: "array",
    items: { $ref: "#/components/schemas/BarMergePatchCreateOrUpdateReplaceOnly" },
  });
  ok(req.schemas.BarMergePatchCreateOrUpdateReplaceOnly, "Expected a replaceOnly schema for Bar");
  const innerEnvelope = req.schemas.BarMergePatchCreateOrUpdateReplaceOnly;
  ok(innerEnvelope);
  ok(innerEnvelope.properties);
  ok(innerEnvelope.required);
  deepStrictEqual(innerEnvelope.required, ["id"]);
  deepStrictEqual(innerEnvelope.properties, {
    id: { type: "string" },
    description: { type: "string" },
    createOnly: { type: "string" },
  });
});
it("emits correct schema for MergePatchCreateOrUpdate", async () => {
  const req = await oapiForPatchRequest(
    "@body body: Foo",
    `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Baz {
        subject: Bar;
      }

      model Foo is MergePatchCreateOrUpdate<Baz>`,
    "application/merge-patch+json",
  );

  ok(req.isRef);
  deepStrictEqual(req.schemas.Foo.properties.subject, {
    $ref: "#/components/schemas/BarMergePatchCreateOrUpdate",
  });
  ok(req.schemas.BarMergePatchCreateOrUpdate, "Expected a replaceOnly schema for Bar");
  const innerEnvelope = req.schemas.BarMergePatchCreateOrUpdate;
  ok(innerEnvelope);
  ok(innerEnvelope.properties);
  expect(innerEnvelope.required).toBeUndefined();
  deepStrictEqual(innerEnvelope.properties, {
    id: { type: "string" },
    description: { type: "string", nullable: true },
    updateOnly: { type: "string", nullable: true },
    createOnly: { type: "string", nullable: true },
  });
});
