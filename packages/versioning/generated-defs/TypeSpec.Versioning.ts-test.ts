/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import {
  $added,
  $madeOptional,
  $removed,
  $renamedFrom,
  $returnTypeChangedFrom,
  $typeChangedFrom,
  $useDependency,
  $versioned,
} from "@typespec/versioning";
import type {
  AddedDecorator,
  MadeOptionalDecorator,
  RemovedDecorator,
  RenamedFromDecorator,
  ReturnTypeChangedFromDecorator,
  TypeChangedFromDecorator,
  UseDependencyDecorator,
  VersionedDecorator,
} from "./TypeSpec.Versioning.js";

type Decorators = {
  $versioned: VersionedDecorator;
  $useDependency: UseDependencyDecorator;
  $added: AddedDecorator;
  $removed: RemovedDecorator;
  $renamedFrom: RenamedFromDecorator;
  $madeOptional: MadeOptionalDecorator;
  $typeChangedFrom: TypeChangedFromDecorator;
  $returnTypeChangedFrom: ReturnTypeChangedFromDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $versioned,
  $useDependency,
  $added,
  $removed,
  $renamedFrom,
  $madeOptional,
  $typeChangedFrom,
  $returnTypeChangedFrom,
};
