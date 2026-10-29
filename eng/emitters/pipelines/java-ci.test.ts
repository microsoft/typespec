import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

interface Step {
  task?: string;
  template?: string;
  displayName?: string;
  pwsh?: string;
  condition?: string;
  inputs?: Record<string, unknown>;
  [condition: `\${{ ${string} }}`]: Step[];
}

function loadTemplate(path: string): { steps: Step[] } {
  return parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}

const javaOnly = "${{ if eq(parameters.LanguageShortName, 'java') }}";

describe("Java CI", () => {
  it("caches Maven dependencies by OS, stage, and POM contents", () => {
    const { steps } = loadTemplate("../../common/pipelines/templates/steps/maven-authenticate.yml");
    const cache = steps.find((step) => step.task === "Cache@2");

    expect(cache?.inputs).toMatchObject({
      key: '"maven" | "$(Agent.OS)" | "$(System.StageName)" | ${{ parameters.SourceDirectory }}/**/pom.xml',
      restoreKeys: expect.stringContaining('"maven" | "$(Agent.OS)" | "$(System.StageName)"'),
      path: "$(MavenRepositoryPath)",
    });
  });

  it("caches the default Maven repository without caching feed credentials", () => {
    const { steps } = loadTemplate("../../common/pipelines/templates/steps/maven-authenticate.yml");

    expect(steps[0].pwsh).toContain('Join-Path $m2Dir "repository"');
    expect(steps[0].pwsh).toContain(
      "##vso[task.setvariable variable=MavenRepositoryPath]$mavenRepositoryPath",
    );
    expect(steps.findIndex((step) => step.task === "Cache@2")).toBeGreaterThan(0);
  });

  it.each(["build", "test"])("initializes Maven caching in Java %s jobs", (kind) => {
    const { steps } = loadTemplate(`./templates/steps/${kind}-step.yml`);
    const javaSteps = steps.flatMap((step) => step[javaOnly] ?? []);

    expect(javaSteps).toContainEqual({
      template: "/eng/common/pipelines/templates/steps/maven-authenticate.yml",
    });
  });

  it.each(["build", "test"])("publishes Maven results after Java %s failures", (kind) => {
    const { steps } = loadTemplate(`./templates/steps/${kind}-step.yml`);
    const javaSteps = steps.flatMap((step) => step[javaOnly] ?? []);
    const publisher = javaSteps.find((step) => step.task === "PublishTestResults@2");

    expect(publisher).toMatchObject({
      condition:
        kind === "test"
          ? "and(succeededOrFailed(), contains('${{ parameters.TestArgs }}', '-UnitTests'))"
          : "succeededOrFailed()",
      inputs: {
        testResultsFormat: "JUnit",
        searchFolder: "$(selfRepositoryPath)${{ parameters.PackagePath }}",
        testResultsFiles: expect.stringContaining(
          "generator/**/target/surefire-reports/TEST-*.xml",
        ),
        mergeTestResults: true,
        failTaskOnFailedTests: true,
        failTaskOnFailureToPublishResults: true,
        failTaskOnMissingResultsFile: true,
      },
    });

    const publisherIndex = steps.findIndex((step) =>
      step[javaOnly]?.some((nested) => nested.task === "PublishTestResults@2"),
    );
    const scriptIndex = steps.findIndex((step) => step.displayName === `Run ${kind} script`);
    expect(scriptIndex).toBeGreaterThanOrEqual(0);
    expect(publisherIndex).toBeGreaterThan(scriptIndex);
  });

  it("collects emitter JUnit results alongside Spector results", () => {
    const { steps } = loadTemplate("./templates/steps/test-step.yml");
    const publisher = steps
      .flatMap((step) => step[javaOnly] ?? [])
      .find((step) => step.task === "PublishTestResults@2");

    expect(publisher?.inputs?.testResultsFiles).toContain("test-results.xml");
  });

  it("runs emitter tests with console and JUnit reporters", () => {
    const script = readFileSync(
      new URL("../../../packages/http-client-java/eng/scripts/Test-Packages.ps1", import.meta.url),
      "utf8",
    );

    expect(script).toContain("npm run test:emitter");
    expect(script).toContain("-- --reporter=default --reporter=junit");
  });
});
