import { deepStrictEqual, ok } from "assert";
import { expect, it } from "vitest";
import type { OpenAPI3EmitterOptions } from "../src/lib.js";
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
it("emits the patched base schema for an extended model", async () => {
  const req = await oapiForPatchRequest(
    "@body body: Foo",
    `
      model Base {
        id: string;
        description?: string;
      }

      model Widget extends Base {
        label?: string;
      }

      model Baz {
        subject?: Widget;
      }

      model Foo is MergePatchUpdate<Widget>;
      model Qux is MergePatchUpdate<Baz>`,
    "application/merge-patch+json",
  );

  ok(req.isRef);
  expect(req.schemas.Foo.required).toBeUndefined();
  deepStrictEqual(req.schemas.Foo.allOf, [{ $ref: "#/components/schemas/BaseMergePatchUpdate" }]);
  const base = req.schemas.BaseMergePatchUpdate;
  ok(base, "Expected a merge patch schema for Base");
  expect(base.required).toBeUndefined();
  expect(base.allOf).toBeUndefined();
  deepStrictEqual(base.properties, {
    id: { type: "string" },
    description: { type: "string", nullable: true },
  });

  const nested = req.schemas.WidgetMergePatchUpdateOrCreate;
  ok(nested, "Expected a merge patch schema for the nested Widget");
  deepStrictEqual(nested.allOf, [{ $ref: "#/components/schemas/BaseMergePatchUpdateOrCreate" }]);
  expect(req.schemas.BaseMergePatchUpdateOrCreate.required).toBeUndefined();
});
it("names the patched base after the friendly name of the base", async () => {
  const oapi = await openApiFor(`
    @service(#{title: "Testing model"})
    @route("/")
    namespace root {
      @friendlyName("BaseDto")
      model Base {
        id: string;
      }

      model Widget extends Base {
        label?: string;
      }

      @patch op update(@body body: MergePatchUpdate<Widget>): Widget;
    }
  `);

  const operation = oapi.paths["/"].patch;
  deepStrictEqual(operation.requestBody.content["application/merge-patch+json"].schema, {
    $ref: "#/components/schemas/WidgetMergePatchUpdate",
  });
  deepStrictEqual(operation.responses["200"].content["application/json"].schema, {
    $ref: "#/components/schemas/Widget",
  });

  const schemas = oapi.components.schemas;
  deepStrictEqual(Object.keys(schemas).sort(), [
    "BaseDto",
    "BaseDtoMergePatchUpdate",
    "Widget",
    "WidgetMergePatchUpdate",
  ]);
  deepStrictEqual(schemas.Widget.allOf, [{ $ref: "#/components/schemas/BaseDto" }]);
  deepStrictEqual(schemas.WidgetMergePatchUpdate.allOf, [
    { $ref: "#/components/schemas/BaseDtoMergePatchUpdate" },
  ]);
  deepStrictEqual(schemas.BaseDto.required, ["id"]);
  expect(schemas.BaseDtoMergePatchUpdate.required).toBeUndefined();
});
it("names patched nested models after their friendly name", async () => {
  const oapi = await openApiFor(`
    @service(#{title: "Testing model"})
    @route("/")
    namespace root {
      @friendlyName("ThingDto")
      model Thing {
        a: string;
      }

      model Holder {
        thing?: Thing;
        things: Thing[];
      }

      @patch op update(@body body: MergePatchUpdate<Holder>): Holder;
    }
  `);

  const schemas = oapi.components.schemas;
  deepStrictEqual(Object.keys(schemas).sort(), [
    "Holder",
    "HolderMergePatchUpdate",
    "ThingDto",
    "ThingDtoMergePatchUpdateOrCreate",
    "ThingDtoMergePatchUpdateReplaceOnly",
  ]);
  deepStrictEqual(schemas.Holder.properties.thing, { $ref: "#/components/schemas/ThingDto" });
  deepStrictEqual(schemas.HolderMergePatchUpdate.properties, {
    thing: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/ThingDtoMergePatchUpdateOrCreate" }],
      nullable: true,
    },
    things: {
      type: "array",
      items: { $ref: "#/components/schemas/ThingDtoMergePatchUpdateReplaceOnly" },
    },
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
