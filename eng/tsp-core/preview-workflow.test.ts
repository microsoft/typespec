import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parse } from "yaml";

interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
}

interface Workflow {
  jobs: Record<string, { steps: Step[] }>;
}

function loadWorkflow(name: string): Workflow {
  return parse(
    readFileSync(new URL(`../../.github/workflows/${name}.yml`, import.meta.url), "utf8"),
  );
}

it("provisions Python and patched pip before preview package installation", () => {
  const steps = loadWorkflow("preview").jobs.preview.steps;
  const python = steps.findIndex((step) => step.uses?.startsWith("actions/setup-python@"));
  const pip = steps.findIndex((step) => step.name === "Upgrade pip");
  const install = steps.findIndex((step) => step.name === "Install dependencies");

  expect(python).toBeGreaterThanOrEqual(0);
  expect(pip).toBeGreaterThan(python);
  expect(install).toBeGreaterThan(pip);

  const emitterPython = loadWorkflow("ci-python").jobs.build.steps.find((step) =>
    step.uses?.startsWith("actions/setup-python@"),
  );
  expect(steps[python].with?.["python-version"]).toBe(emitterPython?.with?.["python-version"]);

  const packageManager = readFileSync(
    new URL(
      "../../packages/http-client-python/eng/scripts/setup/package_manager.py",
      import.meta.url,
    ),
    "utf8",
  );
  const pin = packageManager.match(/^PIP_VERSION = "([^"]+)"$/m);
  expect(pin).not.toBeNull();
  expect(steps[pip].run).toBe(`python -m pip install --upgrade pip==${pin?.[1]}`);
});

it.each(Object.entries(loadWorkflow("python-integration").jobs))(
  "upgrades inherited Python package managers before integration setup in %s",
  (_name, { steps }) => {
    const packageManager = readFileSync(
      new URL(
        "../../packages/http-client-python/eng/scripts/setup/package_manager.py",
        import.meta.url,
      ),
      "utf8",
    );
    const pip = packageManager.match(/^PIP_VERSION = "([^"]+)"$/m)?.[1];
    const uv = packageManager
      .match(/"uv": \((\d+), (\d+), (\d+)\)/)
      ?.slice(1)
      .join(".");
    expect(pip).toBeDefined();
    expect(uv).toBeDefined();

    const setup = steps.findIndex((step) => step.uses === "./.github/actions/setup-python");
    const upgrade = steps.findIndex((step) => step.name === "Upgrade Python package managers");
    const install = steps.findIndex(
      (step) =>
        step.name === "Build and pack http-client-python from PR" ||
        step.name === "Install dependencies",
    );

    expect(setup).toBeGreaterThanOrEqual(0);
    expect(upgrade).toBeGreaterThan(setup);
    expect(install).toBeGreaterThan(upgrade);
    expect(steps[upgrade].run?.trim().split("\n")).toEqual([
      `python -m pip install --upgrade pip==${pip} uv==${uv}`,
      `python -c 'import sysconfig; print(sysconfig.get_path("scripts"))' >> "$GITHUB_PATH"`,
    ]);
  },
);
