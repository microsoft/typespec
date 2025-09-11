import { convertOpenAPI3Document } from "./dist/src/index.js";

const testSpec = {
  openapi: "3.0.0",
  info: {
    title: "Test Service",
    version: "0.0.0",
  },
  paths: {},
  components: {
    schemas: {
      Foo: {
        type: "object",
        required: ["bar"],
        properties: {
          bar: {
            anyOf: [
              {
                type: "string",
                default: "life",
              },
              {
                type: "array",
                items: {
                  type: "string",
                  default: "life",
                },
              },
              {
                type: "number",
                default: 42,
              },
            ],
          },
        },
      },
    },
  },
};

console.log("Testing union with multiple defaults:");
console.log("====================================");
const result = await convertOpenAPI3Document(testSpec);
console.log(result);