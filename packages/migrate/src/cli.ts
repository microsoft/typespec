#!/usr/bin/env node

/* eslint-disable no-console */
import { migrateTypeSpecFiles } from "./migration-impl.js";
import { migrateModelToScalar } from "./migrations/v0.38/model-to-scalars.js";
import { findTypeSpecFiles } from "./utils.js";

async function main() {
  let changesMake = false;
  // Locate current package.json

  // Iterate thru migration configuration and invoke

  const files = await findTypeSpecFiles(process.cwd());
  const result = await migrateTypeSpecFiles(files, migrateModelToScalar);

  if (result.fileChanged.length > 0) {
    changesMake = true;
    console.log(`Updated ${result.fileChanged.length} typespec files:`);
    for (const file of result.fileChanged) {
      console.log(` - ${file}`);
    }
  }

  if (changesMake) {
    console.log("This is a best effort migration, double check everything was migrated correctly.");
  } else {
    console.log("No typespec files migrated, no change detected.");
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
