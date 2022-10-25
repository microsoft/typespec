import { Program } from "../core/program.js";
import { Decorator, FunctionParameter, FunctionType, Type } from "../core/types.js";

export function getTypeSignature(program: Program, type: Type) {
  const typeKind = type.kind.toLowerCase();
  const name = program.checker.getTypeName(type);
  switch (type.kind) {
    case "Decorator":
      return getDecoratorSignature(program, type);
    case "Function":
      return getFunctionSignature(program, type);
    default:
      return `${typeKind} ${name}`;
  }
}

function getDecoratorSignature(program: Program, type: Decorator) {
  const name = type.name.slice(1);
  const parameters = [type.target, ...type.parameters].map((x) =>
    getFunctionParameterSignature(program, x)
  );
  return `dec ${name}(${parameters.join(", ")})`;
}

function getFunctionSignature(program: Program, type: FunctionType) {
  const parameters = type.parameters.map((x) => getFunctionParameterSignature(program, x));
  return `fn ${type.name}(${parameters.join(", ")})`;
}

function getFunctionParameterSignature(program: Program, parameter: FunctionParameter) {
  const rest = parameter.rest ? "..." : "";
  const optional = parameter.optional ? "?" : "";
  return `${rest}${parameter.name}${optional}: ${program.checker.getTypeName(parameter.type)}`;
}
