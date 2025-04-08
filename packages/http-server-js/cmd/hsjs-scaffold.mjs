import { main } from "../dist/src/scripts/scaffold/bin.mjs";

main().catch(function onScaffoldError(error) {
  console.error(error);
  process.exit(1);
});
