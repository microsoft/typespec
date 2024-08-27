import { mapJoin, memo } from "@alloy-js/core";

export interface ImportSymbol {
  package: string;
  name?: string;
  wildcard?: boolean;
}

export interface ImportStatementsProps {
  imports: ImportSymbol[];
}

export function ImportStatements(props: ImportStatementsProps) {
  return memo(() =>
    mapJoin(props.imports, (importProp) =>
      () => <ImportStatement {...importProp} />));
}

export function ImportStatement(props: ImportSymbol) {
  return (
    <>
      import {props.package}.{props.wildcard ? "*" : props.name}
    </>
  )
}
