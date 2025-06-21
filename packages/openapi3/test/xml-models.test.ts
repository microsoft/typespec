import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { SimpleTester } from "./test-host.js";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ emitOpenApiWithDiagnostics, oapiForModel }) => {
  describe("@name", () => {
    it("set xml.name for schema", async () => {
      const res = await oapiForModel(
        "Book",
        `
        @name("xmlBook")
        model Book {        
          content: string;
        };`,
      );

      deepStrictEqual(res.schemas.Book, {
        properties: {
          content: {
            type: "string",
          },
        },
        required: ["content"],
        type: "object",
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
        };`,
      );

      deepStrictEqual(res.schemas.Book, {
        properties: {
          tags: {
            items: {
              type: "string",
              xml: {
                name: "string",
              },
            },
            type: "array",
            xml: {
              wrapped: true,
            },
          },
        },
        required: ["tags"],
        type: "object",
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
        };`,
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
        };`,
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
        scalar Book extends string;`,
      );

      deepStrictEqual(res.schemas.Book, {
        type: "string",
        xml: {
          name: "xmlBook",
        },
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
        };`,
      );

      deepStrictEqual(res.schemas.Book, {
        properties: {
          jsonContent: {
            type: "string",
            xml: {
              name: "xmlContent",
            },
          },
        },
        required: ["jsonContent"],
        type: "object",
      });
    });

    it("set the json name and no xml name", async () => {
      const res = await oapiForModel(
        "Book",
        `
        model Book {
          @encodedName("application/json", "jsonContent")    
          content: string;
        };`,
      );

      deepStrictEqual(res.schemas.Book, {
        properties: {
          jsonContent: {
            type: "string",
          },
        },
        required: ["jsonContent"],
        type: "object",
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
        };`,
      );
      expect(res.schemas.Book).toMatchObject({
        properties: {
          id: { xml: { attribute: true } },
        },
      });
    });

    describe("warning and change the type to be type: string if attribute is object/objects", () => {
      it.each([
        ["one", "Tag"],
        ["ones", "Tag[]"],
      ])(`%s => %s`, async (_, type) => {
        const [res, diagnostics] = await emitOpenApiWithDiagnostics(`
        model Tag {
          name: string;
        }
        model Pet {
          @attribute
          tags: ${type};
        }
      `);

        expectDiagnostics(diagnostics, {
          code: "@typespec/openapi3/xml-attribute-invalid-property-type",
          message: `XML \`@attribute\` can only be primitive types in the OpenAPI 3 emitter, Property 'tags' type will be changed to type: string.`,
        });
        deepStrictEqual(
          res.components?.schemas?.Pet,

          {
            properties: {
              tags: {
                type: "string",
                xml: {
                  attribute: true,
                },
              },
            },
            required: ["tags"],
            type: "object",
          },
        );
      });
    });
  });

  describe("@unwrapped", () => {
    it("warning if unwrapped not array", async () => {
      const diagnostics = await SimpleTester.diagnose(
        `model Book {
          @unwrapped
          id: string;
       };`,
      );
      expectDiagnostics(diagnostics, {
        code: "@typespec/openapi3/xml-unwrapped-invalid-property-type",
        message: `XML \`@unwrapped\` can only used on array properties or primitive ones in the OpenAPI 3 emitter, Property 'id' will be ignored.`,
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
        };`,
      );
      deepStrictEqual(res.schemas.Book, {
        properties: {
          id: {
            type: "string",
          },
        },
        required: ["id"],
        type: "object",
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
        };`,
      );
      deepStrictEqual(res.schemas.Book, {
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
        type: "object",
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
        };`,
      );
      deepStrictEqual(res.schemas.Book, {
        properties: {
          id: {
            type: "string",
          },
        },
        required: ["id"],
        type: "object",
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
        };`,
      );
      deepStrictEqual(res.schemas.Book, {
        properties: {
          author: {
            type: "string",
            xml: {
              namespace: "http://example.com/ns2",
              prefix: "ns2",
            },
          },
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
        },
        required: ["id", "title", "author"],
        type: "object",
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
      };`,
      );

      deepStrictEqual(res.schemas.Book, {
        properties: {
          tags: {
            items: {
              type: "string",
              xml: {
                name: "tags",
              },
            },
            type: "array",
          },
        },
        required: ["tags"],
        type: "object",
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
      };`,
      );

      deepStrictEqual(res.schemas.Book, {
        properties: {
          tags: {
            items: {
              type: "string",
              xml: {
                name: "string",
              },
            },
            type: "array",
            xml: {
              name: "ItemsTags",
              wrapped: true,
            },
          },
        },
        required: ["tags"],
        type: "object",
        xml: {
          name: "xmlBook",
        },
      });
    });

    describe("scalar, @xml.unwrapped=true, and rename xml name.", () => {
      it.each([
        ["string", "string"],
        ["numeric", "number"],
        ["integer", "integer"],
        ["float", "number"],
        ["boolean", "boolean"],
      ])(`%s => %s`, async (target, type) => {
        const res = await oapiForModel(
          "Book",
          `@name("ItemsName")
        scalar tag extends ${target};

        @name("xmlBook")
        model Book {
          @unwrapped
          tags: tag[]
        };`,
        );
        expect(res.schemas.tag).toMatchObject({
          type: `${type}`,
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
                allOf: [{ $ref: "#/components/schemas/tag" }],
                xml: { name: "tags" },
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

    describe("scalar, @xml.unwrapped=false, and rename xml name.", () => {
      it.each([
        ["string", "string"],
        ["numeric", "number"],
        ["integer", "integer"],
        ["float", "number"],
        ["boolean", "boolean"],
      ])(`%s => %s`, async (target, type) => {
        const res = await oapiForModel(
          "Book",
          `@name("ItemsName")
        scalar tag extends ${target};

        @name("xmlBook")
        model Book {
          @name("ItemsTags")
          tags: tag[]
        };`,
        );
        expect(res.schemas.tag).toMatchObject({
          type: `${type}`,
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
                allOf: [{ $ref: "#/components/schemas/tag" }],
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
        }`,
      );

      deepStrictEqual(res.schemas.Tag, {
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
        type: "object",
        xml: {
          name: "XmlTag",
        },
      });
      deepStrictEqual(res.schemas.Pet, {
        properties: {
          tags: {
            items: {
              allOf: [
                {
                  $ref: "#/components/schemas/Tag",
                },
              ],
              xml: {
                name: "tags",
              },
            },
            type: "array",
          },
        },
        required: ["tags"],
        type: "object",
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
        }`,
      );

      deepStrictEqual(res.schemas.Tag, {
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
        type: "object",
        xml: {
          name: "XmlTag",
        },
      });

      deepStrictEqual(res.schemas.Pet, {
        properties: {
          tags: {
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
            type: "array",
            xml: {
              name: "ItemsTags",
              wrapped: true,
            },
          },
        },
        required: ["tags"],
        type: "object",
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
        }`,
      );
      deepStrictEqual(res.schemas.Tag, {
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
        type: "object",
        xml: {
          name: "XmlTag",
        },
      });
      deepStrictEqual(res.schemas.Pet, {
        properties: {
          tags: {
            items: {
              allOf: [
                {
                  $ref: "#/components/schemas/Tag",
                },
              ],
              xml: {
                name: "ItemsTags",
              },
            },
            type: "array",
          },
        },
        required: ["tags"],
        type: "object",
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
        }`,
      );

      deepStrictEqual(res.schemas.Tag, {
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
        type: "object",
        xml: {
          name: "XmlTag",
        },
      });
      deepStrictEqual(res.schemas.Pet, {
        properties: {
          tags: {
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
            type: "array",
            xml: {
              name: "ItemsTags",
              wrapped: true,
            },
          },
        },
        required: ["tags"],
        type: "object",
        xml: {
          name: "XmlPet",
        },
      });
    });
  });

  describe("set xml name in items if that object is used in an xml payload.", () => {
    const testCases: [string, string, string, any][] = [
      [
        "@name model, is arrays: true",
        "model Book { author: Author[]; }",
        `@name("xmlAuthor") model Author { id:string; }`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Author" }],
                  xml: { name: "xmlAuthor" },
                },
                xml: {
                  wrapped: true,
                },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
            },
            xml: {
              name: "xmlAuthor",
            },
            required: ["id"],
          },
        },
      ],
      [
        "@name model property, is arrays: true",
        "model Book { author: Author[]; }",
        `model Author { @name("xmlId") id:string; }`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Author" }],
                  xml: { name: "Author" },
                },
                xml: {
                  wrapped: true,
                },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              id: {
                type: "string",
                xml: {
                  name: "xmlId",
                },
              },
            },
            required: ["id"],
          },
        },
      ],
      [
        "@attribute, is arrays: true",
        "model Book { author: Author[]; }",
        `model Author { @attribute id:string; }`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Author" }],
                  xml: { name: "Author" },
                },
                xml: {
                  wrapped: true,
                },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              id: {
                type: "string",
                xml: {
                  attribute: true,
                },
              },
            },
            required: ["id"],
          },
        },
      ],
      [
        "@attribute deeply, is arrays: true",
        "model Book { author: Author[]; }",
        `model Author { card: Card[]; } model Card { @attribute id:string;}`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Author" }],
                  xml: { name: "Author" },
                },
                xml: {
                  wrapped: true,
                },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              card: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Card" }],
                  xml: { name: "Card" },
                },
                xml: {
                  wrapped: true,
                },
              },
            },
            required: ["card"],
          },
          Card: {
            properties: {
              id: {
                type: "string",
                xml: {
                  attribute: true,
                },
              },
            },
            required: ["id"],
            type: "object",
          },
        },
      ],
      [
        "circular reference child, is arrays: true",
        "model Book { author: Author[]; }",
        `model Author { @attribute id: string; card: Card[]; } model Card { author:Author[];}`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Author" }],
                  xml: { name: "Author" },
                },
                xml: {
                  wrapped: true,
                },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              card: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Card" }],
                  xml: { name: "Card" },
                },
                xml: {
                  wrapped: true,
                },
              },
              id: {
                type: "string",
                xml: {
                  attribute: true,
                },
              },
            },
            required: ["id", "card"],
          },
          Card: {
            properties: {
              author: {
                items: {
                  $ref: "#/components/schemas/Author",
                },
                type: "array",
              },
            },
            required: ["author"],
            type: "object",
          },
        },
      ],
      [
        "circular reference root, is arrays: true",
        "model Book { author: Author[]; }",
        `model Author {  @attribute  id: string;  book?: Book[]; }`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Author" }],
                  xml: { name: "Author" },
                },
                xml: {
                  wrapped: true,
                },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              book: {
                type: "array",
                items: {
                  allOf: [{ $ref: "#/components/schemas/Book" }],
                  xml: { name: "Book" },
                },
                xml: {
                  wrapped: true,
                },
              },
              id: {
                type: "string",
                xml: {
                  attribute: true,
                },
              },
            },
            required: ["id"],
          },
        },
      ],
      [
        "@name model, is arrays: false",
        "model Book { author: Author; }",
        `@name("XmlAuthor") model Author { name: string; }`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                allOf: [{ $ref: "#/components/schemas/Author" }],
                xml: { name: "author" },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
            },
            xml: {
              name: "XmlAuthor",
            },
            required: ["name"],
          },
        },
      ],
      [
        "@name model property, is arrays: false",
        "model Book { author: Author; }",
        `model Author { @name("xmlId") name: string; }`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                allOf: [{ $ref: "#/components/schemas/Author" }],
                xml: { name: "author" },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              name: {
                type: "string",
                xml: {
                  name: "xmlId",
                },
              },
            },
            required: ["name"],
          },
        },
      ],
      [
        "@attribute, is arrays: false",
        "model Book { author: Author; }",
        "model Author { @attribute name: string; }",
        {
          Book: {
            type: "object",
            properties: {
              author: {
                allOf: [{ $ref: "#/components/schemas/Author" }],
                xml: { name: "author" },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              name: {
                type: "string",
                xml: {
                  attribute: true,
                },
              },
            },
            required: ["name"],
          },
        },
      ],
      [
        "circular reference root, is arrays: false",
        "model Book { author: Author; }",
        `model Author {  @attribute  id: string;  book?: Book; }`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                allOf: [{ $ref: "#/components/schemas/Author" }],
                xml: { name: "author" },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "object",
            properties: {
              id: {
                type: "string",
                xml: { attribute: true },
              },
              book: {
                allOf: [{ $ref: "#/components/schemas/Book" }],
                xml: { name: "book" },
              },
            },
            required: ["id"],
          },
        },
      ],
      [
        "scalar, is arrays: false",
        "model Book { author: Author; }",
        `@name("XmlAuthor") scalar Author extends string;`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                allOf: [{ $ref: "#/components/schemas/Author" }],
                xml: { name: "author" },
              },
            },
            required: ["author"],
          },
          Author: {
            type: "string",
            xml: { name: "XmlAuthor" },
          },
        },
      ],
      [
        "scalar deeply, is arrays: true",
        "model Book { author: AuthorScalar[]; }",
        `scalar AuthorScalar extends Author; @name("XmlAuthor") scalar Author extends string;`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                items: {
                  allOf: [{ $ref: "#/components/schemas/AuthorScalar" }],
                  xml: { name: "AuthorScalar" },
                },
                type: "array",
                xml: { wrapped: true },
              },
            },
            required: ["author"],
          },
          AuthorScalar: {
            type: "string",
            xml: { name: "XmlAuthor" },
          },
        },
      ],
      [
        "scalar deeply, is arrays: false",
        "model Book { author: AuthorScalar; }",
        `scalar AuthorScalar extends Author; @name("XmlAuthor") scalar Author extends string;`,
        {
          Book: {
            type: "object",
            properties: {
              author: {
                allOf: [{ $ref: "#/components/schemas/AuthorScalar" }],
                xml: { name: "author" },
              },
            },
            required: ["author"],
          },
          AuthorScalar: {
            type: "string",
            xml: { name: "XmlAuthor" },
          },
        },
      ],
    ];
    it.each(testCases)("%s", async (_, mainModel, refModel, expected) => {
      const res = await oapiForModel(
        "Book",
        `${mainModel}
       ${refModel}`,
      );

      deepStrictEqual(res?.schemas, expected);
    });
  });

  it("set xml.name and attribute for Enum schema", async () => {
    const res = await oapiForModel(
      "Book",
      `
      model Book {       
        @attribute
        @name("xmlStatus")
        status: EnumStatus;
      };
      enum EnumStatus {
        Active,
        Inactive,
      };`,
    );

    deepStrictEqual(res.schemas, {
      Book: {
        properties: {
          status: {
            allOf: [{ $ref: "#/components/schemas/EnumStatus" }],
            xml: { attribute: true, name: "xmlStatus" },
          },
        },
        required: ["status"],
        type: "object",
      },
      EnumStatus: {
        enum: ["Active", "Inactive"],
        type: "string",
      },
    });
  });
});
