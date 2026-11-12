import yargs from "yargs";
import { generateThirdPartyNotice } from "./generate-third-party-notice.js";

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
    ).argv;
}
