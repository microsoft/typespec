import { logVerboseTestOutput } from "../../core/diagnostics.js";
import { parse } from "../../core/parser.js";

interface FuzzedFile extends FuzzedScope {
  name: string;
  contents: string[];
}

interface FuzzedScope {
  bindings: string[];
  scopes: FuzzedScope[];
}

const odds = {
  newFileInProgram: 0.5,
  newStatementInFile: 0.5,
  createNamespace: 0.5,
  mangleTokens: 1,
  mangleToken: 0.1,
  newModelProperty: 0.5,
};

const tokens = ["|", "&", ":", "{", "}", '"', '"""', "op", "model", "?", "...", "(", ")", ";", ","];

const weights = {
  scriptItemKind: {
    namespace: 1,
    model: 1,
    operation: 1,
  },
  statementKind: {
    namespace: 1,
    model: 1,
    operation: 1,
  },
  tokenmangle: {
    delete: 1,
    replaceWithOther: 5,
    replaceWithRandom: 1,
  },
};

main();

function main() {
  if (process.argv[2] !== "run") {
    throw new Error(
      "Correct usage is `node fuzz.js run`. Is there a missing/incorrect mocha exclude pattern causing this to load?"
    );
  }
  const iterations = 10000;
  console.log("Running parser fuzz test with 1000 iterations...");
  fuzzTest(iterations);
  console.log("Fuzz test completed successfully without issues.");
}

function fuzzTest(iterations: number) {
  let fileCount: number = 0;

  for (let i = 0; i < iterations; i++) {
    const files = generateCadlProgram();
    maybe(() => {
      for (const f of files) {
        for (const [i] of f.contents.entries()) {
          maybe(() => {
            roll(
              {
                delete() {
                  f.contents[i] = "";
                },
                replaceWithOther() {
                  f.contents[i] = randomItem(tokens);
                },
                replaceWithRandom() {
                  f.contents[i] = String.fromCharCode(Math.random() * 96 + 32);
                },
              },
              weights.tokenmangle
            );
          }, odds.mangleToken);
        }
      }
    }, odds.mangleTokens);

    logVerboseTestOutput(">>>");
    for (const f of files) {
      const source = f.contents.join(" ");
      logVerboseTestOutput(f.name + ": " + f.contents.join(" "));

      try {
        parse(source);
      } catch (err) {
        console.error("Failed to parse generated source:");
        console.error(source);
        throw err;
      }
    }

    function generateCadlProgram(): FuzzedFile[] {
      fileCount = 0;
      const files: FuzzedFile[] = [];
      repeatBinomial(
        () => {
          files.push(generateCadlFile());
        },
        odds.newFileInProgram,
        { atLeastOnce: true }
      );

      return files;
    }

    function generateCadlFile(): FuzzedFile {
      const file: FuzzedFile = {
        name: `f${fileCount++}.cadl`,
        contents: [],
        bindings: [],
        scopes: [],
      };

      repeatBinomial(
        () => {
          file.contents.push(...generateCadlScriptItem());
        },
        odds.newStatementInFile,
        { atLeastOnce: true }
      );
      return file;
    }

    function generateCadlScriptItem(): string[] {
      let stmt: string[] = [];

      roll(
        {
          namespace() {
            stmt = stmt.concat(["namespace", "Foo", "{", ...generateNamespaceBody(), "}"]);
          },
          model() {
            stmt = stmt.concat(["model", "Foo", "{", ...generateModelBody(), "}"]);
          },
          operation() {
            stmt = stmt.concat(["op", "Foo", "(", ")", ":", "{}"]);
          },
        },
        weights.scriptItemKind
      );

      return stmt;
    }

    function generateStatement(): string[] {
      let stmt: string[] = [];

      roll(
        {
          namespace() {
            stmt = stmt.concat(["namespace", "Foo", "{", ...generateNamespaceBody(), "}"]);
          },
          model() {
            stmt = stmt.concat(["model", "Foo", "{", ...generateModelBody(), "}"]);
          },
          operation() {
            stmt = stmt.concat(["op", "Foo", "(", ")", ";"]);
          },
        },
        weights.statementKind
      );

      return stmt;
    }

    function generateModelBody() {
      let contents: string[] = [];
      repeatBinomial(() => {
        contents = contents.concat(["foo", ":", "ref", ","]);
      }, odds.newModelProperty);
      return contents;
    }

    function generateNamespaceBody(): string[] {
      let contents: string[] = [];
      repeatBinomial(() => {
        contents = contents.concat(generateStatement());
      }, odds.newStatementInFile);
      return contents;
    }

    function repeatBinomial(fn: Function, p: number, opts: { atLeastOnce?: boolean } = {}) {
      if (opts.atLeastOnce) {
        fn();
      }

      while (Math.random() < p) {
        fn();
      }
    }

    function roll<T>(opts: Record<keyof T, Function>, weights: Record<keyof T, number>): void {
      let sum = 0;
      for (const w of Object.values<number>(weights)) {
        sum += w;
      }

      let n = Math.random() * sum;

      for (const [k, w] of Object.entries<number>(weights)) {
        if (n < w) {
          (opts as any)[k]();
        }
        n -= w as number;
      }
    }

    function randomItem(arr: any[]) {
      const index = Math.floor(Math.random() * arr.length);
      return arr[index];
    }

    function maybe(fn: Function, p: number) {
      if (Math.random() < p) {
        fn();
      }
    }
  }
}
