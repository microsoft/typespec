import type { Program, Type } from "@typespec/compiler";

import { stateKeys } from "./lib.js";

function stateFns<T = any>(key: symbol) {
  return {
    has(context: { program: Program }, type: Type) {
      return context.program.stateMap(key).has(type);
    },
    get(context: { program: Program }, type: Type) {
      return context.program.stateMap(key).get(type) as T;
    },
    set(context: { program: Program }, type: Type, value?: T) {
      context.program.stateMap(key).set(type, value ?? true);
    },
    add(context: { program: Program }, type: Type) {
      context.program.stateMap(key).set(type, true);
    },
    keys(context: { program: Program }) {
      return [...context.program.stateMap(key).keys()];
    },
  };
}

const shortStateFns = stateFns<string>(stateKeys.short);
export const $short = shortStateFns.set;
export const hasShortName = shortStateFns.has;
export const getShortName = shortStateFns.get;

const positionalStateFns = stateFns<boolean>(stateKeys.positional);
export const isPositional = positionalStateFns.has;
export const $positional = positionalStateFns.set;

const invertableStateFns = stateFns<boolean>(stateKeys.invertable);
export const isInvertable = invertableStateFns.has;
export const $invertable = invertableStateFns.set;

const cliStateFns = stateFns<boolean>(stateKeys.cli);
export const isCli = cliStateFns.has;
export const listClis = cliStateFns.keys;
export const $cli = cliStateFns.add;

export const namespace = "TypeSpecCLI";
