import { refkey } from "@alloy-js/core";
import { Program, Type } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import {
  ClientNameDecorator,
  ClientNameOptions,
} from "../../generated-defs/TypeSpec.HttpClient.js";
import { createStateSymbol } from "../lib.js";

export const explicitClientNameStateSymbol = createStateSymbol("client-name");
const [_getClientName, _setClientName] = useStateMap<Type, string>(explicitClientNameStateSymbol);

export function setClientName(
  program: Program,
  type: Type,
  scope: string | undefined,
  name: string,
): void {
  const typeKey = refkey(type, scope);
  _setClientName(program, typeKey as any, name);
}

export function getClientNameOverride(
  program: Program,
  type: Type & { name: string },
  scope: string | undefined,
): string | undefined {
  const typeKey = refkey(type, scope);
  return _getClientName(program, typeKey as any);
}

export const $clientName: ClientNameDecorator = (
  context,
  target,
  name,
  options: ClientNameOptions = {},
) => {
  setClientName(context.program, target, options.emitterScope, name);
};
