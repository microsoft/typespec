import { parseArgs } from "./dist/tsp-output/@typespec/efnext-cli-sketch/TodoCLI.js";

parseArgs(process.argv, {
  version: "1.0.0",
  create(todoItem, color) {
    console.log("creating todo item", todoItem);
  },
  finish(id) {},
  TodoCLI() {},
});
