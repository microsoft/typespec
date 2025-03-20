import {
  isTemplateDeclaration,
  type DecoratorFunction,
  type Model,
  type Type,
} from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";

export function createDataDecorator<
  T extends DecoratorFunction,
  Target extends Type = Parameters<T>[1],
>(key: symbol, validate?: (...args: Parameters<T>) => boolean) {
  const [getData, setData] = useStateMap<Target, Parameters<T>[2]>(key);
  const decorator = (...args: Parameters<T>) => {
    if (validate && !validate(...args)) {
      return;
    }
    const [context, target, value] = args;
    setData(context.program, target, value);
  };
  return [getData, setData, decorator as T] as const;
}

export function includeDerivedModel(model: Model): boolean {
  return (
    !isTemplateDeclaration(model) &&
    (model.templateMapper?.args === undefined ||
      model.templateMapper.args?.length === 0 ||
      model.derivedModels.length > 0)
  );
}
