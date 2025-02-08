import { navigateProgram, Type, type Program } from "../core/index.js";

export function freezeGraph(program: Program) {
  function freeze(type: Type) {
    Object.freeze(type);
  }
  navigateProgram(program, {
    templateParameter: freeze,
    scalar: freeze,
    model: freeze,
    modelProperty: freeze,
    interface: freeze,
    enum: freeze,
    enumMember: freeze,
    namespace: freeze,
    operation: freeze,
    string: freeze,
    number: freeze,
    boolean: freeze,
    tuple: freeze,
    union: freeze,
    unionVariant: freeze,
    intrinsic: freeze,
    function: freeze,
    object: freeze,
    projection: freeze,
  });
}
