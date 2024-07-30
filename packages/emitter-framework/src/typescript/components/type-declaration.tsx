import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import {
  InterfaceDeclaration,
  UnionDeclaration
} from "@typespec/emitter-framework/typescript";

export interface TypeDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  name?: string;
  type?: Type
}

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export function TypeDeclaration(props: TypeDeclarationProps) {
  if (!props.type) {
    return <ts.TypeDeclaration {...props as WithRequired<ts.TypeDeclarationProps, "name">} />
  }

  switch (props.type.kind) {
    case "Model":
      return <InterfaceDeclaration type={props.type} />
    case "Union":
      return <UnionDeclaration type={props.type} />
  }
}
