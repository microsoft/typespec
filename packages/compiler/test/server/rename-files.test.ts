import { setTimeout } from "timers/promises";
import { beforeEach, describe, expect, it } from "vitest";
import { resolvePath } from "../../src/core/path-utils.js";
import { createTestServerHost, TestServerHost } from "../../src/testing/test-server-host.js";
import { listAllFilesInDir } from "../../src/utils/fs-utils.js";
let host: TestServerHost;

beforeEach(async () => {
  host = await createTestServerHost();
});

describe("files", () => {
  it("rename a single file", async () => {
    await setup({
      "./main.tsp": `
        import "./lib/test.tsp";
        import "./subdir/subfile.tsp";
      `,
      "./lib/test.tsp": `
        import "./common.tsp";
        import "../subdir/subfile.tsp";
      `,
      "./lib/common.tsp": "model Base {}",
      "./subdir/subfile.tsp": "model SubFile {}",
    });

    await rename({
      "subdir/subfile.tsp": "subdir/subfile1.tsp",
    });

    await expectFiles({
      "./main.tsp": `
        import "./lib/test.tsp";
        import "./subdir/subfile1.tsp";
      `,
      "./lib/test.tsp": `
        import "./common.tsp";
        import "../subdir/subfile1.tsp";
      `,
      "./lib/common.tsp": "model Base {}",
      "./subdir/subfile1.tsp": "model SubFile {}",
    });
  });

  it("rename a single file multiple times", async () => {
    await setup({
      "main.tsp": `
        import "./a.tsp";
      `,
      "a.tsp": `// a.tsp`,
    });

    await rename({
      "a.tsp": "b.tsp",
    });

    await expectFiles({
      "main.tsp": `
        import "./b.tsp";
      `,
      "b.tsp": `// a.tsp`,
    });

    await rename({
      "b.tsp": "c.tsp",
    });

    await expectFiles({
      "main.tsp": `
        import "./c.tsp";
      `,
      "c.tsp": `// a.tsp`,
    });
  });

  it("handle file system having delayed rename", async () => {
    await setup({
      "main.tsp": `
        import "./a.tsp";
      `,
      "a.tsp": `// a.tsp`,
    });

    await rename(
      {
        "a.tsp": "b.tsp",
      },
      { delay: 10 },
    );

    await expectFiles({
      "main.tsp": `
        import "./b.tsp";
      `,
      "b.tsp": `// a.tsp`,
    });
  });

  it("move multiple files", async () => {
    await setup({
      "./main.tsp": `
        import "./lib/test.tsp";
        import "./lib/common.tsp";
        import "./lib/enum.tsp";
      `,
      "./lib/test.tsp": `
        import "../subdir/subfile.tsp";
        import "./enum.tsp";
      `,
      "./lib/common.tsp": "model Base {}",
      "./lib/enum.tsp": "enum DirEnum { A, B, C }",
      "./subdir/subfile.tsp": "model SubFile {}",
    });

    await rename({
      "lib/common.tsp": "subdir/common.tsp",
      "lib/enum.tsp": "subdir/enum.tsp",
    });

    await expectFiles({
      "./main.tsp": `
        import "./lib/test.tsp";
        import "./subdir/common.tsp";
        import "./subdir/enum.tsp";
      `,
      "./lib/test.tsp": `
        import "../subdir/subfile.tsp";
        import "../subdir/enum.tsp";
      `,
      "./subdir/common.tsp": "model Base {}",
      "./subdir/enum.tsp": "enum DirEnum { A, B, C }",
      "./subdir/subfile.tsp": "model SubFile {}",
    });
  });
});

describe("folders", () => {
  it("renames a single folder", async () => {
    await setup({
      "./main.tsp": `
      import "./lib/a.tsp";
      import "./lib/b.tsp";
    `,
      "./lib/a.tsp": ``,
      "./lib/b.tsp": ``,
    });

    await rename({ "./lib": "./lib-renamed" });

    await expectFiles({
      "./main.tsp": `
      import "./lib-renamed/a.tsp";
      import "./lib-renamed/b.tsp";
    `,
      "./lib-renamed/a.tsp": ``,
      "./lib-renamed/b.tsp": ``,
    });
  });

  it("moves multiple folder", async () => {
    await setup({
      "./main.tsp": `
      import "./lib1/a.tsp";
      import "./lib1/b.tsp";
      import "./lib2/a.tsp";
      import "./lib2/b.tsp";
    `,
      "./lib1/a.tsp": `// lib1/a.tsp`,
      "./lib1/b.tsp": `// lib1/b.tsp`,
      "./lib2/a.tsp": `// lib2/a.tsp`,
      "./lib2/b.tsp": `// lib2/b.tsp`,
    });

    await rename({ "./lib1": "./sub/lib1", "./lib2": "./sub/lib2" });

    await expectFiles({
      "./main.tsp": `
      import "./sub/lib1/a.tsp";
      import "./sub/lib1/b.tsp";
      import "./sub/lib2/a.tsp";
      import "./sub/lib2/b.tsp";
    `,
      "./sub/lib1/a.tsp": `// lib1/a.tsp`,
      "./sub/lib1/b.tsp": `// lib1/b.tsp`,
      "./sub/lib2/a.tsp": `// lib2/a.tsp`,
      "./sub/lib2/b.tsp": `// lib2/b.tsp`,
    });
  });

  it("rename a folder multiple times", async () => {
    await setup({
      "./main.tsp": `
      import "./lib1/a.tsp";
      import "./lib1/b.tsp";
    `,
      "./lib1/a.tsp": ``,
      "./lib1/b.tsp": ``,
    });

    await rename({ "./lib1": "./lib2" });
    await expectFiles({
      "./main.tsp": `
      import "./lib2/a.tsp";
      import "./lib2/b.tsp";
    `,
      "./lib2/a.tsp": ``,
      "./lib2/b.tsp": ``,
    });

    await rename({ "./lib2": "./lib3" });
    await expectFiles({
      "./main.tsp": `
      import "./lib3/a.tsp";
      import "./lib3/b.tsp";
    `,
      "./lib3/a.tsp": ``,
      "./lib3/b.tsp": ``,
    });
  });
});

async function setup(files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    host.addTypeSpecFile(path, content);
  }
}

async function rename(
  files: Record<string, string>,
  fsAction: "before" | { delay: number } = "before",
) {
  const lspParams = {
    files: Object.entries(files).map(([oldUri, newUri]) => ({
      oldUri: host.getURL(oldUri),
      newUri: host.getURL(newUri),
    })),
  };

  if (fsAction === "before") {
    await renameFiles(files);
    await host.server.renameFiles(lspParams);
  } else {
    await Promise.all([
      setTimeout(fsAction.delay).then((x) => renameFiles(files)),
      host.server.renameFiles(lspParams),
    ]);
  }
}

async function expectFiles(expected: Record<string, string>) {
  for (const [path, content] of Object.entries(expected)) {
    const file = await host.compilerHost.readFile(path);
    expect(file.text).toEqual(content);
  }
}

async function renameFile(oldPath: string, newPath: string) {
  const contents = await host.compilerHost.readFile(oldPath);
  await host.compilerHost.writeFile(newPath, contents.text);
  await host.compilerHost.rm(oldPath, { recursive: false });
}

async function renameFiles(files: Record<string, string>) {
  for (const [oldPath, newPath] of Object.entries(files)) {
    if (oldPath.endsWith(".tsp")) {
      await renameFile(oldPath, newPath);
    } else {
      const files = await listAllFilesInDir(host.compilerHost, oldPath);
      for (const file of files) {
        await renameFile(resolvePath(oldPath, file), resolvePath(newPath, file));
      }
    }
  }
}
