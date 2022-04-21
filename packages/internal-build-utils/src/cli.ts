import yargs from "yargs";
import { generateThirdPartyNotice } from "./generate-third-party-notice.js";
import { bumpVersionsForPrerelease } from "./prerelease.js";

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

async function main() {
  await yargs(process.argv.slice(2))
    .scriptName("cadl-build-tool")
    .help()
    .strict()
    .command(
      "generate-third-party-notices",
      "Generate the third party notice",
      () => {},
      () => generateThirdPartyNotice()
    )
    .command(
      "bump-version-preview <workspaceRoot>",
      "Bump all package version for the preview",
      (cmd) =>
        cmd.positional("workspaceRoot", {
          type: "string",
          demandOption: true,
        }),
      (args) => bumpVersionsForPrerelease(args.workspaceRoot)
    ).argv;
}
