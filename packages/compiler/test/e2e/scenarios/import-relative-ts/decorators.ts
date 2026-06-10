type DecoratorContext = {
  program: {
    compilerVersion?: string;
  };
};

type DecoratorTarget = {
  name: string;
};

export function $blue(context: DecoratorContext, target: DecoratorTarget): void {
  if (context.program.compilerVersion === "__never__" && target.name === "__never__") {
    throw new Error("Unreachable branch for e2e fixture.");
  }
}
