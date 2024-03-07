// pretend I just typed this file from scratch... and saved it
import { $doc } from "@typespec/compiler";

export function $fancyDoc(program, target, text) {
  const str = `<blink>${text.value}</blink>`;
  $doc(program, target, str);
}

export function $evenFancierDoc(program, target, ...args) {
  args[0] = `<marquee><blink>${args[0].value}</blink></marquee>`;
  $doc(program, target, ...args);
}
