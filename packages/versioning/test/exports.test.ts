import { expect, it } from "vitest";
import * as versioning from "../src/index.js";

it("does not export internal optionality helpers", () => {
  expect(versioning).not.toHaveProperty("hasChangedOptionality");
});
