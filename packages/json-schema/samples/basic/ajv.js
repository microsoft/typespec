import Ajv from "ajv/dist/2020.js";
import fs from "fs/promises";

const schemas = [];
const dir = await fs.readdir("./cadl-output/@cadl-lang/json-schema");
for (const file of dir) {
  schemas.push(JSON.parse(await fs.readFile(`./cadl-output/@cadl-lang/json-schema/${file}`)));
}

const ajv = new Ajv({ schemas });
const validate = ajv.getSchema("Bar.json");

console.log(validate({}));
