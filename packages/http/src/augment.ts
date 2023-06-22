import { $ideDoc, DecoratorContext, ignoreDiagnostics } from "@typespec/compiler";
import { getAllHttpServices } from "./operations.js";

export function $onAugment(context: DecoratorContext) {
  if (!context.program.compilerOptions.designTimeBuild) {
    // we only add IDE docs, so don't do this in non-IDE builds
    return;
  }
  const services = ignoreDiagnostics(getAllHttpServices(context.program));
  for (const service of services) {
    for (const operation of service.operations) {
      context.call(
        $ideDoc,
        operation.operation,
        `${operation.verb.toUpperCase()} ${operation.path}`
      );
    }
  }
}
