/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $defaultResponse, $extension, $externalDocs, $operationId } from "@typespec/openapi";
import {
  DefaultResponseDecorator,
  ExtensionDecorator,
  ExternalDocsDecorator,
  OperationIdDecorator,
} from "./decorators.js";

type Decorators = {
  $operationId: OperationIdDecorator;
  $extension: ExtensionDecorator;
  $defaultResponse: DefaultResponseDecorator;
  $externalDocs: ExternalDocsDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $operationId,
  $extension,
  $defaultResponse,
  $externalDocs,
};
