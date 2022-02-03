import { deepStrictEqual, strictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: versioning", () => {
  it("works with models", async () => {
    const {
      1: v1,
      2: v2,
      3: v3,
    } = await openApiFor(
      `
      @versioned("1" | "2" | "3")
      @versionedDependency(MyLibrary, { "1": "A"; "2": "B"; "3": "C"; })
      @serviceTitle("My Service")
      @serviceVersion("hi")
      namespace MyService {
        model Test {
          prop1: string;
          @added("2") prop2: string;
          @removed("2") prop3: string;
          @renamedFrom("3", "prop4") prop4new: string;
          @madeOptional("3") prop5?: string;
        }

        @route("/read1")
        op read1(): OkResponse<Test>;
        op read2(): OkResponse<MyLibrary.Foo>;
      }

      @versioned("A" | "B" | "C")
      namespace MyLibrary {
        model Foo {
          prop1: string;
          @added("B") prop2: string;
          @added("C") prop3: string;
        }
      }
    `,
      ["1", "2", "3"]
    );
    strictEqual(v1.info.version, "1");
    deepStrictEqual(v1.components.schemas.Test, {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop3: { type: "string" },
        prop5: { type: "string" },
        prop4: { type: "string" },
      },
      required: ["prop1", "prop3", "prop5", "prop4"],
    });

    deepStrictEqual(v1.components.schemas["MyLibrary.Foo"], {
      type: "object",
      properties: {
        prop1: { type: "string" },
      },
      required: ["prop1"],
    });

    strictEqual(v2.info.version, "2");
    deepStrictEqual(v2.components.schemas.Test, {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
        prop5: { type: "string" },
        prop4: { type: "string" },
      },
      required: ["prop1", "prop2", "prop5", "prop4"],
    });
    deepStrictEqual(v2.components.schemas["MyLibrary.Foo"], {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
      },
      required: ["prop1", "prop2"],
    });

    strictEqual(v3.info.version, "3");
    deepStrictEqual(v3.components.schemas.Test, {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
        prop5: { type: "string" },
        prop4new: { type: "string" },
      },
      required: ["prop1", "prop2", "prop4new"],
    });
    deepStrictEqual(v3.components.schemas["MyLibrary.Foo"], {
      type: "object",
      properties: {
        prop1: { type: "string" },
        prop2: { type: "string" },
        prop3: { type: "string" },
      },
      required: ["prop1", "prop2", "prop3"],
    });
  });
});
