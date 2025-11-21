import { resolve } from "path";

export function getFixturesRootDir(): string {
  return resolve(__dirname, "../../test/fixtures");
}
