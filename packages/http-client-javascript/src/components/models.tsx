import { mapJoin, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/typekit";
import * as ef from "@typespec/emitter-framework/typescript";
import { useClientLibrary } from "@typespec/http-client-library";
import { getFileTypeReference } from "./static-helpers/multipart-helpers.jsx";

export interface ModelsProps {
  path?: string;
}

export function Models(props: ModelsProps) {
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  return <ts.SourceFile path={props.path ?? "models.ts"}>
      {mapJoin(
        dataTypes,
        (type) => {
          if($.model.is(type) && $.model.isHttpFile(type)) {
            return <ts.TypeDeclaration name="File" export kind="type" refkey={refkey(type)}>
              {getFileTypeReference()}
            </ts.TypeDeclaration>
          }
            return <ef.TypeDeclaration export type={type} />
        },
        { joiner: "\n\n" }
      )}
    </ts.SourceFile>;
}
