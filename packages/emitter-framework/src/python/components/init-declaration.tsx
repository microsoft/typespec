import { Children, Declaration, DeclarationProps, mapJoin, Scope } from "@alloy-js/core";
import { usePythonNamePolicy } from "../name-policy.js";
import { ModelProperty } from "@typespec/compiler";
import { TypeExpression } from "./index.js";

export interface InitDeclarationProps extends Omit<DeclarationProps, "name"> {
  parameters?: ModelProperty[];
}

export function InitDeclaration(props: InitDeclarationProps) {
  const namer = usePythonNamePolicy();

  // build up the signature parameter list
  const argsClause = mapJoin(props.parameters ?? [], (prop) => {
    const pythonName = namer.getName(prop.name, "parameter");
    return <>{pythonName}: <TypeExpression type={prop.type}/></>;
  },
  {joiner: ", "});

  // build up the body of the initializer with defaults or the contents of the children
  let childrenClause: Children;
  if (!props.children && !props.parameters) {
    childrenClause = "pass";
  } else if (!props.children && props.parameters) {
    // map instance variables to self assignments
    childrenClause = mapJoin(props.parameters ?? [], (prop: ModelProperty) => {
      const pythonName = namer.getName(prop.name, "parameter");
      return <>self.{pythonName} = {pythonName}</>
    }, {joiner: "\n"});
  } else {
    childrenClause = props.children;
  }
  return (
    <Declaration {...props} name={"__init__"}>
      def __init__(self, {argsClause}):
        <Scope name="__init__" kind='method'>
          {childrenClause}
        </Scope>
    </Declaration>
  );
}
