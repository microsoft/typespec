import { PYGEN_WHEEL_FILENAME } from "./constants.js";

export const generatorWheelUrl = new URL(
  `../../generator/dist/${PYGEN_WHEEL_FILENAME}`,
  import.meta.url,
).href;
