import { mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";

export interface ModelsProps {
  path?: string;
  types: Type[];
}

export function Models(props: ModelsProps) {
  return <ts.SourceFile path={props.path ?? "models.ts"}>
      {mapJoin(
        props.types,
        (type) => {
            return <ef.TypeDeclaration export type={type} />
        },
        { joiner: "\n\n" }
      )}
    </ts.SourceFile>;
}
