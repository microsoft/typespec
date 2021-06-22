import { fileURLToPath, URL } from "url";
import { createProgram } from "../../compiler/program.js";
import { NodeHost } from "../../compiler/util.js";

const libs = ["simple"];

describe("adl: libraries", () => {
  for (const lib of libs) {
    describe(lib, () => {
      it("compiles without error", async () => {
        try {
          const mainFile = fileURLToPath(
            new URL(`../../../test/libraries/${lib}/main.adl`, import.meta.url)
          );
          await createProgram(NodeHost, mainFile, { noEmit: true });
        } catch (e) {
          console.error(e.diagnostics);
          throw e;
        }
      });
    });
  }
});
