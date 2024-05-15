import { resolve } from "path";
import { stringify } from "yaml";
import { AreaLabels } from "../../config/labels.js";
import { CheckOptions, repoRoot, syncFile } from "../common.js";
import { hasLabel, isAction, labelAdded, or, payloadType } from "./policy.js";

export interface SyncLabelAutomationOptions extends CheckOptions {}

export async function syncLabelAutomation(options: SyncLabelAutomationOptions) {
  await syncTriagePolicy(options);
}

const policyConfig = {
  id: "issues.triage",
  name: "New Issue Assign labels",
  description: "Assign labels to new issues",
  resource: "repository",
  disabled: false,
  configuration: {
    resourceManagementConfiguration: {
      eventResponderTasks: [
        {
          description: "Adds `needs-triage` label for new unassigned issues",
          if: [
            payloadType("Issues"),
            isAction("Opened"),
            {
              not: {
                and: ["isAssignedToSomeone"],
              },
            },
          ],
          then: [
            {
              addLabel: {
                label: "needs-triage",
              },
            },
          ],
        },
        {
          description: "Remove `needs-triage` label when an area label is added",
          if: [
            payloadType("Issues"),
            hasLabel("needs-triage"),
            or(Object.keys(AreaLabels).map((area) => labelAdded(area))),
          ],
          then: [
            {
              removeLabel: {
                label: "needs-triage",
              },
            },
          ],
        },
      ],
    },
  },
};

async function syncTriagePolicy(options: CheckOptions) {
  const content = stringify(policyConfig);
  const filename = resolve(repoRoot, ".github/policies/issues.triage.yml");
  await syncFile(filename, content, options);
}
