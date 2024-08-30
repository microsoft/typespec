// Contains all intrinsic data setter or getter
// Anything that the TypeSpec check might should be here.

import { Type, type Program } from "@typespec/compiler";

function createXmlStateSymbol(name: string) {
  return Symbol.for(`@typespec/xml/${name}`);
}

const XmlStateKeys = {
  attribute: createXmlStateSymbol("attribute"),
  unwrapped: createXmlStateSymbol("unwrapped"),
  nsDeclaration: createXmlStateSymbol("nsDeclaration"),
};

// #region @xml object
export function isXmlAttribute(program: Program, target: Type): boolean {
  return program.stateSet(XmlStateKeys.attribute).has(target);
}
export function isXmlUnwrapped(program: Program, target: Type): boolean {
  return program.stateSet(XmlStateKeys.unwrapped).has(target);
}
export function getXmlNs(program: Program, target: Type): XmlNamespace | undefined {
  return program.stateMap(XmlStateKeys.nsDeclaration).get(target);
}
export interface XmlNamespace {
  readonly namespace: string;
  readonly prefix: string;
}
// #endregion @xml object
