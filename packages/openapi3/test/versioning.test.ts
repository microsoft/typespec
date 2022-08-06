import { deepStrictEqual, strictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: versioning", () => {
  it("works with models", async () => {
    const { v1, v2, v3 } = await openApiFor(
      `
      @versioned(Versions)
      @versionedDependency([[Versions.v1, MyLibrary.Versions.A], [Versions.v2, MyLibrary.Versions.B], [Versions.v3, MyLibrary.Versions.C]])
      @serviceTitle("My Service")
      @serviceVersion("hi")
      namespace MyService {
        enum Versions {"v1", "v2", "v3"}
        model Test {
          prop1: string;
          @added(Versions.v2) prop2: string;
          @removed(Versions.v2) prop3: string;
          @renamedFrom(Versions.v3, "prop4") prop4new: string;
          @madeOptional(Versions.v3) prop5?: string;
        }

        @route("/read1")
        op read1(): Test;
        op read2(): MyLibrary.Foo;
      }

      @versioned(Versions)
      namespace MyLibrary {
        enum Versions {A, B, C}

        model Foo {
          prop1: string;
          @added(Versions.B) prop2: string;
          @added(Versions.C) prop3: string;
        }
      }
    `,
      ["v1", "v2", "v3"]
    );

    strictEqual(v1.info.version, "v1");
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

    strictEqual(v2.info.version, "v2");
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

    strictEqual(v3.info.version, "v3");
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

  it.only("works with something?", async () => {
    const { v1 } = await openApiFor(
      `      
      @versioned(Library.Versions)
      namespace Library {
        enum Versions { v1, v2 };
      }
      
      @serviceTitle("Service")
      @versionedDependency(Library.Versions.v1)
      namespace Service {
        model Widget {
          @key
          @segment("widgets")
          name: string;
          details?: WidgetDetails;
        }
      
        model WidgetDetails {};
      
        @autoRoute
        interface Projects {
          @doc("Gets the details of a widget.")
          get(): Widget;
          
          // Comment out the next line to make the error go away!
          oops(...UpdateableProperties<Widget>): Widget;
        }
      }
    `,
      ["v1", "v2"]
    );
  });
});
