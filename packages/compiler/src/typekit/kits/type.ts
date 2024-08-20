import { defineKit } from "../define-kit.js";
import { boolean } from "./boolean.js";
import { numeric } from "./numeric.js";
import { scalar } from "./scalar.js";
import { string } from "./string.js";

export const type = defineKit({
  numeric,
  string,
  boolean,
  scalar,
});
