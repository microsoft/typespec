import { rejects, strictEqual } from "assert";
import { mkdir, readFile, rm } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { InvalidEncodingError, NodeHost } from "../../../src/core/node-host.js";
import { resolvePath } from "../../../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("compiler: node host", () => {
  const fixtureRoot = resolvePath(__dirname, "../../../../test/core/node-host/fixtures");
  const tempDir = resolvePath(fixtureRoot, "temp");
  function fixturePath(path: string) {
    return resolvePath(fixtureRoot, path);
  }

  before(async () => {
    try {
      await rm(tempDir, { recursive: true });
    } catch {}
    await mkdir(tempDir, { recursive: true });
  });

  describe("readFile", () => {
    describe("encoding", () => {
      it("it reads an UTF-8 file", async () => {
        const file = await NodeHost.readFile(fixturePath("encoding/utf8.txt"));
        strictEqual(file.text, "utf8 file\n");
      });

      it("it reads an UTF-8 with bom file", async () => {
        const file = await NodeHost.readFile(fixturePath("encoding/utf8bom.txt"));
        strictEqual(file.text, "utf8 with bom file\n");
      });

      it("it throws InvalidEncodingError if UTF-16BE", async () => {
        await rejects(
          () => NodeHost.readFile(fixturePath("encoding/utf16be.txt")),
          (error) => error instanceof InvalidEncodingError
        );
      });

      it("it throws InvalidEncodingError if UTF-16LE", async () => {
        await rejects(
          () => NodeHost.readFile(fixturePath("encoding/utf16le.txt")),
          (error) => error instanceof InvalidEncodingError
        );
      });
    });
  });

  describe("writeFile", () => {
    it("write file as UTF-8", async () => {
      const filename = resolvePath(tempDir, "writeFile.saved-as-utf8.txt");
      const content = "Saved as UTF8";
      await NodeHost.writeFile(filename, content);

      strictEqual(await readFile(filename, "utf-8"), content);
    });
  });
});
