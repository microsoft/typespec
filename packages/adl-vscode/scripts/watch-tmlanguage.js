import watch from "watch";
import { runWatch } from "../../../eng/scripts/helpers.js";
import { basename } from "path";

runWatch(watch, "dist-dev", "node", ["dist-dev/tmlanguage.js"], {
  filter: (file) => basename(file) === "tmlanguage.js",
});
