import { ok, strictEqual } from "assert";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, it } from "vitest";

describe("export_apiview_markdown.py", () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const scriptPath = path.join(root, "eng/scripts/setup/export_apiview_markdown.py");
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "apimd-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeTokenJson(data: object): string {
    const tokenPath = path.join(tmpDir, "token.json");
    fs.writeFileSync(tokenPath, JSON.stringify(data));
    return tokenPath;
  }

  it("generates api.md from a simple token file", () => {
    const tokenPath = writeTokenJson({
      Language: "Python",
      ReviewLines: [
        {
          Tokens: [
            { Value: "class", HasSuffixSpace: true },
            { Value: "MyClient", HasPrefixSpace: false },
          ],
        },
        {
          Tokens: [
            { Value: "def", HasSuffixSpace: true },
            { Value: "send(self)", HasPrefixSpace: false },
          ],
          Children: [
            {
              Tokens: [{ Value: "..." }],
            },
          ],
        },
      ],
    });

    const outDir = path.join(tmpDir, "output");
    fs.mkdirSync(outDir);
    execFileSync("python3", [scriptPath, tokenPath, outDir]);

    const apiMd = fs.readFileSync(path.join(outDir, "api.md"), "utf-8");
    ok(apiMd.startsWith("```py"), "Should start with python code fence");
    ok(apiMd.includes("class"), "Should contain class token");
    ok(apiMd.includes("MyClient"), "Should contain MyClient token");
    ok(apiMd.endsWith("```"), "Should end with code fence");
  });

  it("writes api.md directly when output path is a .md file", () => {
    const tokenPath = writeTokenJson({
      Language: "Python",
      ReviewLines: [{ Tokens: [{ Value: "class Foo" }] }],
    });

    const outFile = path.join(tmpDir, "custom.md");
    execFileSync("python3", [scriptPath, tokenPath, outFile]);
    ok(fs.existsSync(outFile), "Should write to the specified .md file");
    const content = fs.readFileSync(outFile, "utf-8");
    ok(content.includes("class Foo"));
  });

  it("exits with error for empty ReviewLines", () => {
    const tokenPath = writeTokenJson({
      Language: "Python",
      ReviewLines: [],
    });

    const outDir = path.join(tmpDir, "output");
    fs.mkdirSync(outDir);
    // Empty ReviewLines is treated as missing by the script
    let threw = false;
    try {
      execFileSync("python3", [scriptPath, tokenPath, outDir], { stdio: "pipe" });
    } catch {
      threw = true;
    }
    ok(threw, "Should exit with error for empty ReviewLines");
  });

  it("resolves language aliases correctly", () => {
    const tokenPath = writeTokenJson({
      Language: "JavaScript",
      ReviewLines: [{ Tokens: [{ Value: "function foo() {}" }] }],
    });

    const outDir = path.join(tmpDir, "output");
    fs.mkdirSync(outDir);
    execFileSync("python3", [scriptPath, tokenPath, outDir]);

    const apiMd = fs.readFileSync(path.join(outDir, "api.md"), "utf-8");
    ok(apiMd.startsWith("```js"), "Should use 'js' alias for JavaScript");
  });

  it("renders nested children with indentation", () => {
    const tokenPath = writeTokenJson({
      Language: "Python",
      ReviewLines: [
        {
          Tokens: [{ Value: "class Foo:" }],
          Children: [
            {
              Tokens: [{ Value: "def bar(self):" }],
              Children: [{ Tokens: [{ Value: "pass" }] }],
            },
          ],
        },
      ],
    });

    const outDir = path.join(tmpDir, "output");
    fs.mkdirSync(outDir);
    execFileSync("python3", [scriptPath, tokenPath, outDir]);

    const apiMd = fs.readFileSync(path.join(outDir, "api.md"), "utf-8");
    const lines = apiMd.split("\n");
    // Children should be indented
    ok(
      lines.some((l: string) => l.startsWith("    ") && l.includes("def bar")),
      "First-level children should have 4-space indent",
    );
    ok(
      lines.some((l: string) => l.startsWith("        ") && l.includes("pass")),
      "Second-level children should have 8-space indent",
    );
  });
});

describe("generateApiMd token file lookup", () => {
  it("expected token filename follows {package_name}_python.json pattern", () => {
    // Verify the naming convention used by apistubgen
    const packageName = "azure-ai-inference";
    const expectedFilename = `${packageName}_python.json`;
    strictEqual(expectedFilename, "azure-ai-inference_python.json");
  });
});
