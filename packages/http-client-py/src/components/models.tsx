import { For, refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { useTsp } from "@typespec/emitter-framework";
import {
  ClassDeclaration,
  EnumDeclaration,
  TypeAliasDeclaration,
} from "@typespec/emitter-framework/python";
import { useClientLibrary } from "@typespec/http-client";

export interface ModelsProps {
  path?: string;
}

/**
 * Emits a `models.py` file with one declaration per data type discovered by the
 * shared http-client `ClientLibrary`:
 *
 *   - `Enum` → `EnumDeclaration`
 *   - `Model` / `Interface` → `ClassDeclaration` (becomes a `@dataclass` via EF)
 *   - everything else → `TypeAliasDeclaration`
 *
 * Anonymous `Array<T>` / `Record<T>` types are skipped — they're rendered inline
 * by `TypeExpression` wherever they're referenced.
 */
export function Models(props: ModelsProps) {
  const { $ } = useTsp();
  const clientLibrary = useClientLibrary();
  const dataTypes = clientLibrary.dataTypes;
  return (
    <py.SourceFile
      path={props.path ?? "models.py"}
      futureImports={[<py.FutureStatement feature="annotations" />]}
    >
      <For each={dataTypes} hardline>
        {(type) => {
          if ($.array.is(type) || $.record.is(type)) {
            return null;
          }
          switch (type.kind) {
            case "Enum":
              return <EnumDeclaration type={type} refkey={refkey(type)} />;
            case "Model":
              return <ClassDeclaration type={type} refkey={refkey(type)} />;
            default:
              return <TypeAliasDeclaration type={type} refkey={refkey(type)} />;
          }
        }}
      </For>
    </py.SourceFile>
  );
}
