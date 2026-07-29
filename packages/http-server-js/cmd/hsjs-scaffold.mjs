#!/usr/bin/env node

import { main } from "../dist/src/scripts/scaffold/bin.mjs";

main().catch(function onScaffoldError(error) {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
