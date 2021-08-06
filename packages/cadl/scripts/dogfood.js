import { run } from "../../../eng/scripts/helpers.js";
import { readFileSync } from "fs";

const version = JSON.parse(readFileSync("package.json")).version;
run("npm", ["pack"]);
run("npm", ["install", "-g", `azure-tools-cadl-${version}.tgz`]);
