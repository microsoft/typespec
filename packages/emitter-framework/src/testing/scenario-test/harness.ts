import { TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageConfiguration, SnippetExtractor } from "./snippet-extractor.js";
import { emitWithDiagnostics } from "./test-host.js";

const SCENARIOS_UPDATE = process.env["SCENARIOS_UPDATE"] === "true";

let hasOnlyScenarios = false;

type EmitterFunction = (tsp: string, namedArgs: Record<string, string>) => Promise<string>;

async function assertGetEmittedFile(
  testLibrary: TypeSpecTestLibrary,
  emitterOutputDir: string,
  file: string,
  code: string,
) {
  const [emittedFiles] = await emitWithDiagnostics(testLibrary, emitterOutputDir, code);
  const sourceFile = emittedFiles.find((x) => x.path === file);

  if (!sourceFile) {
    throw new Error(`File ${file} not found in emitted files`);
  }
  return sourceFile;
}

/**
 * Mapping of different snapshot types to how to get them.
 * Snapshot types can take single-word string arguments templated in curly braces {} and are otherwise regex
 */
function getCodeBlockTypes(
  testLibrary: TypeSpecTestLibrary,
  languageConfiguration: LanguageConfiguration,
  emitterOutputDir: string,
  snippetExtractor: SnippetExtractor,
): Record<string, EmitterFunction> {
  const languageTags = languageConfiguration.codeBlockTypes.join("|");
  return {
    // Snapshot of a particular interface named {name} in the models file
    [`(${languageTags}) {file} interface {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(testLibrary, emitterOutputDir, file, code);
      const snippet = snippetExtractor.getInterface(sourceFile.content, name);

      if (!snippet) {
        throw new Error(`Interface ${name} not found in ${file}`);
      }

      return snippet;
    },

    [`(${languageTags}) {file} type {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(testLibrary, emitterOutputDir, file, code);
      const snippet = snippetExtractor.getTypeAlias(sourceFile.content, name);

      if (!snippet) {
        throw new Error(`Type alias ${name} not found in ${file}`);
      }

      return snippet;
    },

    // Snapshot of a particular function named {name} in the models file
    [`(${languageTags}) {file} function {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(testLibrary, emitterOutputDir, file, code);
      const snippet = snippetExtractor.getFunction(sourceFile.content, name);

      if (!snippet) {
        throw new Error(`Function ${name} not found in ${file}`);
      }

      return snippet;
    },

    // Snapshot of a particular class named {name} in the models file
    [`(${languageTags}) {file} class {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(testLibrary, emitterOutputDir, file, code);
      const snippet = snippetExtractor.getClass(sourceFile.content, name);

      if (!snippet) {
        throw new Error(`Class ${name} not found in ${file}`);
      }

      return snippet;
    },

    // Snapshot of the entire file
    [`(${languageTags}) {file}`]: async (code, { file }) => {
      const sourceFile = await assertGetEmittedFile(testLibrary, emitterOutputDir, file, code);
      return sourceFile.content;
    },
  };
}

export function executeScenarios(
  testLibrary: TypeSpecTestLibrary,
  languageConfiguration: LanguageConfiguration,
  scenariosLocation: string,
  emitterOutputDir: string,
  snippetExtractor: SnippetExtractor,
) {
  describe.only("Scenarios", function () {
    // First, scan all the scenarios to see if any are marked with `only:`.
    scanScenarios(scenariosLocation);

    // If there are no `only:` scenarios, run all scenarios normally.
    if (hasOnlyScenarios) {
      describeScenarios(
        scenariosLocation,
        testLibrary,
        languageConfiguration,
        emitterOutputDir,
        snippetExtractor,
        false,
      );
    } else {
      describeScenarios(
        scenariosLocation,
        testLibrary,
        languageConfiguration,
        emitterOutputDir,
        snippetExtractor,
        true,
      );
    }
  });
}

function describeScenarios(
  location: string,
  testLibrary: TypeSpecTestLibrary,
  languageConfiguration: LanguageConfiguration,
  emitterOutputDir: string,
  snippetExtractor: SnippetExtractor,
  runAll = false,
) {
  const children = readdirSync(location);
  for (const child of children) {
    const fullPath = path.join(location, child);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      describe(child, function () {
        describeScenarios(
          fullPath,
          testLibrary,
          languageConfiguration,
          emitterOutputDir,
          snippetExtractor,
          runAll,
        );
      });
    } else {
      describeScenario(
        fullPath,
        testLibrary,
        languageConfiguration,
        emitterOutputDir,
        snippetExtractor,
        runAll,
      );
    }
  }
}

function describeScenario(
  scenarioFile: string,
  testLibrary: TypeSpecTestLibrary,
  languageConfiguration: LanguageConfiguration,
  emitterOutputDir: string,
  snippetExtractor: SnippetExtractor,
  runAll: boolean,
) {
  const content = readFileSync(scenarioFile, { encoding: "utf-8" });

  const sections = splitByH1(content);

  sections.forEach(({ title, content }) => {
    const scenarioName = title + (SCENARIOS_UPDATE ? " (UPDATING)" : "");
    const isOnly = scenarioName.toLowerCase().startsWith("only:");

    if (isOnly) {
      hasOnlyScenarios = true;
    }

    if (runAll || isOnly) {
      // Mark the test as .only if the test title starts with "only:". Useful for debugging and updating.
      describe(scenarioName!, function () {
        const codeBlocks = getCodeBlocks(content);

        // Find all TypeSpec codeblocks. If there are multiple, concat them and treat them as a single TypeSpec.
        const typeSpecInput = codeBlocks
          .filter((x) => x.heading === "tsp" || x.heading === "typespec")
          .map((x) => x.content)
          .join("\n");
        const testCodeBlocks = codeBlocks.filter(
          (x) => x.heading !== "tsp" && x.heading !== "typespec",
        );

        for (const codeBlock of testCodeBlocks) {
          let tested = false;
          const outputCodeBlockTypes = getCodeBlockTypes(
            testLibrary,
            languageConfiguration,
            emitterOutputDir,
            snippetExtractor,
          );
          for (const [template, fn] of Object.entries(outputCodeBlockTypes)) {
            // This regex creates a named capture group for each template argument
            const templateRegex = new RegExp(
              "^" + template.replace(/\{(\w+)\}/g, "(?<$1>[^\\s]+)") + "$",
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
                    (await languageConfiguration.format(result)).trim(),
                  );
                } else {
                  const expected = await languageConfiguration.format(codeBlock.content);
                  const actual = await languageConfiguration.format(result);
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
      });
    }
  });
}

function splitByH1(content: string): { title: string; content: string }[] {
  const sections = content.split(/\n(?=# )/).map((section) => {
    const lines = section.split("\n");
    const title = lines.shift()!.replace(/^#+\s+/, "");
    return {
      title,
      content: lines.join("\n"),
    };
  });

  return sections;
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

function scanScenarios(location: string) {
  const children = readdirSync(location);
  for (const child of children) {
    const fullPath = path.join(location, child);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanScenarios(fullPath);
    } else {
      scanScenario(fullPath);
    }
  }
}

function scanScenario(scenarioFile: string) {
  const content = readFileSync(scenarioFile, { encoding: "utf-8" });

  const sections = splitByH1(content);

  sections.forEach(({ title }) => {
    const scenarioName = title + (SCENARIOS_UPDATE ? " (UPDATING)" : "");
    if (scenarioName.toLowerCase().startsWith("only:")) {
      hasOnlyScenarios = true;
    }
  });
}
