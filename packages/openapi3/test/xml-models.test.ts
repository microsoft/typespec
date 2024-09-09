import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { oapiForModel } from "./test-host.js";

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

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        content: { type: "string" },
      },
      required: ["content"],
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

    deepStrictEqual(res.schemas.Book, {
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

  it("set xml.name on schema property", async () => {
    const res = await oapiForModel(
      "Book",
      `model Book {
          @name("xmlcontent")
          content: string;
        };`
    );

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        content: { type: "string", xml: { name: "xmlcontent" } },
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
        @name("xmlBook")
        @encodedName("application/json", "jsonBook")
        model Book {        
          content: string;
        };`
    );

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        content: { type: "string" },
      },
      required: ["content"],
      xml: {
        name: "xmlBook",
      },
    });
  });

  it("set the json name and no xml name", async () => {
    const res = await oapiForModel(
      "Book",
      `
        @encodedName("application/json", "jsonBook")
        model Book {        
          content: string;
        };`
    );

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        content: { type: "string" },
      },
      required: ["content"],
    });
  });
});

describe("@attribute", () => {
  it("set xml.attribute=true", async () => {
    const res = await oapiForModel(
      "Book",
      `model Book {
          @attribute
          id: string;
        };`
    );

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        id: { type: "string", xml: { attribute: true } },
      },
      required: ["id"],
    });
  });
});

describe("@unwrapped", () => {
  it("provide the namespace and prefix using string", async () => {
    const res = await oapiForModel(
      "Book",
      `model Book {
          @unwrapped
          id: string;
        };`
    );

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
      },
      required: ["id"],
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
    deepStrictEqual(res.schemas.Book, {
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

    deepStrictEqual(res.schemas.Book, {
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

    deepStrictEqual(res.schemas.Book, {
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

    deepStrictEqual(res.schemas.Book, {
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

    deepStrictEqual(res.schemas.Book, {
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

    deepStrictEqual(res.schemas.Book, {
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

    deepStrictEqual(res.schemas.tag, {
      type: "string",
      xml: {
        name: "ItemsName",
      },
    });

    deepStrictEqual(res.schemas.Book, {
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

    deepStrictEqual(res.schemas.tag, {
      type: "string",
      xml: {
        name: "ItemsName",
      },
    });

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        tags: {
          type: "array",
          xml: {
            name: "ItemsTags",
            wrapped: true,
          },
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

    deepStrictEqual(res.schemas.Tag, {
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

    deepStrictEqual(res.schemas.Pet, {
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

    deepStrictEqual(res.schemas.Tag, {
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

    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        tags: {
          type: "array",
          xml: {
            name: "ItemsTags",
            wrapped: true,
          },
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

    deepStrictEqual(res.schemas.Tag, {
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

    deepStrictEqual(res.schemas.Pet, {
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
  it("wrapped and renamed Tags object array in xmlPet Model.", async () => {
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

    deepStrictEqual(res.schemas.Tag, {
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

    deepStrictEqual(res.schemas.Pet, {
      type: "object",
      properties: {
        tags: {
          type: "array",
          xml: {
            name: "ItemsTags",
            wrapped: true,
          },
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
});

describe("Nested models", () => {
  it("author object in Book Model", async () => {
    const res = await oapiForModel(
      "Book",
      `
        model Book {
          author: Author;
        }
        
        model Author {
          name: string;
        }`
    );

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        author: {
          $ref: "#/components/schemas/Author",
        },
      },
      required: ["author"],
    });

    deepStrictEqual(res.schemas.Author, {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    });
  });
  it("object rename as XmlAuthor in Book Model", async () => {
    const res = await oapiForModel(
      "Book",
      `
        model Book {
          author: Author;
        }
        @name("XmlAuthor")
        model Author {
          name: string;
        }`
    );

    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        author: {
          $ref: "#/components/schemas/Author",
        },
      },
      required: ["author"],
    });

    deepStrictEqual(res.schemas.Author, {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      xml: {
        name: "XmlAuthor",
      },
    });
  });
});
