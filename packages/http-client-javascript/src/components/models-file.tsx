import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";

export interface ModelsFileProps {
  path?: string;
  types: Type[];
}

export function ModelsFile(props: ModelsFileProps) {
  return (
    <ts.SourceFile path={props.path ?? "models.ts"}>
      {props.types.map((type) => (
        <ef.TypeDeclaration export type={type} />
      ))}
    </ts.SourceFile>
  );
}
