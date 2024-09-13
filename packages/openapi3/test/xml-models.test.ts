import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { createOpenAPITestRunner, oapiForModel } from "./test-host.js";

describe("@name", () => {
  it("set xml.name for schema", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @name("xmlBook")
        model Book {        
          content: string;
        };`
    );

    expect(res.schemas.Book).toMatchObject({
      xml: {
        name: "xmlBook",
      },
    });
  });

  it("set the element value for array property via @name", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @name("xmlBook")
        model Book {        
          tags: string[];
        };`
    );

    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          xml: {
            wrapped: true,
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "xmlBook",
      },
    });
  });

  it.each([
    ["string", "string", "string"],
    ["array", "string[]", "array"],
    ["number", "numeric", "number"],
    ["enum", `"a" | "b"`, "string"],
  ])(`%s => %s`, async (_, type, output) => {
    const res = await oapiForModel(
      "Book",
      `model Book {
          @name("xmlcontent")
          content: ${type};
        };`
    );
    expect(res.schemas.Book).toMatchObject({
      properties: {
        content: { type: `${output}`, xml: { name: "xmlcontent" } },
      },
      required: ["content"],
    });
  });

  it.each([
    ["object", "unknown"],
    ["Union", `string | numeric`],
  ])(`%s => %s`, async (_, type) => {
    const res = await oapiForModel(
      "Book",
      `model Book {
          @name("xmlcontent")
          content: ${type};
        };`
    );
    expect(res.schemas.Book).toMatchObject({
      properties: {
        content: { xml: { name: "xmlcontent" } },
      },
      required: ["content"],
    });
  });

  it("set the value on scalar via @name", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @name("xmlBook")
        scalar Book extends string;`
    );

    expect(res.schemas.Book).toMatchObject({
      type: "string",
    });
  });

  it("compare with the json name", async () => {
    const res = await oapiForModel(
      "Book",
      `        
        model Book {
          @name("xmlContent")
          @encodedName("application/json", "jsonContent")    
          content: string;
        };`
    );

    expect(res.schemas.Book).toMatchObject({
      properties: {
        jsonContent: { type: "string", xml: { name: "xmlContent" } },
      },
      required: ["jsonContent"],
    });
  });

  it("set the json name and no xml name", async () => {
    const res = await oapiForModel(
      "Book",
      `
        model Book {
          @encodedName("application/json", "jsonContent")    
          content: string;
        };`
    );

    expect(res.schemas.Book).toMatchObject({
      properties: {
        jsonContent: { type: "string" },
      },
      required: ["jsonContent"],
    });
  });
});

describe("@attribute", () => {
  it.each([
    ["numeric", "numeric"],
    ["string", "string"],
    ["unknown", "unknown"],
    ["Union", `string | numeric`],
    ["enum", `"a" | "b"`],
  ])(`%s => %s`, async (_, type) => {
    const res = await oapiForModel(
      "Book",
      `model Book {
          @attribute
          id: ${type};
        };`
    );
    expect(res.schemas.Book).toMatchObject({
      properties: {
        id: { xml: { attribute: true } },
      },
    });
  });

  it("warning if attribute is object", async () => {
    const runner = await createOpenAPITestRunner();
    const diagnostics = await runner.diagnose(
      `model Tag {
        name: string;
      }
      model Pet {
        @attribute
        tags: Tag;
      }`
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/invalid-property-type",
      message: `propertie "tags" is not supported in the openapi3 emitter, it will be ignored.`,
    });
  });
});

describe("@unwrapped", () => {
  it("warning if unwrapped not array", async () => {
    const runner = await createOpenAPITestRunner();
    const diagnostics = await runner.diagnose(
      `model Book {
          @unwrapped
          id: string;
       };`
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/invalid-property-type",
      message: `propertie "id" is not supported in the openapi3 emitter, it will be ignored.`,
    });
  });
});

describe("@ns", () => {
  it("provide the namespace and prefix", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @ns("https://example.com/ns1", "ns1")
        model Book {
          id: string;
        };`
    );
    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        id: {
          type: "string",
        },
      },
      required: ["id"],
      xml: {
        namespace: "https://example.com/ns1",
        prefix: "ns1",
      },
    });
  });

  it("provide the namespace and prefix using string", async () => {
    const res = await oapiForModel(
      "Book",
      `model Book {
          @ns("https://example.com/ns1", "ns1")
          id: string;
        };`
    );
    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        id: {
          type: "string",
          xml: {
            namespace: "https://example.com/ns1",
            prefix: "ns1",
          },
        },
      },
      required: ["id"],
    });
  });

  it("provide the namespace and prefix using enum on model", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @nsDeclarations
        enum Namespaces {
          smp:"http://example.com/schema",
        }

        @ns(Namespaces.smp)
        model Book {
          id: string;
        };`
    );
    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        id: {
          type: "string",
        },
      },
      required: ["id"],
      xml: {
        namespace: "http://example.com/schema",
        prefix: "smp",
      },
    });
  });

  it("provide the namespace and prefix using enum on model and properties", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @nsDeclarations
        enum Namespaces {
          smp:"http://example.com/schema",
          ns2:"http://example.com/ns2",
        }

        @ns(Namespaces.smp)
        model Book {          
          id: string;
          @ns(Namespaces.smp)
          title: string;
          @ns(Namespaces.ns2)
          author: string;
        };`
    );
    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        title: {
          type: "string",
          xml: {
            namespace: "http://example.com/schema",
            prefix: "smp",
          },
        },
        author: {
          type: "string",
          xml: {
            namespace: "http://example.com/ns2",
            prefix: "ns2",
          },
        },
      },
      required: ["id", "title", "author"],
      xml: {
        namespace: "http://example.com/schema",
        prefix: "smp",
      },
    });
  });
});
describe("Array of primitive types", () => {
  it("unwrapped tags array in the xmlBook model.", async () => {
    const res = await oapiForModel(
      "Book",
      `
      @name("xmlBook")
      model Book {
        @unwrapped 
        tags: string[];
      };`
    );

    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "xmlBook",
      },
    });
  });

  it("wrapped tags array in the xmlBook model.", async () => {
    const res = await oapiForModel(
      "Book",
      `
      @name("xmlBook")
      model Book {
        @name("ItemsTags")
        tags: string[];
      };`
    );

    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          xml: {
            name: "ItemsTags",
            wrapped: true,
          },
          items: {
            type: "string",
            xml: {
              name: "string",
            },
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "xmlBook",
      },
    });
  });

  it("unwrapped tags array in xmlBook Model, using the tag scalar renamed as ItemsName.", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @name("ItemsName")
        scalar tag extends string;

        @name("xmlBook")
        model Book {
          @unwrapped
          tags: tag[]
        }`
    );

    expect(res.schemas.tag).toMatchObject({
      type: "string",
      xml: {
        name: "ItemsName",
      },
    });

    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            $ref: "#/components/schemas/tag",
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "xmlBook",
      },
    });
  });

  it("wrapped tags array in xmlBook Model, using the tag scalar renamed as ItemsName.", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @name("ItemsName")
        scalar tag extends string;

        @name("xmlBook")
        model Book {
          @name("ItemsTags")
          tags: tag[]
        }`
    );

    expect(res.schemas.tag).toMatchObject({
      type: "string",
      xml: {
        name: "ItemsName",
      },
    });

    expect(res.schemas.Book).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          xml: {
            name: "ItemsTags",
            wrapped: true,
          },
          items: {
            type: "string",
            xml: {
              name: "ItemsName",
            },
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "xmlBook",
      },
    });
  });
});

describe("Complex array types", () => {
  it("unwrapped the tags object array in the XmlPet model.", async () => {
    const res = await oapiForModel(
      "Pet",
      `
        @name("XmlPet")
        model Pet {
          @unwrapped
          tags: Tag[];
        }

        @name("XmlTag")
        model Tag {
          name: string;
        }`
    );

    expect(res.schemas.Tag).toMatchObject({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      xml: {
        name: "XmlTag",
      },
    });
    expect(res.schemas.Pet).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Tag",
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "XmlPet",
      },
    });
  });

  it("wrapped the tags object array in the XmlPet model.", async () => {
    const res = await oapiForModel(
      "Pet",
      `
        @name("XmlPet")
        model Pet {
          @name("ItemsTags")    
          tags: Tag[];
        }

        @name("XmlTag")
        model Tag {
          name: string;
        }`
    );

    expect(res.schemas.Tag).toMatchObject({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      xml: {
        name: "XmlTag",
      },
    });

    expect(res.schemas.Pet).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          xml: {
            name: "ItemsTags",
            wrapped: true,
          },
          items: {
            allOf: [
              {
                $ref: "#/components/schemas/Tag",
              },
            ],
            xml: {
              name: "XmlTag",
            },
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "XmlPet",
      },
    });
  });

  it("unwrapped and renamed Tags object array in xmlPet Model.", async () => {
    const res = await oapiForModel(
      "Pet",
      `
        @name("XmlPet")
        model Pet {
          @name("ItemsTags")
          @unwrapped
          tags: Tag[];
        }

        @name("XmlTag")
        model Tag {
          name: string;
        }`
    );
    expect(res.schemas.Tag).toMatchObject({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      xml: {
        name: "XmlTag",
      },
    });
    expect(res.schemas.Pet).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Tag",
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "XmlPet",
      },
    });
  });

  it("rename all names in array model.", async () => {
    const res = await oapiForModel(
      "Pet",
      `
        @name("XmlPet")
        model Pet {
          @name("ItemsTags")
          tags: Tag[];
        }

        @name("XmlTag")
        model Tag {
          name: string;
        }`
    );

    expect(res.schemas.Tag).toMatchObject({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      xml: {
        name: "XmlTag",
      },
    });
    expect(res.schemas.Pet).toMatchObject({
      type: "object",
      properties: {
        tags: {
          type: "array",
          xml: {
            name: "ItemsTags",
            wrapped: true,
          },
          items: {
            allOf: [{ $ref: "#/components/schemas/Tag" }],
            xml: {
              name: "XmlTag",
            },
          },
        },
      },
      required: ["tags"],
      xml: {
        name: "XmlPet",
      },
    });
  });
});
