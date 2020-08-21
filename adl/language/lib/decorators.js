const desc = new Map();

export function description(program, target, text) {
  desc.set(target, text);
}

export function getDescription(target) {
  return desc.get(target);
}

export function inspectType(program, target, text) {
  if (text) console.log(text);
  console.dir(target);
}

export function inspectTypeName(program, target, text) {
  if (text) console.log(text);
  console.log(program.checker.getTypeName(target));
}

const intrinsics = new Set();
export function intrinsic(program, target) {
  intrinsics.add(target);
}

export function isIntrinsic(target) {
  return intrinsics.has(target);
}
