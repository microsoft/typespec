import yargs from "yargs";
import { generateThirdPartyNotice } from "./generate-third-party-notice.js";
import { bumpVersionsForPR, bumpVersionsForPrerelease } from "./prerelease.js";
import { createAzureSdkForNetPr } from "./create-azure-sdk-for-net-pr.js";

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

async function main() {
  await yargs(process.argv.slice(2))
    .scriptName("typespec-build-tool")
    .help()
    .strict()
    .command(
      "generate-third-party-notices",
      "Generate the third party notice",
      () => {},
      () => generateThirdPartyNotice(),
    )
    .command(
      "bump-version-preview <workspaceRoots...>",
      "Bump all package version for the preview",
      (cmd) =>
        cmd.positional("workspaceRoots", {
          type: "string",
          array: true,
          demandOption: true,
        }),
      (args) => bumpVersionsForPrerelease(args.workspaceRoots),
    )
    .command(
      "bump-version-pr <workspaceRoot>",
      "Bump all package version for the PR",
      (cmd) =>
        cmd
          .positional("workspaceRoot", {
            type: "string",
            demandOption: true,
          })
          .option("pr", {
            type: "number",
            demandOption: true,
          })
          .option("buildNumber", {
            type: "string",
            demandOption: true,
          }),
      (args) => bumpVersionsForPR(args.workspaceRoot, args.pr, args.buildNumber),
    )
    .command(
      "create-azure-sdk-for-net-pr",
      "Create PR in azure-sdk-for-net to update http-client-csharp dependency",
      (cmd) =>
        cmd
          .option("packagePath", {
            type: "string",
            description: "Path to the http-client-csharp package",
            demandOption: true,
          })
          .option("pullRequestUrl", {
            type: "string",
            description: "URL of the PR in typespec repository",
            demandOption: true,
          })
          .option("packageUrl", {
            type: "string",
            description: "URL to the published NuGet package",
            demandOption: true,
          })
          .option("githubToken", {
            type: "string",
            description: "GitHub token for authentication",
            demandOption: true,
          })
          .option("branchName", {
            type: "string",
            description: "Branch name to create in azure-sdk-for-net",
          }),
      (args) => createAzureSdkForNetPr(args),
    ).argv;
}
