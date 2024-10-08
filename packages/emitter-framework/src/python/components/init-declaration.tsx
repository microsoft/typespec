import { Children, Declaration, DeclarationProps, mapJoin, Scope } from "@alloy-js/core";
import { usePythonNamePolicy } from "../name-policy.js";
import { Model, ModelProperty } from "@typespec/compiler";
import { Docstring, TypeExpression, useClass } from "./index.js";
import { $ } from "@typespec/compiler/typekit";

export interface InitDeclarationProps extends Omit<DeclarationProps, "name"> {
  type?: Model;
  children?: Children;
}

export function InitDeclaration(props: InitDeclarationProps) {
  const namer = usePythonNamePolicy();
  const parent = useClass();
  if (!parent) {
    throw new Error("InitDeclaration must be a child of a ClassDeclaration.");
  }

  // build up the signature parameter list
  const args = [...(props.type?.properties.values() ?? [])].filter((prop) => !$.literal.is(prop.type));
  const argsClause = mapJoin(args, (arg) => {
    const pythonName = namer.getName(arg.name, "parameter");
    return <>{pythonName}: <TypeExpression type={arg.type}/></>;
  },
  {joiner: ", "});

  // build up the body of the initializer with defaults or the contents of the children
  let childrenClause: Children;
  if (!props.children && !args) {
    childrenClause = "pass";
  } else if (!props.children && args) {
    // map instance variables to self assignments
    childrenClause = mapJoin(args, (prop: ModelProperty) => {
      const pythonName = namer.getName(prop.name, "parameter");
      return <>self.{pythonName} = {pythonName}</>
    }, {joiner: "\n"});
  } else {
    childrenClause = props.children;
  }
  let docstring = `Initializes an instance of ${parent.className}.`;
  if (args) {
    docstring += "\n";
    for (const arg of args) {
      const argDoc = $.type.getDoc(arg);
      docstring += `\n:param ${arg.name}: ${argDoc}`;
    }
  }
  return (
    <Declaration {...props} name={"__init__"}>
      def __init__(self, {argsClause}):
        <Scope name="__init__" kind='method'>
          <Docstring children={docstring} />{childrenClause}
        </Scope>
    </Declaration>
  );
}
