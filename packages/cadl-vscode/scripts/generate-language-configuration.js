// @ts-check
import { CadlLanguageConfiguration } from "@cadl-lang/compiler";
import { writeFile } from "fs/promises";

main().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});

async function main() {
  const content = JSON.stringify(CadlLanguageConfiguration, null, 2);
  await writeFile("language-configuration.json", content);
}
