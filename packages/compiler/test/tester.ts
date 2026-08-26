import { resolvePath } from "../src/index.js";
import { createTester } from "../src/testing/tester.js";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), { libraries: [] });
