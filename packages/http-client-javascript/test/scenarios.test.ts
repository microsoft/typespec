import { Diagnostic } from "@typespec/compiler";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { format } from "prettier";
import { Project } from "ts-morph";
import { afterEach, describe, expect, it } from "vitest";
import { emitWithDiagnostics } from "./test-host.js";
const SCENARIOS_LOCATION = "./test/scenarios";

const SCENARIOS_UPDATE = process.env["SCENARIOS_UPDATE"] === "true";

type EmitterFunction = (tsp: string, namedArgs: Record<string, string>) => Promise<string>;

/**
 * Mapping of different snapshot types to how to get them.
 * Snapshot types can take single-word string arguments templated in curly braces {} and are otherwise regex
 *
 * TODO: trying to figure out the best syntax for this; the existing "emit" functions have a lot of positional boolean options.
 * It would be good to make it easy to specify what options you want in a clear way.
 */
const OUTPUT_CODE_BLOCK_TYPES: Record<string, EmitterFunction> = {
  // Snapshot of a particular interface named {name} in the models file
  "(ts|typescript) {file} interface {name}": async (tsp, { file, name }) => {
    const result = await emitWithDiagnostics(tsp);
    const project = loadOutput(result);
    const sourceFile = project.getSourceFileOrThrow(file);

    return sourceFile!.getInterfaceOrThrow(name ?? "No name specified!").getText();
  },

  // Snapshot of a particular function named {name} in the models file
  "(ts|typescript) {file} function {name}": async (tsp, { file, name }) => {
    const result = await emitWithDiagnostics(tsp);

    if (result[0] === undefined) {
      return "// (file was not generated)";
    }

    const project = loadOutput(result);
    const sourceFile = project.getSourceFileOrThrow(file);

    return sourceFile.getFunctionOrThrow(name ?? "No name specified!").getText();
  },

  // Snapshot of the entire file
  "(ts|typescript) {file}": async (tsp, { file }) => {
    const result = await emitWithDiagnostics(tsp);
    const project = loadOutput(result);
    const sourceFile = project.getSourceFileOrThrow(file);

    return sourceFile.getFullText();
  },
};

describe.only("Scenarios", function () {
  describeScenarios(SCENARIOS_LOCATION);
});

function describeScenarios(location: string) {
  const children = readdirSync(location);
  for (const child of children) {
    const fullPath = path.join(location, child);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      describe(child, function () {
        describeScenarios(fullPath);
      });
    } else {
      describeScenario(fullPath);
    }
  }
}

function describeScenario(scenarioFile: string) {
  let content = readFileSync(scenarioFile, { encoding: "utf-8" });

  // Reads the first line, which should be a top-level header (h1).
  // This becomes the name of the describe block for this scenario.
  const scenarioName =
    content.split("\n")[0]?.replace(/^#+\s+/, "") + (SCENARIOS_UPDATE ? " (UPDATING)" : "");

  // Mark the test as .only if the test title starts with "only:". Useful for
  // debuggging and updating.
  (scenarioName.toLowerCase().startsWith("only:") ? describe.only : describe)(
    scenarioName!,
    function () {
      const codeBlocks = getCodeBlocks(content);

      // Find all TypeSpec codeblocks. If there are multiple, concat them and treat them as a single TypeSpec.
      const typeSpecInput = codeBlocks
        .filter((x) => x.heading === "tsp" || x.heading === "typespec")
        .map((x) => x.content)
        .join("\n");
      const testCodeBlocks = codeBlocks.filter(
        (x) => x.heading !== "tsp" && x.heading !== "typespec"
      );

      for (const codeBlock of testCodeBlocks) {
        let tested = false;
        for (const [template, fn] of Object.entries(OUTPUT_CODE_BLOCK_TYPES)) {
          // This regex creates a named capture group for each template argument
          const templateRegex = new RegExp(
            "^" + template.replace(/\{(\w+)\}/g, "(?<$1>[^\\s]+)") + "$"
          );

          const match = codeBlock.heading.match(templateRegex);

          if (match !== null) {
            const namedArgs = match.groups;

            it(codeBlock.heading, async function () {
              const result = await fn(typeSpecInput, namedArgs ?? {});

              if (SCENARIOS_UPDATE) {
                content = updateCodeBlock(
                  content,
                  codeBlock.heading,
                  (await format(result)).trim()
                );
              } else {
                const expected = await format(codeBlock.content, { parser: "typescript" });
                const actual = await format(result, { parser: "typescript" });
                expect(actual).toBe(expected);
              }
            });

            tested = true;
          }
        }

        if (!tested) {
          // Empty test case to mark it as skipped
          console.log("Skipping test case: ", codeBlock.heading);
          it.skip(codeBlock.heading, function () {});
        }
      }

      // Update after all the tests in the scenario if write mode was enabled
      afterEach(function () {
        if (SCENARIOS_UPDATE) {
          writeFileSync(scenarioFile, content);
        }
      });
    }
  );
}

interface CodeBlock {
  content: string;
  heading: string;
}

/**
 * Finds all code blocks in the input file text
 * @param fileText Full text of the input file
 * @returns List of code blocks in the source file with their heading (i.e. the language details after the first ```) and the content.
 */
function getCodeBlocks(fileText: string): CodeBlock[] {
  const matches = fileText.matchAll(/^```(?<heading>[^\n]+)\n(?<content>(.|\n)*?)```$/gm);

  return [...matches].map((match) => ({
    content: match.groups!["content"]!,
    heading: match.groups!["heading"]!,
  }));
}

/**
 * Update a code block's content in a given file, returning the updated file content.
 *
 * @param file The full text of the input file.
 * @param codeBlockHeading The heading of the code block whose content should be replaced.
 * @param newContent The content to replace the code block's content with.
 * @returns The new file content that results after replacing the content of the code block with the new content.
 */
function updateCodeBlock(file: string, codeBlockHeading: string, newContent: string): string {
  const lines = file.split("\n");
  const start = lines.indexOf("```" + codeBlockHeading) + 1;
  const end = lines.indexOf("```", start);

  return [...lines.slice(0, start), newContent, ...lines.slice(end)].join("\n");
}

function loadOutput(emittedProject: [Record<string, string>, readonly Diagnostic[]]) {
  const program = new Project({ useInMemoryFileSystem: true });
  const [output, diagnostics] = emittedProject;
  let errors = 0;
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") {
      errors++;
      console.error(diagnostic.message);
    }
    console.warn(diagnostic.message);
  }

  if (errors > 0) {
    throw new Error("Errors found during compilation");
  }

  for (const [fileName, content] of Object.entries(output)) {
    program.createSourceFile(fileName, content);
  }

  return program;
}
