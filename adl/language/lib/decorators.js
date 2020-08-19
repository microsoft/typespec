const desc = new Map();

export function description(program, target, text) {
  desc.set(target, text)
}

export function getDescription(target) {
  return desc.get(target);
}

export function inspectType(program, target, text) {
  if (text) console.log(text);
  console.dir(target);
}