import { createNamedContext, shallowReactive, useContext } from "@alloy-js/core";
import type { Model, Program } from "@typespec/compiler";

export type TspdContext = {
  program: Program;
  localTypes: Model[];
  addLocalType: (type: Model) => void;
};

export const TspdContext = createNamedContext<TspdContext>("TspdContext");

export function useTspd() {
  const context = useContext(TspdContext)!;

  if (!context) {
    throw new Error(
      "TspdContext is not set. Make sure the component is wrapped in TspdContext.Provider or the emitter framework Output component.",
    );
  }

  return context as TspdContext;
}

export function createTspdContext(program: Program): TspdContext {
  const localTypes = shallowReactive<Model[]>([]);
  return {
    program,
    localTypes,
    addLocalType(type: Model) {
      if (localTypes.some((t) => t === type)) {
        return;
      }
      localTypes.push(type);
    },
  };
}
