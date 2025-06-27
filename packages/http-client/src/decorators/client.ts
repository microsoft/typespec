import {
  ClientDecorator,
  ClientDecoratorOptions,
} from "../../generated-defs/TypeSpec.HttpClient.js";
import { StateKeys } from "../lib.js";

export const $client: ClientDecorator = (context, target, options: ClientDecoratorOptions = {}) => {
  const explicitClientState = context.program.stateMap(StateKeys.explicitClient);
  explicitClientState.set(target, options);
};
