// @ts-check

import { readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const jsonFilename = resolve(__dirname, "../schema/dist/schema.json");
const jsFilename = resolve(__dirname, "../schema/dist/schema.js");
console.log("Reading json schema at:", jsonFilename);
const content = await readFile(jsonFilename);

const json = JSON.parse(content.toString());

const jsContent = `
const schema = ${JSON.stringify(json)};
export default schema;
`;
console.log("Writing json schema in js file:", jsonFilename);
await writeFile(jsFilename, jsContent);
