import { rejects, strictEqual } from "assert";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { beforeAll, describe, it } from "vitest";
import { InvalidEncodingError, NodeHost } from "../../../src/core/node-host.js";
import { getDirectoryPath, resolvePath } from "../../../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("compiler: node host", () => {
  const fixtureRoot = resolvePath(__dirname, "../../../../temp/test/node-host");

  function fixturePath(path: string) {
    return resolvePath(fixtureRoot, path);
  }

  async function writeFixture(
    path: string,
    content: string,
    encoding: "utf8" | "utf8bom" | "utf16le" | "utf16be",
  ): Promise<string> {
    const resolvedPath = fixturePath(path);
    const directory = getDirectoryPath(resolvedPath);
    await mkdir(directory, { recursive: true });
    let buffer;

    if (encoding === "utf8bom") {
      buffer = Buffer.from(`\ufeff${content}`, "utf8");
    } else if (encoding === "utf16le") {
      buffer = Buffer.from(`\ufeff${content}`, "utf16le");
    } else if (encoding === "utf16be") {
      buffer = Buffer.from(`\ufeff${content}`, "utf16le").swap16();
    } else {
      buffer = Buffer.from(content, "utf8");
    }
    await writeFile(resolvedPath, buffer);
    return resolvedPath;
  }

  beforeAll(async () => {
    try {
      await rm(fixtureRoot, { recursive: true });
    } catch {}
    await mkdir(fixtureRoot, { recursive: true });
  });

  describe("readFile", () => {
    describe("encoding", () => {
      it("it reads an UTF-8 file", async () => {
        const fixture = await writeFixture("encoding/utf8.txt", "utf8 file", "utf8");
        const file = await NodeHost.readFile(fixture);
        strictEqual(file.text, "utf8 file");
      });

      it("it reads an UTF-8 with bom file", async () => {
        const fixture = await writeFixture("encoding/utf8bom.txt", "utf8 with bom file", "utf8bom");
        const file = await NodeHost.readFile(fixture);
        strictEqual(file.text, "utf8 with bom file");
      });

      it("it throws InvalidEncodingError if UTF-16BE", async () => {
        const fixture = await writeFixture("encoding/utf16be.txt", "utf16be file", "utf16be");

        await rejects(
          () => NodeHost.readFile(fixture),
          (error) => error instanceof InvalidEncodingError,
        );
      });

      it("it throws InvalidEncodingError if UTF-16LE", async () => {
        const fixture = await writeFixture("encoding/utf16le.txt", "utf16le file", "utf16le");

        await rejects(
          () => NodeHost.readFile(fixture),
          (error) => error instanceof InvalidEncodingError,
        );
      });
    });
  });

  describe("writeFile", () => {
    it("write file as UTF-8", async () => {
      const filename = fixturePath("writeFile.saved-as-utf8.txt");
      const content = "Saved as UTF8";
      await NodeHost.writeFile(filename, content);

      strictEqual(await readFile(filename, "utf-8"), content);
    });
  });
});
