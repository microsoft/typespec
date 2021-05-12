// Simple smoke test verifying the plugin is able to be loaded via prettier.
const prettier = require("prettier");

const result = prettier.format("alias Foo   = string", {
  parser: "adl",
  plugins: ["."],
});

if (result !== "alias Foo = string;") {
  throw new Error("Failed to format as expeceted");
}
