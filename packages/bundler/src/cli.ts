// Use bundler via cli.
// Todo.

import { resolve } from "path";
import { bundleTypeSpecLibrary } from "./bundler.js";

const name = process.argv[2];
const libraryPath = resolve(`../${name}`);
bundleTypeSpecLibrary(libraryPath, resolve(process.cwd(), "output")).catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
