import { Child, Children, DeclarationProps, Indent, mapJoin, refkey, Scope } from "@alloy-js/core";
import { usePythonNamePolicy } from "../name-policy.js";
import { Model, Enum, ModelProperty, EnumMember } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClassVariable, Declaration, Decorator, DecoratorProps, InitDeclaration, PythonModuleContext, TypeExpression } from "./index.js";

export enum ClassDeclarationFlags {
  None      = 0,
  Enum      = 1 << 0,
  Dataclass = 1 << 1,
}

export interface ClassDeclarationContext {
  parent: PythonModuleContext | ClassDeclarationContext; // TODO: | FunctionDeclarationContext | MethodDeclarationContext;
  flags: ClassDeclarationFlags;
}

/**
 * Represents the properties for a class declaration.
 */
export interface ClassDeclarationProps extends DeclarationProps {
  type?: Model | Enum;
  name?: string;
  docstring?: string | null;
  decorators?: DecoratorProps[];
  extends?: string[]; // needs to also include references
  dataclass?: boolean;
  children?: Children;
}

export function ClassDeclaration(props: ClassDeclarationProps) {
  const namer = usePythonNamePolicy();
  const type = props.type;

  let name: string;
  const instanceProperties: ModelProperty[] = [];
  const classProperties: (ModelProperty | EnumMember)[] = [];
  let baseClassComponent: Child | undefined;
  if (type?.kind == "Model") {
    if ($.type.isTemplateDeclaration(type)) {
      return undefined;
    }
    name = props.name ?? namer.getName(type.name, "class");
    for (const prop of type.properties.values()) {
      instanceProperties.push(prop);
    }
    const baseClass = type.baseModel;
    baseClassComponent = baseClass ? <>(<TypeExpression type={baseClass} />)</> : undefined;
  } else if (type?.kind == "Enum") {
    name = props.name ?? namer.getName(type.name, "class");
    for (const member of type.members.values()) {
      classProperties.push(member);
    }
  } else {
    if (!props.name) {
      throw new Error("ClassDeclaration must have a name when type is not specified.");
    }
    name = props.name;
  }

  const classVariableComponents = mapJoin(
    classProperties,
    (prop) => <ClassVariable type={prop} />,
    { ender: "\n" } 
  );
  const initializerComponents = instanceProperties.length === 0 ? undefined : <InitDeclaration parameters={instanceProperties}/>;

  // TODO: Implement these
  const methodComponents = undefined;
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

  // give props a refkey and ensure the name is reflected since it will be used by Declaration
  props.refkey = refkey(props.type);
  props.name = name;
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
