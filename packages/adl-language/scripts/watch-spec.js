import watch from "watch";
import { runWatch } from "../../../eng/scripts/helpers.js";

runWatch(watch, "src", "node", [
  "node_modules/ecmarkup/bin/ecmarkup.js",
  "src/spec.emu.html",
  "../../docs/spec.html",
]);
