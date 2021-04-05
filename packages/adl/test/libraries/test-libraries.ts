import { createProgram } from "../../compiler/program.js";
import { NodeHost } from "../../compiler/util.js";

const libs = ["simple"];

describe("libraries", () => {
  for (const lib of libs) {
    describe(lib, () => {
      it("compiles without error", async () => {
        try {
          await createProgram(NodeHost, {
            mainFile: "test/libraries/" + lib + "/main.adl",
            noEmit: true,
          });
        } catch (e) {
          console.error(e.diagnostics);
          throw e;
        }
      });
    });
  }
});
