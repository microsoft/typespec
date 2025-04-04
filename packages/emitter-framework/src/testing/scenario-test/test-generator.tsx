import { Children, code, For, Output, render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { ScenarioFile } from "./harness.js";
import { LanguageConfiguration } from "./snippet-extractor.js";

interface TestP {
  testFiles: TestFile[];
}

export async function generateTest(
  scenarioFiles: ScenarioFile[],
  languageConfiguration: LanguageConfiguration,
) {
  const files = await createScenarioFile(scenarioFiles, languageConfiguration);

  const tree = render(<Test testFiles={files} />);

  return tree;
}

export function Test({ testFiles }: TestP) {
  return (
    <Output>
      <For each={testFiles}>
        {(file) => {
          return (
            <SourceFile path={file.path}>
              <For each={file.describes}>
                {(describe) => {
                  return (
                    <Describe description={describe.description}>
                      <For each={describe.tests}>
                        {(test) => {
                          return code`
                      it(${test.description}, () => {
                        const actual = \`${test.actual}\`;

                        
                        const expected = \`${test.expected}\`;


                        expect(actual).toEqual(expected);
                      });
                    `;
                        }}
                      </For>
                    </Describe>
                  );
                }}
              </For>
            </SourceFile>
          );
        }}
      </For>
    </Output>
  );
}

interface TestFile {
  path: string;
  describes: DescribeProps[];
}

interface DescribeProps {
  description: string;
  tests: TestProps[];
}

interface TestProps {
  description: string;
  actual: string;
  expected: string;
}

async function createScenarioFile(
  scenarioFiles: ScenarioFile[],
  languageConfiguration: LanguageConfiguration,
) {
  const testFiles: TestFile[] = [];

  for (const scenarioFile of scenarioFiles) {
    const testFile: TestFile = {
      path: scenarioFile.path,
      describes: [],
    };

    for (const scenario of scenarioFile.scenarios) {
      const describe: DescribeProps = {
        description: scenario.title,
        tests: [],
      };
      for (const testBlock of scenario.content.testBlocks) {
        const { matchedTemplate } = testBlock;
        const { fn, namedArgs } = matchedTemplate;

        const result = await fn(scenario.content.specBlock.content.join("\n"), namedArgs ?? {});

        const expected = await languageConfiguration.format(testBlock.content.join("\n"));
        const actual = await languageConfiguration.format(result);

        describe.tests.push({
          description: scenario.title,
          actual,
          expected,
        });
      }
      testFile.describes.push(describe);
    }

    testFiles.push(testFile);
  }

  return testFiles;
}

interface DescribeP {
  description: string;
  children: Children;
}

function Describe(props: DescribeP) {
  return code`
    describe(${props.description}, () => {
      ${props.children}
    });
  `;
}
