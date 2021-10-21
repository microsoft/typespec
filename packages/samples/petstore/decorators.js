// pretend I just typed this file from scratch... and saved it
import { $doc } from "@cadl-lang/compiler";

export function $fancyDoc(program, target, text) {
  text = `<blink>${text}</blink>`;
  $doc(program, target, text);
}

export function $evenFancierDoc(program, target, ...args) {
  args[0] = `<marquee><blink>${args[0]}</blink></marquee>`;
  $doc(program, target, ...args);
}
