import { mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";

export interface ModelsFileProps {
  path?: string;
  types: Type[];
}

export function ModelsFile(props: ModelsFileProps) {
  const declarations: Set<Type> = new Set();

  return (
    <ts.SourceFile path={props.path ?? "models.ts"}>
      {mapJoin(
        props.types,
        (type) => {
          if(!declarations.has(type)) {
            declarations.add(type);
            return <ef.TypeDeclaration export type={type} />
          }
        },
        { joiner: ";\n" }
      )}
    </ts.SourceFile>
  );
}
