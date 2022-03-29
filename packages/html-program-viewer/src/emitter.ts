import { Program } from "@cadl-lang/compiler";

export function $onEmit(program: Program) {
  console.log("Will emit.");
}
