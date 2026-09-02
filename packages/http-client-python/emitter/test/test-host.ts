import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

const PythonTester = createTester(resolvePath(import.meta.dirname, "../.."), { libraries: [] });

export const Tester = PythonTester;
export const EmitterTester = PythonTester.emit("@typespec/http-client-python", {
  "generate-packaging-files": false,
  "use-pyodide": true,
});
