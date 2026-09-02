import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

const PythonTester = createTester(resolvePath(import.meta.dirname, "../.."), { libraries: [] });

export const Tester = PythonTester;
