// Use bundler via cli.
// Todo.

import { resolve } from "path";
import { bundleCadlLibrary } from "./bundler.js";

const name = process.argv[2];
const libraryPath = resolve(`../${name}`);
bundleCadlLibrary(libraryPath, resolve(process.cwd(), "output/output.js")).catch((e) => {
  console.error(e);
  process.exit(1);
});
