import addFormats from "ajv-formats";
import Ajv from "ajv/dist/2020.js";
import fs from "fs/promises";
import yaml from "js-yaml";

const schemas = [];
const dir = await fs.readdir("./tsp-output/@typespec/json-schema");
for (const file of dir) {
  schemas.push(yaml.load(await fs.readFile(`./tsp-output/@typespec/json-schema/${file}`)));
}

const ajv = new Ajv({ schemas });
addFormats(ajv);
const validate = ajv.getSchema("User.yaml");
console.log(
  validate({
    username: "Brian",
    email: "brian.terlson@microsoft.com",
    posts: {
      nextLink: "/foo/bar.json",
      items: [{ contents: "hi how are u", createdAt: "2020-10-10" }],
    },
  })
);
console.log(validate.errors);
/*
const schema = new Ajv().compile({
  allOf: [{ type: "object", properties: { x: { type: "string" } } }],
});
console.log(schema([1]));

class Foo extends Array {
  constructor() {
    super();
  }
}
const f = new Foo();
console.log(schema({ length: 1 }));

*/
