import { TypeSpecProtobufLibrary } from "./lib.js";

/** TypeSpec namespace containing the public Protobuf decorators and types. */
export const namespace = "TypeSpec.Protobuf";

export * from "./proto.js";

/** Library definition used by the compiler to register Protobuf diagnostics and emitter options. */
export const $lib = TypeSpecProtobufLibrary;
/** @internal */
export { $decorators } from "./tsp-index.js";
