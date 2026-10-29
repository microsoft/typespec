import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";

interface Step {
  task?: string;
  template?: string;
  displayName?: string;
  pwsh?: string;
  condition?: string;
  inputs?: Record<string, unknown>;
  [condition: `\${{ ${string} }}`]: Step[] | Step;
}

function loadTemplate(path: string): { steps: Step[] } {
  return parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}

function languageSteps(kind: string, language: string): Step[] {
  const { steps } = loadTemplate(`./templates/steps/${kind}-step.yml`);
  const condition: `\${{ ${string} }}` = `\${{ if eq(parameters.LanguageShortName, '${language}') }}`;
  return steps.flatMap((step) => {
    const branch = step[condition];
    return Array.isArray(branch) ? branch : [step];
  });
}

function publisherFor(kind: string, language: string, format: string): Step {
  const publisher = languageSteps(kind, language).find(
    (step) => step.task === "PublishTestResults@2" && step.inputs?.testResultsFormat === format,
  );
  if (!publisher) {
    throw new Error(`Missing ${format} publisher for ${language} ${kind} jobs.`);
  }
  return publisher;
}

function shouldPublish(publisher: Step, language: string, args: string, outcome: string): boolean {
  const branch =
    publisher[
      language === "python"
        ? "${{ if eq(parameters.LanguageShortName, 'python') }}"
        : language === "java"
          ? "${{ elseif eq(parameters.LanguageShortName, 'java') }}"
          : "${{ else }}"
    ];
  const condition = !Array.isArray(branch) ? (branch?.condition ?? publisher.condition) : undefined;
  if (!condition) {
    throw new Error("Missing test publishing condition.");
  }
  const result: unknown = runInNewContext(
    condition
      .replaceAll("${{ parameters.TestArgs }}", "$(TestArguments)")
      .replaceAll("$(TestArguments)", args),
    {
      and: (...values: boolean[]) => values.every(Boolean),
      or: (...values: boolean[]) => values.some(Boolean),
      contains: (value: string, fragment: string) =>
        value.toLowerCase().includes(fragment.toLowerCase()),
      succeededOrFailed: () => outcome === "succeeded" || outcome === "failed",
    },
  );
  if (typeof result !== "boolean") {
    throw new Error("Publishing conditions must evaluate to a boolean.");
  }
  return result;
}

function readSource(path: string): string {
  return readFileSync(new URL(`../../../packages/${path}`, import.meta.url), "utf8");
}

describe("Emitter CI", () => {
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
    const javaSteps = languageSteps(kind, "java");

    expect(javaSteps).toContainEqual({
      template: "/eng/common/pipelines/templates/steps/maven-authenticate.yml",
    });
  });

  it("publishes generator results after Java build failures", () => {
    const publisher = publisherFor("build", "java", "JUnit");
    expect(publisher).toMatchObject({
      condition: "succeededOrFailed()",
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
  });

  it.each([
    ["java", "generator/**/target/surefire-reports/TEST-*.xml"],
    ["csharp", "test-results.xml"],
    ["python", "tests/test-results/*.xml"],
  ])("collects JUnit results immediately after %s test scripts", (language, reports) => {
    const publisher = publisherFor("test", language, "JUnit");
    expect(publisher.inputs).toMatchObject({
      testResultsFormat: "JUnit",
      testResultsFiles: expect.stringContaining(reports),
      searchFolder: "$(selfRepositoryPath)${{ parameters.PackagePath }}",
      mergeTestResults: true,
      failTaskOnFailedTests: true,
      failTaskOnFailureToPublishResults: true,
      failTaskOnMissingResultsFile: true,
    });
    expect(publisher.inputs?.testResultsFiles).toContain("test-results.xml");

    const steps = languageSteps("test", language);
    const scriptIndex = steps.findIndex((step) => step.displayName === "Run test script");
    const publisherIndex = steps.findIndex(
      (step) => step.task === "PublishTestResults@2" && step.inputs?.testResultsFormat === "JUnit",
    );
    expect(scriptIndex).toBeGreaterThanOrEqual(0);
    expect(publisherIndex).toBe(scriptIndex + 1);
  });

  it("selects the actual testing mode for each emitter", () => {
    const { steps } = loadTemplate("./templates/steps/test-step.yml");
    const publisher = steps.find(
      (step) => step.task === "PublishTestResults@2" && step.inputs?.testResultsFormat === "JUnit",
    );
    expect(publisher).toMatchObject({
      "${{ if eq(parameters.LanguageShortName, 'python') }}": {
        condition:
          "and(succeededOrFailed(), contains('${{ parameters.TestArgs }}', '-GenerationChecks'))",
      },
      "${{ elseif eq(parameters.LanguageShortName, 'java') }}": {
        condition:
          "and(succeededOrFailed(), or(contains('${{ parameters.TestArgs }}', '-UnitTests'), contains('${{ parameters.TestArgs }}', '-GenerationChecks')))",
      },
      "${{ else }}": {
        condition: "and(succeededOrFailed(), contains('${{ parameters.TestArgs }}', '-UnitTests'))",
      },
    });
  });

  it.each([
    { language: "java", args: "-UnitTests", expected: true },
    { language: "java", args: "-GenerationChecks", expected: true },
    { language: "csharp", args: "-UnitTests", expected: true },
    { language: "csharp", args: "-GenerationChecks", expected: false },
    { language: "python", args: "-UnitTests", expected: false },
    { language: "python", args: "-GenerationChecks", expected: true },
  ])(
    "publishes only test-producing $language $args jobs, including failures",
    ({ language, args, expected }) => {
      const publisher = publisherFor("test", language, "JUnit");
      for (const outcome of ["succeeded", "failed", "canceled"]) {
        expect(shouldPublish(publisher, language, args, outcome)).toBe(
          outcome === "canceled" ? false : expected,
        );
      }
    },
  );

  it("publishes C# generator and Spector TRX results after failures", () => {
    const publisher = publisherFor("test", "csharp", "VSTest");
    expect(publisher).toMatchObject({
      condition: "and(succeededOrFailed(), contains('${{ parameters.TestArgs }}', '-UnitTests'))",
      inputs: {
        testResultsFormat: "VSTest",
        testResultsFiles: "generator/**/TestResults/*.trx",
        searchFolder: "$(selfRepositoryPath)${{ parameters.PackagePath }}",
        mergeTestResults: true,
        failTaskOnFailedTests: true,
        failTaskOnFailureToPublishResults: true,
        failTaskOnMissingResultsFile: true,
      },
    });
    expect(shouldPublish(publisher, "csharp", "-UnitTests", "failed")).toBe(true);
    expect(shouldPublish(publisher, "csharp", "-GenerationChecks", "succeeded")).toBe(false);
  });

  it("enables JUnit output for C# emitter tests", () => {
    expect(readSource("http-client-csharp/eng/scripts/Test-Packages.ps1")).toContain(
      "npm run test:emitter -- --reporter=default --reporter=junit",
    );
  });

  it("enables TRX output for both C# test invocations", () => {
    expect(readSource("http-client-csharp/eng/scripts/Test-Packages.ps1")).toContain(
      "dotnet test ./generator --logger trx",
    );
    expect(readSource("http-client-csharp/eng/scripts/Get-Spector-Coverage.ps1")).toContain(
      "dotnet test $spectorCsproj --logger trx",
    );
  });

  it.each([
    { tfBuild: "True", reporters: ["default", "junit"] },
    { tfBuild: undefined, reporters: undefined },
  ])("selects Python emitter reporters with TF_BUILD=$tfBuild", async ({ tfBuild, reporters }) => {
    vi.stubEnv("TF_BUILD", tfBuild);
    vi.resetModules();
    try {
      const config: { test: { reporters?: unknown; outputFile?: unknown } } = (
        await import(
          new URL("../../../packages/http-client-python/emitter/vitest.config.ts", import.meta.url)
            .href
        )
      ).default;
      expect(config.test.reporters).toEqual(reporters);
      expect(config.test.outputFile).toEqual({ junit: "./test-results.xml" });
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("isolates pytest reports for parallel tox environments", () => {
    const commands = readSource("http-client-python/tests/tox.ini")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("pytest "));
    expect(commands).toHaveLength(3);
    for (const command of commands) {
      expect(command).toContain("--junitxml={tox_root}/test-results/{envname}.xml");
    }
  });

  it("runs Java emitter tests with console and JUnit reporters", () => {
    const script = readSource("http-client-java/eng/scripts/Test-Packages.ps1");

    expect(script).toContain("npm run test:emitter");
    expect(script).toContain("-- --reporter=default --reporter=junit");
  });
});
