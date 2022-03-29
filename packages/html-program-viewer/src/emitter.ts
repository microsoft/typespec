import { Program } from "@cadl-lang/compiler";
import { renderProgram } from "./ui.js";

export function $onEmit(program: Program) {
  console.log("Will emit.");
  console.log(renderProgram(program));
}
