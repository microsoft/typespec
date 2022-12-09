#!/usr/bin/env node

/* eslint-disable no-console */
import { migrateCadlFiles } from "./migrate.js";
import { migrateModelToScalar } from "./migrations/v0.38/model-to-scalars.js";
import { findCadlFiles } from "./utils.js";

async function main() {
  const files = await findCadlFiles(process.cwd());
  const result = await migrateCadlFiles(files, migrateModelToScalar);

  if (result.fileChanged.length === 0) {
    console.log("No cadl files migrated, no change detected.");
  } else {
    console.log(`Updated ${result.fileChanged.length} cadl files:`);
    for (const file of result.fileChanged) {
      console.log(` - ${file}`);
    }
    console.log("This is a best effort migration, double check everything was migrated correctly.");
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
