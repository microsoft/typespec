import { Octokit } from "@octokit/rest";
import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";
import { inspect, parseArgs } from "util";
import { parse } from "yaml";

const labelFile = resolve(dirname(fileURLToPath(import.meta.url)), "../labels.yaml");

const repo = {
  owner: "microsoft",
  repo: "typespec",
};
await main();

interface LabelsConfig {
  readonly categories: LabelCategory[];
  readonly labels: Label[];
}

interface LabelCategory {
  readonly name: string;
  readonly description: string;
  readonly labels: Label[];
}

interface Label {
  readonly name: string;
  readonly color: string;
  readonly description: string;
}

async function main() {
  const options = parseArgs({
    args: process.argv.slice(2),
    options: {
      "dry-run": { type: "boolean" },
      "update-github-labels": { type: "boolean" },
    },
  });
  const content = await readFile(labelFile, "utf8");
  const labels = loadLabels(content);
  logLabelConfig(labels);

  if (options.values["update-github-labels"]) {
    await updateGithubLabels(labels.labels, { dryRun: options.values["dry-run"] });
  }
}

function loadLabels(yamlContent: string): LabelsConfig {
  const data: Record<
    string,
    { description: string; labels: Record<string, { color: string; description: string }> }
  > = parse(yamlContent);
  const labels = [];
  const categories: LabelCategory[] = [];
  for (const [categoryName, { description, labels: labelMap }] of Object.entries(data)) {
    const categoryLabels = Object.entries(labelMap).map(([name, data]) => ({ name, ...data }));
    const category = { name: categoryName, description, labels: categoryLabels };
    categories.push(category);
    for (const label of categoryLabels) {
      validateLabel(label);
      labels.push(label);
    }
  }
  return { labels, categories };
}

function logLabelConfig(config: LabelsConfig) {
  console.log("Label config:");
  const max = config.labels.reduce((max, label) => Math.max(max, label.name.length), 0);
  for (const category of config.categories) {
    console.log(`  ${pc.green(category.name)} ${pc.gray(category.description)}`);
    for (const label of category.labels) {
      console.log(`    ${prettyLabel(label, max)}`);
    }
    console.log("");
  }
  console.log("");
}

function logLabels(message: string, labels: Label[]) {
  if (labels.length === 0) {
    console.log(message, pc.cyan("none"));
    return;
  }
  console.log(message);
  const max = labels.reduce((max, label) => Math.max(max, label.name.length), 0);
  for (const label of labels) {
    console.log(`  ${prettyLabel(label, max)}`);
  }
  console.log("");
}

function prettyLabel(label: Label, padEnd: number = 0) {
  return `${pc.cyan(label.name.padEnd(padEnd))} ${pc.blue(`#${label.color}`)} ${pc.gray(label.description)}`;
}

interface UpdateGithubLabelOptions {
  readonly dryRun?: boolean;
}

async function updateGithubLabels(labels: Label[], options: UpdateGithubLabelOptions = {}) {
  if (!options.dryRun && !process.env.GITHUB_TOKEN) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required when not running in dry-run mode"
    );
  }
  const octokit = new Octokit(
    process.env.GITHUB_TOKEN ? { auth: `token ${process.env.GITHUB_TOKEN}` } : {}
  );

  const existingLabels = await fetchAllLabels(octokit);
  logLabels("Existing github labels", existingLabels as any);
  const labelToUpdate: Label[] = [];
  const labelsToCreate: Label[] = [];
  const exitingLabelMap = new Map(existingLabels.map((label) => [label.name, label]));
  for (const label of labels) {
    const existingLabel = exitingLabelMap.get(label.name);
    if (existingLabel) {
      if (existingLabel.color !== label.color || existingLabel.description !== label.description) {
        labelToUpdate.push(label);
      }
    } else {
      labelsToCreate.push(label);
    }
    exitingLabelMap.delete(label.name);
  }
  const labelsToDelete = Array.from(exitingLabelMap.values());
  logLabels("Labels to update", labelToUpdate);
  logLabels("Labels to create", labelsToCreate);
  logLabels("Labels to delete", labelsToDelete as any);
  console.log("");

  logAction("Applying changes", options);
  await updateLabels(octokit, labelToUpdate, options);
  await createLabels(octokit, labelsToCreate, options);
  await deleteLabels(
    octokit,
    labelsToDelete.map((x) => x.name),
    options
  );
  logAction("Done applying changes", options);
}

async function fetchAllLabels(octokit: Octokit) {
  const result = await octokit.paginate(octokit.rest.issues.listLabelsForRepo, repo);
  return result;
}

function logAction(message: string, options: UpdateGithubLabelOptions) {
  const prefix = options.dryRun ? `${pc.gray("[dry-run]")} ` : "";
  console.log(prefix + message);
}

async function doAction(
  action: () => Promise<unknown>,
  label: string,
  options: UpdateGithubLabelOptions
) {
  if (!options.dryRun) {
    await action();
  }
  logAction(label, options);
}
async function createLabels(octokit: Octokit, labels: Label[], options: UpdateGithubLabelOptions) {
  for (const label of labels) {
    await doAction(
      () => octokit.rest.issues.createLabel({ ...repo, ...label }),
      `Created label ${label.name}, color: ${label.color}, description: ${label.description}`,
      options
    );
  }
}
async function updateLabels(octokit: Octokit, labels: Label[], options: UpdateGithubLabelOptions) {
  for (const label of labels) {
    await doAction(
      () => octokit.rest.issues.updateLabel({ ...repo, ...label }),
      `Updated label ${label.name}, color: ${label.color}, description: ${label.description}`,
      options
    );
  }
}
async function deleteLabels(octokit: Octokit, labels: string[], options: UpdateGithubLabelOptions) {
  for (const name of labels) {
    await doAction(
      () => octokit.rest.issues.deleteLabel({ ...repo, name }),
      `Deleted label ${name}`,
      options
    );
    console.log(`Deleted label ${name}`);
  }
}

function validateLabel(label: Label) {
  if (label.name === undefined) {
    throw new Error(`Label missing name: ${inspect(label)}`);
  }
  if (label.color === undefined) {
    throw new Error(`Label missing color: ${inspect(label)}`);
  }
  if (label.description === undefined) {
    throw new Error(`Label missing description: ${inspect(label)}`);
  }
}
