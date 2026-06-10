type DecoratorContext = {
  program: object;
};

type DecoratorTarget = {
  name: string;
};

export function $blue(context: DecoratorContext, target: DecoratorTarget): void {
  void context;
  void target;
}
