import { Type } from "@typespec/compiler";
import {
  unsafe_MutatorFlow,
  unsafe_MutatorRecord,
  unsafe_MutatorWithNamespace,
} from "@typespec/compiler/experimental";
import { getClientNameOverride } from "../decorators/client-name.js";

export const buildClientNameMutator: (scope: string | undefined) => unsafe_MutatorWithNamespace = (
  scope,
) => ({
  name: "client-name-mutator",
  Namespace: getMutatorRecord(scope),
  Interface: getMutatorRecord(scope),
  Model: getMutatorRecord(scope),
  ModelProperty: getMutatorRecord(scope),
  Enum: getMutatorRecord(scope),
  EnumMember: getMutatorRecord(scope),
  Union: getMutatorRecord(scope),
  UnionVariant: getMutatorRecord(scope),
  Operation: getMutatorRecord(scope),
  Scalar: getMutatorRecord(scope),
  Tuple: getMutatorRecord(scope),
});

function getMutatorRecord<T extends Type>(scope: string | undefined): unsafe_MutatorRecord<T> {
  return {
    filter: (type, program) => {
      const hasOverrideName = getClientNameOverride(program, type as any, scope);
      return hasOverrideName ? unsafe_MutatorFlow.MutateAndRecur : unsafe_MutatorFlow.DoNotMutate;
    },
    mutate(original, clone, program) {
      const originalNamedType = original as Type & { name: string };
      const nameOverride =
        getClientNameOverride(program, originalNamedType, scope) ?? originalNamedType.name;
      (clone as any).name = nameOverride;
    },
  };
}
