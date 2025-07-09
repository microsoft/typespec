import { logDiagnostics, NodeHost } from "@typespec/compiler";
import { expectDiagnosticEmpty, type EmitterTester } from "@typespec/compiler/testing";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "pathe";
import { format } from "prettier";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getExcerptForQuery,
  parseCodeblockExpectation,
  type CodeBlockExpectation,
} from "./code-block-expectation.js";
import type { LanguageConfiguration, SnippetExtractor } from "./snippet-extractor.js";

const SCENARIOS_UPDATE =
  process.env["RECORD"] === "true" || process.env["SCENARIOS_UPDATE"] === "true";

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
  content: string;
}

interface TestCodeBlock {
  kind: "test";
  heading: string;
  content: string;
  expectation: CodeBlockExpectation;
}

type ScenarioCodeBlock = SpecCodeBlock | TestCodeBlock;

function parseFile(file: ScenarioFileId): ScenarioFile {
  // Read the whole file
  const rawContent = readFileSync(file.path, { encoding: "utf-8" });

  // Split the content by H1
  const sections = splitByH1(rawContent);

  const scenarioFile: ScenarioFile = {
    ...file,
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

function isTestCodeBlock(codeBlock: ScenarioCodeBlock): codeBlock is TestCodeBlock {
  return codeBlock.kind === "test";
}

function parseScenario(content: string): ScenarioContents {
  const rawLines = content.split("\n");
  const scenario: ScenarioContents = {
    lines: [],
    specBlock: { kind: "spec", content: "" },
    testBlocks: [],
  };

  let currentCodeBlock: { heading: string; content: string[] } | null = null;

  for (const line of rawLines) {
    if (line.startsWith("```") && currentCodeBlock) {
      const heading = currentCodeBlock.heading;
      const codeBlockKind =
        heading.includes("tsp") || heading.includes("typespec") ? "spec" : "test";
      const content = currentCodeBlock.content.join("\n");
      if (codeBlockKind === "spec") {
        const codeblock: SpecCodeBlock = {
          kind: "spec",
          content,
        };
        scenario.lines.push(codeblock);
        scenario.specBlock.content = content;
      } else {
        const codeblock: TestCodeBlock = {
          kind: "test",
          heading: currentCodeBlock.heading,
          content,
          expectation: parseCodeblockExpectation(currentCodeBlock.heading, content),
        };
        scenario.lines.push(codeblock);
        scenario.testBlocks.push(codeblock);
      }
      currentCodeBlock = null;
    } else if (line.startsWith("```")) {
      // Start a new code block
      currentCodeBlock = { heading: line.substring(3), content: [] };
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
  const scenarios = scenarioFiles.map((f) => parseFile(f));

  for (const scenarioFile of scenarios) {
    describe(`${scenarioFile.relativePath}`, () => {
      for (const scenario of scenarioFile.scenarios) {
        const isOnly = scenario.title.includes("only:");
        const isSkip = scenario.title.includes("skip:");
        const describeFn = isSkip ? describe.skip : isOnly ? describe.only : describe;

        let outputFiles: Record<string, string>;
        beforeAll(async () => {
          const code = scenario.content.specBlock.content;
          const [{ outputs }, diagnostics] = await tester.compileAndDiagnose(code);
          const errors = diagnostics.filter((d) => d.severity === "error");
          const warnings = diagnostics.filter((d) => d.severity === "warning");
          if (warnings.length > 0) {
            // TODO: this should ideally fail the test or be part of the expectation.
            logDiagnostics(warnings, NodeHost.logSink);
          }
          expectDiagnosticEmpty(errors);
          outputFiles = outputs;
        });

        describeFn(`Scenario: ${scenario.title}`, () => {
          for (const testBlock of scenario.content.testBlocks) {
            it(`Test: ${testBlock.heading}`, async () => {
              const result = getExcerptForQuery(
                snippetExtractor,
                testBlock.expectation,
                outputFiles,
              );

              if (SCENARIOS_UPDATE) {
                testBlock.content = await languageConfiguration.format(result);
              } else {
                const expected = await languageConfiguration.format(testBlock.content);
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
        newContent.push(line.content);
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
