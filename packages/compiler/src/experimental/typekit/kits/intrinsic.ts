import type {
  ErrorType,
  NeverType,
  NullType,
  Type,
  UnknownType,
  VoidType,
} from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

/** @experimental */
export interface IntrinsicKit {
  /** The intrinsic 'any' type. */
  get any(): Type;
  /** The intrinsic 'error' type. */
  get error(): Type;
  /** The intrinsic 'never' type. */
  get never(): Type;
  /** The intrinsic 'null' type. */
  get null(): Type;
  /** The intrinsic 'void' type. */
  get void(): Type;
}

interface TypekitExtension {
  /** @experimental */
  intrinsic: IntrinsicKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  intrinsic: {
    get any(): UnknownType {
      return this.program.checker.anyType;
    },
    get error(): ErrorType {
      return this.program.checker.errorType;
    },
    get never(): NeverType {
      return this.program.checker.neverType;
    },
    get null(): NullType {
      return this.program.checker.nullType;
    },
    get void(): VoidType {
      return this.program.checker.voidType;
    },
  },
});
