import { resolvePath } from "@typespec/compiler";
import { createTester, mockFile } from "@typespec/compiler/testing";
import { $onEmit } from "../src/emitter.js";

const PythonTester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: ["@azure-tools/typespec-client-generator-core"],
});

export const Tester = PythonTester;
export const EmitterTester = PythonTester.files({
  "node_modules/@typespec/http-client-python/package.json": JSON.stringify({
    name: "@typespec/http-client-python",
    version: "0.0.0",
    exports: { ".": "./index.js" },
  }),
  "node_modules/@typespec/http-client-python/index.js": mockFile.js({
    $onEmit,
  }),
}).emit("@typespec/http-client-python", {
  "generate-packaging-files": false,
  "use-pyodide": true,
});
