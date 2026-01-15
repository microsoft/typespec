import { For } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useDeclarationProvider, useTsp } from "@typespec/emitter-framework";
import * as ef from "@typespec/emitter-framework/typescript";
import { useClientLibrary } from "@typespec/http-client";

export interface ModelsProps {
  path?: string;
}

export function Models(props: ModelsProps) {
  const { $ } = useTsp();
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  const dp = useDeclarationProvider();
  return (
    <ts.SourceFile path={props.path ?? "models.ts"}>
      <For each={dataTypes} hardline>
        {(type) => {
          if (!dp.isDeclaration(type)) {
            return;
          }

          return <ef.TypeDeclaration export type={type} refkey={dp.getRefkey(type)} />;
        }}
      </For>
    </ts.SourceFile>
  );
}
