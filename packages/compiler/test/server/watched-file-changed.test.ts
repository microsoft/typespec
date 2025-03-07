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

  await host.server.watchedFilesChanged({
    changes: [
      { uri: host.getURL("./subdir/subfile.tsp"), type: 3 },
      { uri: host.getURL("./subdir/subfile1.tsp"), type: 1 },
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

  await host.server.watchedFilesChanged({
    changes: [
      { uri: host.getURL("./lib/common.tsp"), type: 3 },
      { uri: host.getURL("./lib/enum.tsp"), type: 3 },
      { uri: host.getURL("./subdir/common.tsp"), type: 1 },
      { uri: host.getURL("./subdir/enum.tsp"), type: 1 },
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

it("Just adding a file will not trigger file renaming", async () => {
  const host = await createTestServerHost();

  host.addTypeSpecFile(
    "./main.tsp",
    `
    import "./lib/test.tsp";
    `,
  );
  host.addTypeSpecFile("./lib/test.tsp", "model Base {}");
  host.addTypeSpecFile("./subfile.tsp", "model SubFile {}");

  await host.server.watchedFilesChanged({
    changes: [{ uri: host.getURL("./subfile.tsp"), type: 1 }],
  });

  const mainDoc = await host.compilerHost.readFile("./main.tsp");
  deepStrictEqual(
    mainDoc.text,
    `
    import "./lib/test.tsp";
    `,
    "No changes expected",
  );
});

it("Just removing a file will not trigger file renaming", async () => {
  const host = await createTestServerHost();

  host.addTypeSpecFile(
    "./main.tsp",
    `
    import "./lib/test.tsp";
    `,
  );
  host.addTypeSpecFile("./lib/test.tsp", "model Base {}");
  host.addTypeSpecFile("./subfile.tsp", "model SubFile {}");

  await host.compilerHost.rm("./subfile.tsp", { recursive: false });

  await host.server.watchedFilesChanged({
    changes: [{ uri: host.getURL("./subfile.tsp"), type: 3 }],
  });

  const mainDoc = await host.compilerHost.readFile("./main.tsp");
  deepStrictEqual(
    mainDoc.text,
    `
    import "./lib/test.tsp";
    `,
    "No changes expected",
  );
});
