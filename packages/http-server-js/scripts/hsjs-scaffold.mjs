import { main } from "../dist/src/scripts/bin.mjs";

main().catch(function onScaffoldError(error) {
  console.error(error);
  process.exit(1);
});
