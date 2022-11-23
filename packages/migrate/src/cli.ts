import { migrateCadlFiles } from "./migrate.js";
import { migrateModelToScalar } from "./migrations/v0.38/model-to-scalars.js";
import { findCadlFiles } from "./utils.js";

async function main() {
  const files = await findCadlFiles(process.cwd());
  await migrateCadlFiles(await import("@cadl-lang/compiler-v0.36"), files, migrateModelToScalar);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
