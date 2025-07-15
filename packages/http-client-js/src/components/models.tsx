import { For, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTsp } from "@typespec/emitter-framework";
import * as ef from "@typespec/emitter-framework/typescript";
import { useClientLibrary } from "@typespec/http-client";

export interface ModelsProps {
  path?: string;
}

export function Models(props: ModelsProps) {
  const { $ } = useTsp();
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  return (
    <ts.SourceFile path={props.path ?? "models.ts"}>
      <For each={dataTypes} hardline>
        {(type) => {
          return $.array.is(type) || $.record.is(type) ? null : (
            <ef.TypeDeclaration export type={type} refkey={refkey(type)} />
          );
        }}
      </For>
    </ts.SourceFile>
  );
}
