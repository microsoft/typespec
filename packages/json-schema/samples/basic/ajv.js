import Ajv from "ajv/dist/2020.js";

const schemas = [];
const dir = await fs.readdir("./cadl-output/@cadl-lang/json-schema");
for (const file of dir) {
  schemas.push(JSON.parse(await fs.readFile(`./cadl-output/@cadl-lang/json-schema/${file}`)));
}

const ajv = new Ajv({ schemas });
const validate = ajv.getSchema("Bar.json");

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
