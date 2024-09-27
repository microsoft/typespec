import yargs from "yargs";
import { generateThirdPartyNotice } from "./generate-third-party-notice.js";
import { bumpVersionsForPR, bumpVersionsForPrerelease } from "./prerelease.js";

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
    ).argv;
}
