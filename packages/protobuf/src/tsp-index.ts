import { TypeSpecProtobufDecorators } from "../generated-defs/TypeSpec.Protobuf.js";
import { TypeSpecProtobufPrivateDecorators } from "../generated-defs/TypeSpec.Protobuf.Private.js";
import {
  $_map,
  $externRef,
  $field,
  $message,
  $package,
  $reserve,
  $service,
  $stream,
} from "./proto.js";

export { TypeSpecProtobufLibrary as $lib } from "./lib.js";
/** @internal */
export const $decorators = {
  "TypeSpec.Protobuf": {
    message: $message,
    field: $field,
    reserve: $reserve,
    service: $service,
    package: $package,
    stream: $stream,
  } satisfies TypeSpecProtobufDecorators,
  "TypeSpec.Protobuf.Private": {
    externRef: $externRef,
    _map: $_map,
  } satisfies TypeSpecProtobufPrivateDecorators,
};
