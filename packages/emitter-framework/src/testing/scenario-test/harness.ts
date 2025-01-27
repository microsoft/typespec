import { TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import minimist from "minimist";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { LanguageConfiguration, SnippetExtractor } from "./snippet-extractor.js";
import { emitWithDiagnostics } from "./test-host.js";

const rawArgs = process.env.TEST_ARGS ? process.env.TEST_ARGS.split(" ") : [];

// Parse command-line arguments with minimist
const args = minimist(rawArgs, {
  alias: {
    filter: "f", // Short alias for `--filter`
  },
  default: {
    filter: undefined, // Default to undefined if no filter is provided
  },
});

// Extract the filter paths from the parsed arguments
const filterPaths = args.filter
  ? Array.isArray(args.filter) // Handle single or multiple file paths
    ? args.filter
    : [args.filter]
  : undefined;

const SCENARIOS_UPDATE = process.env["SCENARIOS_UPDATE"] === "true";

type EmitterFunction = (tsp: string, namedArgs: Record<string, string>) => Promise<string>;

async function assertGetEmittedFile(
  testLibrary: TypeSpecTestLibrary,
  emitterOutputDir: string,
  file: string,
  code: string,
) {
  const [emittedFiles, diagnostics] = await emitWithDiagnostics(
    testLibrary,
    emitterOutputDir,
    code,
  );

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  if (warnings.length > 0) {
    console.warn(`Warning compiling code:\n ${warnings.map((x) => x.message).join("\n")}`);
  }
  if (errors.length > 0) {
    throw new Error(`Error compiling code:\n ${errors.map((x) => x.message).join("\n")}`);
  }

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

export async function executeScenarios(
  testLibrary: TypeSpecTestLibrary,
  languageConfiguration: LanguageConfiguration,
  scenariosLocation: string,
  emitterOutputDir: string,
  snippetExtractor: SnippetExtractor,
) {
  const scenarioList = filterPaths ?? [];
  scenarioList.length && console.log("Filtering scenarios: ", scenarioList);

  if (!scenarioList.length) {
    // Add all scenarios.
    discoverAllScenarios(scenariosLocation, scenarioList);
  }

  for (const filePath of scenarioList) {
    describeScenario(
      filePath,
      testLibrary,
      languageConfiguration,
      emitterOutputDir,
      snippetExtractor,
    );
  }
}

function discoverAllScenarios(location: string, scenarios: string[]) {
  const children = readdirSync(location);
  for (const child of children) {
    const fullPath = path.join(location, child);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      discoverAllScenarios(fullPath, scenarios);
    } else {
      scenarios.push(fullPath);
    }
  }

  return scenarios;
}
interface Scenario {
  // The title of the scenario delimited by H1
  title: string;
  // The content of the scenario
  content: Array<string | ScenarioCodeBlock>;
}

interface ScenarioCodeBlock {
  kind: "spec" | "test";
  heading: string;
  content: string[];
}

interface ScenarioFile {
  path: string;
  scenarios: Scenario[];
}

function parseFile(path: string): ScenarioFile {
  // Read the whole file
  const rawContent = readFileSync(path, { encoding: "utf-8" });

  // Split the content by H1
  const sections = splitByH1(rawContent);

  const scenarioFile: ScenarioFile = {
    path,
    scenarios: [],
  };

  for (const section of sections) {
    const scenarioContent = parseScenario(section.content);
    const scenario: Scenario = {
      title: section.title,
      content: scenarioContent,
    };

    scenarioFile.scenarios.push(scenario);
  }

  return scenarioFile;
}

function parseScenario(content: string): (string | ScenarioCodeBlock)[] {
  const lines = content.split("\n");
  const parsedContent: Array<string | ScenarioCodeBlock> = [];
  let currentCodeBlock: ScenarioCodeBlock | null = null;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (currentCodeBlock) {
        // Close the code block
        parsedContent.push(currentCodeBlock);
        currentCodeBlock = null;
      } else {
        const codeBlockKind = line.includes("tsp") || line.includes("typespec") ? "spec" : "test";
        // Start a new code block
        currentCodeBlock = { kind: codeBlockKind, heading: line.substring(3), content: [] };
      }
    } else if (currentCodeBlock) {
      // Append to code block content
      currentCodeBlock.content.push(line);
    } else {
      // Add regular line
      parsedContent.push(line);
    }
  }

  return parsedContent;
}

function describeScenario(
  scenarioFile: string,
  testLibrary: TypeSpecTestLibrary,
  languageConfiguration: LanguageConfiguration,
  emitterOutputDir: string,
  snippetExtractor: SnippetExtractor,
) {
  const parsedScenarioFile = parseFile(scenarioFile);

  describe(`Scenario: ${parsedScenarioFile.path}`, () => {
    for (const scenario of parsedScenarioFile.scenarios) {
      // If we are updating we add (UPDATING) to the scenario name to make it clear
      const scenarioName = scenario.title + (SCENARIOS_UPDATE ? " (UPDATING)" : "");

      // Mark the test as .only if the test title starts with "only:". Useful for debugging and updating.
      describe(`${scenarioName}`, () => {
        // Find all TypeSpec codeblocks. If there are multiple, concat them and treat them as a single TypeSpec.
        const typeSpecInput = scenario.content
          .filter((c) => typeof c !== "string")
          .filter((c) => c.kind === "spec")
          .map((c) => c.content.join("\n"))
          .join("\n");

        // Find all non TypeSpec codeblocks, this are used to test the output of the emitter
        const testCodeBlocks = scenario.content
          .filter((c) => typeof c !== "string")
          .filter((c) => c.kind === "test");

        for (const testCodeBlock of testCodeBlocks) {
          let tested = false;
          const outputCodeBlockTypes = getCodeBlockTypes(
            testLibrary,
            languageConfiguration,
            emitterOutputDir,
            snippetExtractor,
          );

          // Looping through all the output code block types to find the one that matches the current test code block
          for (const [template, fn] of Object.entries(outputCodeBlockTypes)) {
            // This regex creates a named capture group for each template argument
            const templateRegex = new RegExp(
              "^" + template.replace(/\{(\w+)\}/g, "(?<$1>[^\\s]+)") + "$",
            );

            const match = testCodeBlock.heading.match(templateRegex);

            if (!match) {
              continue;
            }

            const namedArgs = match.groups;

            it.concurrent(testCodeBlock.heading, async function () {
              // Gets the emitted code that matches the test code block heading
              const result = await fn(typeSpecInput, namedArgs ?? {});

              if (SCENARIOS_UPDATE) {
                testCodeBlock.content = (await languageConfiguration.format(result)).split("\n");
              } else {
                const expected = await languageConfiguration.format(
                  testCodeBlock.content.join("\n"),
                );
                const actual = await languageConfiguration.format(result);
                expect(actual).toBe(expected);
              }
            });

            tested = true;
          }

          if (!tested) {
            // Empty test case to mark it as skipped
            it.skip(testCodeBlock.heading, function () {
              console.log("Skipping test case: ", testCodeBlock.heading);
            });
          }
        }

        // Update after all the tests in the scenario if write mode was enabled
        afterAll(function () {
          if (SCENARIOS_UPDATE) {
            updateFile(parsedScenarioFile);
          }
        });
      });
    }
  });
}

function updateFile(scenarioFile: ScenarioFile) {
  const newContent: string[] = [];

  for (const scenario of scenarioFile.scenarios) {
    newContent.push(`# ${scenario.title}`);
    for (const line of scenario.content) {
      if (typeof line === "string") {
        newContent.push(line);
      } else {
        newContent.push("```" + line.heading);
        newContent.push(...line.content);
        newContent.push("```");
      }
    }
  }

  writeFileSync(scenarioFile.path, newContent.join("\n"), { encoding: "utf-8" });
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
