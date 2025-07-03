import { logDiagnostics, NodeHost, normalizePath } from "@typespec/compiler";
import { expectDiagnosticEmpty, type EmitterTester } from "@typespec/compiler/testing";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "pathe";
import { format } from "prettier";
import { afterAll, describe, expect, it } from "vitest";
import type { LanguageConfiguration, SnippetExtractor } from "./snippet-extractor.js";

const SCENARIOS_UPDATE =
  process.env["RECORD"] === "true" || process.env["SCENARIOS_UPDATE"] === "true";

type EmitterFunction = (tsp: string, namedArgs: Record<string, string>) => Promise<string>;

async function assertGetEmittedFile(tester: EmitterTester, file: string, code: string) {
  const [{ outputs }, diagnostics] = await tester.compileAndDiagnose(code);
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  if (warnings.length > 0) {
    // TODO: this should ideally fail the test or be part of the expectation.
    logDiagnostics(warnings, NodeHost.logSink);
  }
  expectDiagnosticEmpty(errors);

  const normalizedTarget = normalizePath(file);
  const sourceFile = outputs[normalizedTarget];

  if (!sourceFile) {
    throw new Error(
      `File ${file} not found in emitted files:\n ${Object.keys(outputs).join("\n")}`,
    );
  }
  return sourceFile;
}

/**
 * Mapping of different snapshot types to how to get them.
 * Snapshot types can take single-word string arguments templated in curly braces {} and are otherwise regex
 */
function getCodeBlockTypes(
  tester: EmitterTester,
  languageConfiguration: LanguageConfiguration,
  snippetExtractor: SnippetExtractor,
): Record<string, EmitterFunction> {
  const languageTags = languageConfiguration.codeBlockTypes.join("|");
  return {
    // Snapshot of a particular interface named {name} in the models file
    [`(${languageTags}) {file} interface {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(tester, file, code);
      const snippet = snippetExtractor.getInterface(sourceFile, name);

      if (!snippet) {
        throw new Error(`Interface ${name} not found in ${file}`);
      }

      return snippet;
    },

    [`(${languageTags}) {file} type {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(tester, file, code);
      const snippet = snippetExtractor.getTypeAlias(sourceFile, name);

      if (!snippet) {
        throw new Error(`Type alias ${name} not found in ${file}`);
      }

      return snippet;
    },

    // Snapshot of a particular function named {name} in the models file
    [`(${languageTags}) {file} function {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(tester, file, code);
      const snippet = snippetExtractor.getFunction(sourceFile, name);

      if (!snippet) {
        throw new Error(`Function ${name} not found in ${file}`);
      }

      return snippet;
    },

    // Snapshot of a particular class named {name} in the models file
    [`(${languageTags}) {file} class {name}`]: async (code, { file, name }) => {
      const sourceFile = await assertGetEmittedFile(tester, file, code);
      const snippet = snippetExtractor.getClass(sourceFile, name);

      if (!snippet) {
        throw new Error(`Class ${name} not found in ${file}`);
      }

      return snippet;
    },

    // Snapshot of the entire file
    [`(${languageTags}) {file}`]: async (code, { file }) => {
      const sourceFile = await assertGetEmittedFile(tester, file, code);
      return sourceFile;
    },
  };
}

export async function executeScenarios(
  tester: EmitterTester,
  languageConfiguration: LanguageConfiguration,
  scenariosLocation: string,
  snippetExtractor: SnippetExtractor,
) {
  const scenarioList = discoverAllScenarios(scenariosLocation);

  describeScenarios(scenarioList, tester, languageConfiguration, snippetExtractor);
}

function discoverAllScenarios(dir: string): ScenarioFileId[] {
  const scenarios: ScenarioFileId[] = [];

  function recurse(current: string) {
    const children = readdirSync(join(dir, current));
    for (const child of children) {
      const fullPath = join(dir, current, child);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        recurse(join(current, child));
      } else {
        scenarios.push({ path: fullPath, relativePath: join(current, child) });
      }
    }
  }

  recurse("");
  return scenarios;
}

interface ScenarioFileId {
  path: string;
  relativePath: string;
}

interface ScenarioFile extends ScenarioFileId {
  scenarios: Scenario[];
}

interface Scenario {
  // The title of the scenario delimited by H1
  title: string;
  // The content of the scenario
  content: ScenarioContents;
}

interface ScenarioContents {
  lines: Array<string | ScenarioCodeBlock>;
  specBlock: SpecCodeBlock;
  testBlocks: TestCodeBlock[];
}

interface SpecCodeBlock {
  kind: "spec" | "test";
  content: string[];
}

interface TestCodeBlock {
  kind: "test";
  heading: string;
  content: string[];
  matchedTemplate: {
    template: string;
    fn: EmitterFunction;
    namedArgs: Record<string, string> | null;
  };
}

type ScenarioCodeBlock = SpecCodeBlock | TestCodeBlock;

function parseFile(
  file: ScenarioFileId,
  tester: EmitterTester,
  languageConfiguration: LanguageConfiguration,
  snippetExtractor: SnippetExtractor,
): ScenarioFile {
  // Read the whole file
  const rawContent = readFileSync(file.path, { encoding: "utf-8" });

  // Split the content by H1
  const sections = splitByH1(rawContent);

  const scenarioFile: ScenarioFile = {
    ...file,
    scenarios: [],
  };

  for (const section of sections) {
    const scenarioContent = parseScenario(
      section.content,
      tester,
      languageConfiguration,
      snippetExtractor,
    );
    const scenario: Scenario = {
      title: section.title,
      content: scenarioContent,
    };

    scenarioFile.scenarios.push(scenario);
  }

  return scenarioFile;
}

function isTestCodeBlock(codeBlock: ScenarioCodeBlock): codeBlock is TestCodeBlock {
  return codeBlock.kind === "test";
}

function parseScenario(
  content: string,
  tester: EmitterTester,
  languageConfiguration: LanguageConfiguration,
  snippetExtractor: SnippetExtractor,
): ScenarioContents {
  const rawLines = content.split("\n");
  const scenario: ScenarioContents = {
    lines: [],
    specBlock: { kind: "spec", content: [] },
    testBlocks: [],
  };

  let currentCodeBlock: ScenarioCodeBlock | null = null;

  // Precompute output code block types once
  const outputCodeBlockTypes = getCodeBlockTypes(tester, languageConfiguration, snippetExtractor);

  for (const line of rawLines) {
    if (line.startsWith("```") && currentCodeBlock) {
      // Close the code block
      scenario.lines.push(currentCodeBlock);
      if (!isTestCodeBlock(currentCodeBlock)) {
        scenario.specBlock.content = currentCodeBlock.content;
      } else {
        for (const [template, fn] of Object.entries(outputCodeBlockTypes)) {
          const templateRegex = new RegExp(
            "^" + template.replace(/\{(\w+)\}/g, "(?<$1>[^\\s]+)") + "$",
          );

          const match = currentCodeBlock.heading.match(templateRegex);
          if (match) {
            currentCodeBlock.matchedTemplate = {
              template,
              fn,
              namedArgs: match.groups ?? null,
            };
            break;
          }
        }
        scenario.testBlocks.push(currentCodeBlock);
      }
      currentCodeBlock = null;
    } else if (line.startsWith("```")) {
      const codeBlockKind = line.includes("tsp") || line.includes("typespec") ? "spec" : "test";
      // Start a new code block
      currentCodeBlock = { kind: codeBlockKind, heading: line.substring(3), content: [] };
    } else if (currentCodeBlock) {
      // Append to code block content
      currentCodeBlock.content.push(line);
    } else {
      // Add regular line
      scenario.lines.push(line);
    }
  }

  return scenario;
}

function describeScenarios(
  scenarioFiles: ScenarioFileId[],
  tester: EmitterTester,
  languageConfiguration: LanguageConfiguration,
  snippetExtractor: SnippetExtractor,
) {
  const scenarios = scenarioFiles.map((f) =>
    parseFile(f, tester, languageConfiguration, snippetExtractor),
  );

  for (const scenarioFile of scenarios) {
    describe(`${scenarioFile.relativePath}`, () => {
      for (const scenario of scenarioFile.scenarios) {
        const isOnly = scenario.title.includes("only:");
        const isSkip = scenario.title.includes("skip:");

        const describeFn = isSkip ? describe.skip : isOnly ? describe.only : describe;

        describeFn(`Scenario: ${scenario.title}`, () => {
          for (const testBlock of scenario.content.testBlocks) {
            it(`Test: ${testBlock.heading}`, async () => {
              const { fn, namedArgs } = testBlock.matchedTemplate;
              const result = await fn(
                scenario.content.specBlock.content.join("\n"),
                namedArgs ?? {},
              );

              if (SCENARIOS_UPDATE) {
                testBlock.content = (await languageConfiguration.format(result)).split("\n");
              } else {
                const expected = await languageConfiguration.format(testBlock.content.join("\n"));
                const actual = await languageConfiguration.format(result);
                expect(actual).toBe(expected);
              }
            });
          }
        });
      }

      // Update after all the tests in the scenario if write mode was enabled
      afterAll(async function () {
        if (SCENARIOS_UPDATE) {
          await updateFile(scenarioFile);
        }
      });
    });
  }
}

async function updateFile(scenarioFile: ScenarioFile) {
  const newContent: string[] = [];

  for (const scenario of scenarioFile.scenarios) {
    newContent.push(`# ${scenario.title}`);
    for (const line of scenario.content.lines) {
      if (typeof line === "string") {
        newContent.push(line);
      } else {
        const heading = isTestCodeBlock(line) ? line.heading : "tsp";
        newContent.push("```" + heading);
        newContent.push(...line.content);
        newContent.push("```");
      }
    }
  }

  const formattedContent = await format(newContent.join("\n"), { parser: "markdown" });
  writeFileSync(scenarioFile.path, formattedContent, { encoding: "utf-8" });
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
