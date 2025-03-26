import { deepStrictEqual } from "assert";
import { it } from "vitest";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

it("Rename a single file and update the content of the corresponding import at the same time", async () => {
  const host = await createTestServerHost();

  host.addTypeSpecFile(
    "./main.tsp",
    `
    import "./lib/test.tsp";
    import "./subdir/subfile.tsp";
    `,
  );
  host.addTypeSpecFile(
    "./lib/test.tsp",
    `
    import "./common.tsp";
    import "../subdir/subfile.tsp";
    `,
  );
  host.addTypeSpecFile("./lib/common.tsp", "model Base {}");
  host.addTypeSpecFile("./subdir/subfile.tsp", "model SubFile {}");

  await host.compilerHost.rm("./subdir/subfile.tsp", { recursive: false });
  host.addTypeSpecFile("./subdir/subfile1.tsp", "model SubFile {}");

  await host.server.renameFiles({
    files: [
      { oldUri: host.getURL("./subdir/subfile.tsp"), newUri: host.getURL("./subdir/subfile1.tsp") },
    ],
  });

  const mainDoc = await host.compilerHost.readFile("./main.tsp");
  deepStrictEqual(
    mainDoc.text,
    `
    import "./lib/test.tsp";
    import "./subdir/subfile1.tsp";
    `,
    "No changes expected",
  );

  const libDoc = await host.compilerHost.readFile("./lib/test.tsp");
  deepStrictEqual(
    libDoc.text,
    `
    import "./common.tsp";
    import "../subdir/subfile1.tsp";
    `,
    "No changes expected",
  );
});

it("Move files and update the content of the corresponding import at the same time", async () => {
  const host = await createTestServerHost();

  host.addTypeSpecFile(
    "./main.tsp",
    `
    import "./lib/test.tsp";
    import "./lib/common.tsp";
    import "./lib/enum.tsp";
    `,
  );
  host.addTypeSpecFile(
    "./lib/test.tsp",
    `
    import "../subdir/subfile.tsp";
    import "./enum.tsp";
    `,
  );
  host.addTypeSpecFile("./lib/common.tsp", "model Base {}");
  host.addTypeSpecFile("./lib/enum.tsp", "enum DirEnum { A, B, C }");
  host.addTypeSpecFile("./subdir/subfile.tsp", "model SubFile {}");

  await host.compilerHost.rm("./lib/common.tsp", { recursive: false });
  await host.compilerHost.rm("./lib/enum.tsp", { recursive: false });
  host.addTypeSpecFile("./subdir/common.tsp", "model Base {}");
  host.addTypeSpecFile("./subdir/enum.tsp", "enum DirEnum { A, B, C }");

  await host.server.renameFiles({
    files: [
      { oldUri: host.getURL("./lib/common.tsp"), newUri: host.getURL("./subdir/common.tsp") },
      { oldUri: host.getURL("./lib/enum.tsp"), newUri: host.getURL("./subdir/enum.tsp") },
    ],
  });

  const mainDoc = await host.compilerHost.readFile("./main.tsp");
  deepStrictEqual(
    mainDoc.text,
    `
    import "./lib/test.tsp";
    import "./subdir/common.tsp";
    import "./subdir/enum.tsp";
    `,
    "No changes expected",
  );

  const libDoc = await host.compilerHost.readFile("./lib/test.tsp");
  deepStrictEqual(
    libDoc.text,
    `
    import "../subdir/subfile.tsp";
    import "../subdir/enum.tsp";
    `,
    "No changes expected",
  );
});
