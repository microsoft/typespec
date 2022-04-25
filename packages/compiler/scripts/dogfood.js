// @ts-check
import { run } from "@cadl-lang/internal-build-utils";
import { readFileSync } from "fs";

const version = JSON.parse(readFileSync("package.json", "utf-8")).version;
await run("npm", ["pack"]);
await run("npm", ["install", "-g", `cadl-lang-compiler-${version}.tgz`]);
