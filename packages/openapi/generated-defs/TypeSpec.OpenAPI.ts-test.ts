/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import {
  $defaultResponse,
  $extension,
  $externalDocs,
  $info,
  $operationId,
} from "@typespec/openapi";
import type {
  DefaultResponseDecorator,
  ExtensionDecorator,
  ExternalDocsDecorator,
  InfoDecorator,
  OperationIdDecorator,
} from "./TypeSpec.OpenAPI.js";

type Decorators = {
  $operationId: OperationIdDecorator;
  $extension: ExtensionDecorator;
  $defaultResponse: DefaultResponseDecorator;
  $externalDocs: ExternalDocsDecorator;
  $info: InfoDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $operationId,
  $extension,
  $defaultResponse,
  $externalDocs,
  $info,
};
