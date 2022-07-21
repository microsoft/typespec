// Preload the parser so it doeesn;t slow down the first test as much
import "@typescript-eslint/parser";
import { resolve } from "path";

export function getFixturesRootDir(): string {
  return resolve(__dirname, "../../../test/fixtures");
}
