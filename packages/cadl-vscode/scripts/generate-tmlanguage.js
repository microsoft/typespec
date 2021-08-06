import { createRequire } from "module";
import { resolve } from "path";

const require = createRequire(import.meta.url);
const script = resolve("dist-dev/tmlanguage.js");

require(script)
  .main()
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
