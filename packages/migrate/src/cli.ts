#!/usr/bin/env node

/* eslint-disable no-console */
import { migrateTypeSpecFiles } from "./migrate.js";
import { migrateModelToScalar } from "./migrations/v0.38/model-to-scalars.js";
import { findTypeSpecFiles } from "./utils.js";

async function main() {
  const files = await findTypeSpecFiles(process.cwd());
  const result = await migrateTypeSpecFiles(files, migrateModelToScalar);

  if (result.fileChanged.length === 0) {
    console.log("No typespec files migrated, no change detected.");
  } else {
    console.log(`Updated ${result.fileChanged.length} typespec files:`);
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
