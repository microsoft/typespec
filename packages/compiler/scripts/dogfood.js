import { readFileSync } from "fs";
import { run } from "../../../eng/scripts/helpers.js";

const version = JSON.parse(readFileSync("package.json")).version;
run("npm", ["pack"]);
run("npm", ["install", "-g", `cadl-lang-compiler-${version}.tgz`]);
