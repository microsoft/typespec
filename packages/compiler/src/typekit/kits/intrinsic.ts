import type { ErrorType, NeverType, NullType, UnknownType, VoidType } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

export interface IntrinsicKit {
  /** The intrinsic 'any' type. */
  get any(): UnknownType;
  /** The intrinsic 'error' type. */
  get error(): ErrorType;
  /** The intrinsic 'never' type. */
  get never(): NeverType;
  /** The intrinsic 'null' type. */
  get null(): NullType;
  /** The intrinsic 'void' type. */
  get void(): VoidType;
}

interface TypekitExtension {
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
