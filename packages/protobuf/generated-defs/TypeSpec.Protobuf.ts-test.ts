/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $field, $message, $package, $reserve, $service, $stream } from "@typespec/protobuf";
import type {
  FieldDecorator,
  MessageDecorator,
  PackageDecorator,
  ReserveDecorator,
  ServiceDecorator,
  StreamDecorator,
} from "./TypeSpec.Protobuf.js";

type Decorators = {
  $message: MessageDecorator;
  $field: FieldDecorator;
  $reserve: ReserveDecorator;
  $service: ServiceDecorator;
  $package: PackageDecorator;
  $stream: StreamDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $message,
  $field,
  $reserve,
  $service,
  $package,
  $stream,
};
