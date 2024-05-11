import { Octokit } from "@octokit/rest";
import { readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import pc from "picocolors";
import { format, resolveConfig } from "prettier";
import { fileURLToPath } from "url";
import { inspect, parseArgs } from "util";
import { parse } from "yaml";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const labelFileRelative = "eng/common/labels.yaml";
const labelFile = resolve(repoRoot, labelFileRelative);
const contributingFile = resolve(repoRoot, "CONTRIBUTING.md");
const magicComment = {
  start: "<!-- LABEL GENERATED REF START -->",
  end: "<!-- LABEL GENERATED REF END -->",
} as const;

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

  updateContributingFile(labels, { dryRun: options.values["dry-run"] });
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

interface ActionOptions {
  readonly dryRun?: boolean;
}

async function updateGithubLabels(labels: Label[], options: ActionOptions = {}) {
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

function logAction(message: string, options: ActionOptions) {
  const prefix = options.dryRun ? `${pc.gray("[dry-run]")} ` : "";
  console.log(prefix + message);
}

async function doAction(action: () => Promise<unknown>, label: string, options: ActionOptions) {
  if (!options.dryRun) {
    await action();
  }
  logAction(label, options);
}
async function createLabels(octokit: Octokit, labels: Label[], options: ActionOptions) {
  for (const label of labels) {
    await doAction(
      () => octokit.rest.issues.createLabel({ ...repo, ...label }),
      `Created label ${label.name}, color: ${label.color}, description: ${label.description}`,
      options
    );
  }
}
async function updateLabels(octokit: Octokit, labels: Label[], options: ActionOptions) {
  for (const label of labels) {
    await doAction(
      () => octokit.rest.issues.updateLabel({ ...repo, ...label }),
      `Updated label ${label.name}, color: ${label.color}, description: ${label.description}`,
      options
    );
  }
}
async function deleteLabels(octokit: Octokit, labels: string[], options: ActionOptions) {
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

async function updateContributingFile(labels: LabelsConfig, options: ActionOptions) {
  console.log("Updating contributing file", contributingFile);
  const content = await readFile(contributingFile, "utf8");
  const startIndex = content.indexOf(magicComment.start);
  const endIndex = content.indexOf(magicComment.end);
  if (startIndex === -1) {
    throw new Error(`Could not find start comment "${magicComment.start}" in ${contributingFile}`);
  }
  const start = content.slice(0, startIndex + magicComment.start.length);
  const end =
    endIndex === -1
      ? magicComment.end + "\n" + content.slice(startIndex + magicComment.start.length)
      : content.slice(endIndex);

  const warning = `<!-- DO NOT EDIT: This section is automatically generated by eng/common/scripts/sync-labels.ts, update ${labelFileRelative} run pnpm sync-labels to update -->`;
  const newContent = `${start}\n${warning}\n${generateLabelsDoc(labels)}\n${end}`;
  const { plugins, ...prettierOptions } = (await resolveConfig(contributingFile)) ?? {};
  const formatted = await format(newContent, { ...prettierOptions, filepath: contributingFile });
  await doAction(
    () => writeFile(contributingFile, formatted),
    "Updated contributing file",
    options
  );
}

function generateLabelsDoc(labels: LabelsConfig) {
  return [
    "### Labels reference",
    ...labels.categories.map((category) => {
      return `#### ${category.name}\n\n${category.description}\n\n${table([
        ["Name", "Color", "Description"],
        ...category.labels.map((label) => [
          inlinecode(label.name),
          `#${label.color}`,
          label.description,
        ]),
      ])}`;
    }),
  ].join("\n");
}

// #region markdown helpers
export function inlinecode(code: string) {
  return "`" + code + "`";
}
function escapeMarkdownTable(text: string) {
  return text.replace(/([^\\])(\|)/g, "$1\\$2").replace(/\n/g, "<br />");
}

function table([header, ...rows]: string[][]) {
  const renderRow = (row: string[]): string => `| ${row.map(escapeMarkdownTable).join(" | ")} |`;

  return [
    renderRow(header),
    "|" + header.map((x) => "-".repeat(x.length + 2)).join("|") + "|",
    ...rows.map(renderRow),
  ].join("\n");
}
// #endregion
