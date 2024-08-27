import { Children, Declaration, DeclarationProps, Indent, mapJoin, Scope } from "@alloy-js/core";
import { usePythonNamePolicy } from "../name-policy.js";
import { Model, ModelProperty } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClassVariable, Decorator, DecoratorProps, InitDeclaration, TypeExpression, useModule } from "./index.js";

/**
 * Represents the properties for a class declaration.
 */
export interface ClassDeclarationProps extends DeclarationProps {
  type: Model;
  decorators?: DecoratorProps[];
  extends?: Children;
}

export function ClassDeclaration(props: ClassDeclarationProps) {
  const namer = usePythonNamePolicy();

  const moduleContext = useModule();

  if ($.type.isTemplateDeclaration(props.type)) {
    return undefined;
  }

  const name = props.name ?? namer.getName(props.type.name, "class");

  // TODO: Sort the model properties based on presence of decorator to separate class and instance variables.
  const classProperties: ModelProperty[] = [];
  const instanceProperties: ModelProperty[] = [];

  for (const prop of props.type.properties.values()) {
    // FIXME: This should be triggered based on the presence of the @classVariable decorator.
    // But I can't get it to work. I suspect something isn't being exported fully, but it's
    // a distraction right now so I'll just use this wonky magic string for testing.
    if (prop.name === "special") {
      classProperties.push(prop);
    } else {
      instanceProperties.push(prop);
    }
  }

  const classVariableComponents = mapJoin(
    classProperties,
    (prop) => <ClassVariable type={prop} />,
    { ender: "\n" } 
  );
  const initializerComponents = instanceProperties.length === 0 ? undefined : <InitDeclaration parameters={instanceProperties}/>;

  // TODO: Implement these
  const methodComponents = undefined;
  const baseClass = props.type.baseModel;
  const baseClassComponent = baseClass ? <>(<TypeExpression type={baseClass} />)</> : undefined;
  const decoratorComponents = mapJoin(
    props.decorators ?? [],
    (decorator) => <Decorator {...decorator} />,
    { ender: "\n" }
  );

  // if the class has no contents (no variables, no methods), then we can just pass
  let pass: string | undefined = undefined;
  if (!classVariableComponents?.length && !initializerComponents && !methodComponents && !props.children) {
    pass = "pass";
  }

  return (
    <Declaration {...props}>
      {decoratorComponents}class {name}{baseClassComponent}:
      <Indent>
        <Scope name={name} kind="class">
          {classVariableComponents}{initializerComponents}{methodComponents}{props.children}{pass}
        </Scope>
      </Indent>
    </Declaration>
  );
}
