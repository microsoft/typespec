import { Octokit as OctokitCore } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import pc from "picocolors";
import { format, resolveConfig } from "prettier";
import { inspect } from "util";
import { RepoConfig } from "./types.js";

const Octokit = OctokitCore.plugin(paginateGraphQL).plugin(restEndpointMethods);
type Octokit = InstanceType<typeof Octokit>;

const labelFileRelative = "eng/common/config/labels.ts";
const contributingFile = resolve(process.cwd(), "CONTRIBUTING.md");
const magicComment = {
  start: "<!-- LABEL GENERATED REF START -->",
  end: "<!-- LABEL GENERATED REF END -->",
} as const;

export interface SyncLabelsOptions {
  readonly github?: boolean;
  readonly check?: boolean;
  readonly dryRun?: boolean;
}

export async function syncLabelsDefinitions(config: RepoConfig, options: SyncLabelsOptions = {}) {
  const labels = loadLabels(config);
  logLabelConfig(labels);

  if (options.github) {
    await syncGithubLabels(config, labels.labels, {
      dryRun: options.dryRun,
      check: options.check,
    });
  }

  updateContributingFile(labels, {
    dryRun: options.dryRun,
    check: options.check,
  });
}

interface LabelsResolvedConfig {
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

interface ActionOptions {
  readonly dryRun?: boolean;
  readonly check?: boolean;
}

function loadLabels(config: RepoConfig): LabelsResolvedConfig {
  const data = config.labels;
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

function logLabelConfig(config: LabelsResolvedConfig) {
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

async function syncGithubLabels(config: RepoConfig, labels: Label[], options: ActionOptions = {}) {
  if (!options.dryRun && !process.env.GITHUB_TOKEN && !options.check) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required when not running in dry-run mode or check mode.",
    );
  }
  const octokit = new Octokit(
    process.env.GITHUB_TOKEN ? { auth: `token ${process.env.GITHUB_TOKEN}` } : {},
  );

  const existingLabels = await fetchAllLabels(octokit, config.repo);
  logLabels("Existing github labels", existingLabels);
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
  logLabels("Labels to delete", labelsToDelete);
  console.log("");

  if (options.check) {
    if (labelsToDelete.length > 0) {
      checkLabelsToDelete(labelsToDelete);
    }
  } else {
    logAction("Applying changes", options);
    await updateLabels(config, octokit, labelToUpdate, options);
    await createLabels(config, octokit, labelsToCreate, options);
    await deleteLabels(config, octokit, labelsToDelete, options);
    logAction("Done applying changes", options);
  }
}

async function checkLabelsToDelete(labels: GithubLabel[]) {
  console.log("Checking labels that will be deleted don't have any issues assigned.");
  let hasError = false;
  for (const label of labels) {
    if (label.issues.totalCount > 0) {
      console.log(
        pc.red(
          `Label ${label.name} has ${label.issues.totalCount} issues assigned to it, make sure to rename the label manually first to not lose assignment.`,
        ),
      );
      hasError = true;
    }
  }
  if (hasError) {
    process.exit(1);
  } else {
    console.log(pc.green(`Labels looks good to delete.`));
  }
}

interface GithubLabel {
  readonly name: string;
  readonly color: string;
  readonly description: string;
  readonly issues: { readonly totalCount: number };
}
async function fetchAllLabels(octokit: Octokit, repo: RepoConfig["repo"]): Promise<GithubLabel[]> {
  const { repository } = await octokit.graphql.paginate(
    `query paginate($cursor: String, $owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        labels(first: 100, after: $cursor) {
          nodes {
            color
            name
            description
            issues(filterBy: {states: OPEN}) {
              totalCount
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }`,
    {
      owner: repo.owner,
      repo: repo.repo,
    },
  );

  return repository.labels.nodes;
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
async function createLabels(
  config: RepoConfig,
  octokit: Octokit,
  labels: Label[],
  options: ActionOptions,
) {
  for (const label of labels) {
    await doAction(
      () => octokit.rest.issues.createLabel({ ...config.repo, ...label }),
      `Created label ${label.name}, color: ${label.color}, description: ${label.description}`,
      options,
    );
  }
}
async function updateLabels(
  config: RepoConfig,
  octokit: Octokit,
  labels: Label[],
  options: ActionOptions,
) {
  for (const label of labels) {
    await doAction(
      () => octokit.rest.issues.updateLabel({ ...config.repo, ...label }),
      `Updated label ${label.name}, color: ${label.color}, description: ${label.description}`,
      options,
    );
  }
}
async function deleteLabels(
  config: RepoConfig,
  octokit: Octokit,
  labels: GithubLabel[],
  options: ActionOptions,
) {
  checkLabelsToDelete(labels);

  for (const label of labels) {
    await doAction(
      () => octokit.rest.issues.deleteLabel({ ...config.repo, name: label.name }),
      `Deleted label ${label.name}`,
      options,
    );
    console.log(`Deleted label ${label.name}`);
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

async function updateContributingFile(labels: LabelsResolvedConfig, options: ActionOptions) {
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
  if (options.check) {
    if (formatted === content) {
      console.log(pc.green("CONTRIBUTING.md is up to date."));
    } else {
      console.log(
        pc.red(
          "CONTRIBUTING.md file label section is not up to date, run pnpm sync-labels to update it",
        ),
      );
      process.exit(1);
    }
  } else {
    await doAction(
      () => writeFile(contributingFile, formatted),
      "Updated contributing file",
      options,
    );
  }
}

function generateLabelsDoc(labels: LabelsResolvedConfig) {
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
