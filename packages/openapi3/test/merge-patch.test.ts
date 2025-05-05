import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import { oapiForModelRequest } from "./test-host.js";

describe("merge-patch: MergePatch schema tests", () => {
  it("emits correct schema for MergePatchUpdate", async () => {
    const req = await oapiForModelRequest(
      "Foo",
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
    ok(req.schemas.Foo, "expected definition named Foo");
    ok(req.schemas.Foo.properties, "expected Foo to be an object");
    ok(req.schemas.Foo.properties, "expected Foo.subject to be a property");
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
});
