import type { Program } from "../core/program.js";
import { Realm } from "../experimental/realm.js";
import { type Typekit } from "./define-kit.js";

export { createDiagnosable, Diagnosable } from "./create-diagnosable.js";
export { defineKit, type Typekit } from "./define-kit.js";
export {
  ArrayKit,
  BuiltinKit,
  EntityKit,
  EnumKit,
  EnumMemberDescriptor,
  EnumMemberKit,
  IntrinsicKit,
  LiteralKit,
  ModelDescriptor,
  ModelKit,
  ModelPropertyDescriptor,
  ModelPropertyKit,
  OperationDescriptor,
  OperationKit,
  RecordKit,
  ScalarKit,
  TupleKit,
  TypeTypekit,
  UnionDescriptor,
  UnionKit,
  UnionVariantDescriptor,
  UnionVariantKit,
  ValueKit,
} from "./kits/index.js";

const DEFAULT_REALM = Symbol.for("TypeSpec.Typekit.DEFAULT_TYPEKIT_REALM");

interface DefaultRealmStore {
  [DEFAULT_REALM]?: Realm;
}

function _$(realm: Realm): Typekit;
function _$(program: Program): Typekit;
function _$(arg: Realm | Program): Typekit {
  let realm: Realm;
  if (Object.hasOwn(arg, "projectRoot")) {
    // arg is a Program
    realm = (arg as DefaultRealmStore)[DEFAULT_REALM] ??= new Realm(
      arg as Program,
      "default typekit realm",
    );
  } else {
    // arg is a Realm
    realm = arg as Realm;
  }

  return realm.typekit;
}

/**
 * Typekit - Utilities for working with TypeSpec types.
 *
 * Each typekit is associated with a Realm in which it operates.
 *
 * You can get the typekit associated with that realm by calling
 * `$` with the realm as an argument, or by calling `$` with a program
 * as an argument (in this case, it will use that program's default
 * typekit realm or create one if it does not already exist).
 *
 * @example
 * ```ts
 * import { Realm } from "@typespec/compiler/experimental";
 * import { $ } from "@typespec/compiler/typekit";
 *
 * const realm = new Realm(program, "my custom realm");
 *
 * const clone = $(realm).type.clone(inputType);
 * ```
 *
 * @example
 * ```ts
 * import { $ } from "@typespec/compiler/typekit";
 *
 * const clone = $(program).type.clone(inputType);
 * ```
 *
 * @see {@link Realm}
 */
export const $ = _$;
