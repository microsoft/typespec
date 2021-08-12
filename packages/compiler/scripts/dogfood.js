import { run } from "../../../eng/scripts/helpers.js";
import { readFileSync } from "fs";

const version = JSON.parse(readFileSync("package.json")).version;
run("npm", ["pack"]);
run("npm", ["install", "-g", `cadl-lang-compiler-${version}.tgz`]);
